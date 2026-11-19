import DeviceActivity
import ExpoModulesCore
import FamilyControls
import os
import SwiftUI

/// Embeds Apple's `DeviceActivityReport` view. The system launches our
/// ReportExtension in a sandbox to draw the user's real Screen Time for the
/// requested context and filter; nothing about the numbers comes back here.
private let reportLog = Logger(subsystem: "com.pledgecompany.pledge", category: "report")

final class PledgeActivityReportView: ExpoView {
  private var host: UIHostingController<AnyView>?
  /// Bumped on every render: a new identity makes SwiftUI create a fresh
  /// report view instead of reviving one the extension may have dropped.
  private var generation = 0
  /// What the current report was built from; an identical request keeps it
  /// instead of restarting the sandboxed extension (which could come back blank).
  private var lastKey: String?

  var context = "totalActivity"
  var startMs: Double = 0
  var endMs: Double = 0
  var segment = "daily"
  var selection: FamilyActivitySelection?
  /// The selections as the app last sent them, so a repeat is ignored. The
  /// report's identity sorts the tokens (`stableKey`): re-encoding a decoded
  /// selection is not stable, its sets can come out in another order, and
  /// the report restarted on every slider tick (owner's phone log, build 36,
  /// 19 Nov 2026).
  private var selectionRaw: String?
  private var selectionsRaw: [String] = []

  var textColor: String?
  var mutedColor: String?
  var accentColor: String?
  var fontSize: Double = 0
  var maxApps: Int = 0
  /// "recovered" only: the first pledge's start, and every pledge's selection.
  var anchorMs: Double = 0
  var selections: [FamilyActivitySelection] = []
  /// "timeBack" only: the daily limit being set. Not part of the report's
  /// identity: the extension reads it from the App Group as it changes, so
  /// moving the slider never restarts the report.
  var limitMinutes: Int = -1

  private static let appGroup =
    Bundle.main.object(forInfoDictionaryKey: "REACT_NATIVE_DEVICE_ACTIVITY_APP_GROUP") as? String

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    reportLog.log("view created")
  }

  func setSelection(_ b64: String?) {
    if b64 == selectionRaw, selection != nil || b64 == nil { return }
    selectionRaw = b64
    guard let b64, let data = Data(base64Encoded: b64) else {
      selection = nil
      return
    }
    selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
  }

  func setSelections(_ list: [String]?) {
    if (list ?? []) == selectionsRaw, !selections.isEmpty || (list ?? []).isEmpty { return }
    selectionsRaw = list ?? []
    selections = (list ?? []).compactMap { b64 in
      guard let data = Data(base64Encoded: b64) else { return nil }
      return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
    }
  }

  /// The same apps, categories and sites always give the same key, whatever
  /// order their sets come out in.
  private static func stableKey(_ s: FamilyActivitySelection) -> String {
    func keys<T: Encodable>(_ tokens: Set<T>) -> String {
      tokens.compactMap { (try? JSONEncoder().encode($0))?.base64EncodedString() }.sorted().joined(separator: ".")
    }
    return [keys(s.applicationTokens), keys(s.categoryTokens), keys(s.webDomainTokens)].joined(separator: "/")
  }

  /// All running pledges' apps, categories and sites, each counted once.
  private func unionOfSelections() -> FamilyActivitySelection {
    var union = FamilyActivitySelection()
    for s in selections {
      union.applicationTokens.formUnion(s.applicationTokens)
      union.categoryTokens.formUnion(s.categoryTokens)
      union.webDomainTokens.formUnion(s.webDomainTokens)
    }
    return union
  }

  /// Style goes through the shared App Group because the extension cannot
  /// receive parameters any other way.
  private func publishStyle() {
    guard let d = UserDefaults(suiteName: Self.appGroup) else { return }
    d.set(textColor, forKey: "pledgeReport.textColor")
    d.set(mutedColor, forKey: "pledgeReport.mutedColor")
    d.set(accentColor, forKey: "pledgeReport.accentColor")
    d.set(fontSize, forKey: "pledgeReport.fontSize")
    d.set(maxApps, forKey: "pledgeReport.maxApps")
    publishLimit()
    if context == "timeBack" {
      d.set(try? JSONEncoder().encode(selection), forKey: "pledgeReport.timeBack.selection")
    }
    if context == "recovered" {
      d.set(anchorMs, forKey: "pledgeReport.recovered.anchorMs")
      d.set(try? JSONEncoder().encode(unionOfSelections()), forKey: "pledgeReport.recovered.selection")
    }
  }

  /// "timeBack": the limit, written only when it changed.
  private func publishLimit() {
    guard limitMinutes >= 0, let d = UserDefaults(suiteName: Self.appGroup) else { return }
    if d.object(forKey: "pledgeReport.limitMinutes") as? Int != limitMinutes {
      d.set(limitMinutes, forKey: "pledgeReport.limitMinutes")
    }
  }

  func render() {

    let now = Date()
    let start = startMs > 0 ? Date(timeIntervalSince1970: startMs / 1000) : Calendar.current.startOfDay(for: now)
    var end = endMs > 0 ? Date(timeIntervalSince1970: endMs / 1000) : now
    if end <= start { end = start.addingTimeInterval(60) }
    let interval = DateInterval(start: start, end: end)

    let segmentInterval: DeviceActivityFilter.SegmentInterval
    switch segment {
    case "hourly": segmentInterval = .hourly(during: interval)
    case "weekly": segmentInterval = .weekly(during: interval)
    default: segmentInterval = .daily(during: interval)
    }

    // "recovered" reads everything on this iPhone and picks the pledged apps
    // out itself, so it can show the phone's total next to them; blocks only
    // apply on this phone, so an iPad's use would not be Pledge's doing.
    // "timeBack" reads everything too and picks the chosen apps out itself:
    // filtered to the apps, it never drew on phones (19 Nov 2026).
    let filter = context == "recovered"
      ? DeviceActivityFilter(segment: segmentInterval, users: .all, devices: .init([.iPhone]))
      : context == "timeBack"
      ? DeviceActivityFilter(segment: segmentInterval, users: .all, devices: .init([.iPhone, .iPad]))
      : DeviceActivityFilter(
        segment: segmentInterval,
        users: .all,
        devices: .init([.iPhone, .iPad]),
        applications: selection?.applicationTokens ?? [],
        categories: selection?.categoryTokens ?? [],
        webDomains: selection?.webDomainTokens ?? [])

    let selectionKey = selection.map(Self.stableKey) ?? ""
    let selectionsKey = selections.map(Self.stableKey).joined(separator: ",")
    let key = [context, "\(start.timeIntervalSince1970)", "\(end.timeIntervalSince1970)", segment, selectionKey,
               selectionsKey, textColor ?? "", mutedColor ?? "", accentColor ?? "", "\(fontSize)", "\(maxApps)", "\(anchorMs)"]
      .joined(separator: "|")
    if key == lastKey, host != nil {
      // Only the limit can have changed (it's not part of the key): write
      // just that, so moving the slider touches nothing else.
      publishLimit()
      host?.view.frame = bounds
      return
    }
    reportLog.log("report (re)started: \(self.context, privacy: .public), had one: \(self.lastKey != nil, privacy: .public)")
    lastKey = key
    publishStyle()

    generation += 1
    let root = AnyView(
      DeviceActivityReport(DeviceActivityReport.Context(context), filter: filter)
        .id(generation)
        .frame(maxWidth: .infinity, maxHeight: .infinity))

    if let host {
      host.rootView = root
    } else {
      let controller = UIHostingController(rootView: root)
      controller.view.backgroundColor = .clear
      controller.view.isUserInteractionEnabled = false
      addSubview(controller.view)
      host = controller
    }
    host?.view.frame = bounds
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    host?.view.frame = bounds
  }
}

public class PledgeActivityReportModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PledgeActivityReport")

    /// True when the ReportExtension is inside this build. Store builds can
    /// ship without it while Apple reviews its Family Controls approval; the
    /// app then hides every Screen Time panel instead of drawing a blank.
    Function("isExtensionBundled") { () -> Bool in
      // ExtensionKit extensions live in Extensions/; older builds put it in PlugIns/.
      let candidates = [
        Bundle.main.bundleURL.appendingPathComponent("Extensions/ReportExtension.appex").path,
        Bundle.main.bundleURL.appendingPathComponent("PlugIns/ReportExtension.appex").path,
      ]
      return candidates.contains { FileManager.default.fileExists(atPath: $0) }
    }

    View(PledgeActivityReportView.self) {
      Prop("context") { (view: PledgeActivityReportView, value: String?) in
        view.context = value ?? "totalActivity"
      }
      Prop("startMs") { (view: PledgeActivityReportView, value: Double?) in
        view.startMs = value ?? 0
      }
      Prop("endMs") { (view: PledgeActivityReportView, value: Double?) in
        view.endMs = value ?? 0
      }
      Prop("segment") { (view: PledgeActivityReportView, value: String?) in
        view.segment = value ?? "daily"
      }
      Prop("familyActivitySelection") { (view: PledgeActivityReportView, value: String?) in
        view.setSelection(value)
      }
      Prop("textColor") { (view: PledgeActivityReportView, value: String?) in
        view.textColor = value
      }
      Prop("mutedColor") { (view: PledgeActivityReportView, value: String?) in
        view.mutedColor = value
      }
      Prop("accentColor") { (view: PledgeActivityReportView, value: String?) in
        view.accentColor = value
      }
      Prop("fontSize") { (view: PledgeActivityReportView, value: Double?) in
        view.fontSize = value ?? 0
      }
      Prop("maxApps") { (view: PledgeActivityReportView, value: Int?) in
        view.maxApps = value ?? 0
      }
      Prop("anchorMs") { (view: PledgeActivityReportView, value: Double?) in
        view.anchorMs = value ?? 0
      }
      Prop("familyActivitySelections") { (view: PledgeActivityReportView, value: [String]?) in
        view.setSelections(value)
      }
      Prop("limitMinutes") { (view: PledgeActivityReportView, value: Int?) in
        view.limitMinutes = value ?? -1
      }
      OnViewDidUpdateProps { (view: PledgeActivityReportView) in
        view.render()
      }
    }
  }
}
