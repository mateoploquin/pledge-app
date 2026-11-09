import DeviceActivity
import ExpoModulesCore
import FamilyControls
import SwiftUI

/// Embeds Apple's `DeviceActivityReport` view. The system launches our
/// ReportExtension in a sandbox to draw the user's real Screen Time for the
/// requested context and filter; nothing about the numbers comes back here.
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

  var textColor: String?
  var mutedColor: String?
  var accentColor: String?
  var fontSize: Double = 0
  var maxApps: Int = 0
  /// "recovered" only: the first pledge's start, and every pledge's selection.
  var anchorMs: Double = 0
  var selections: [FamilyActivitySelection] = []

  private static let appGroup =
    Bundle.main.object(forInfoDictionaryKey: "REACT_NATIVE_DEVICE_ACTIVITY_APP_GROUP") as? String

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
  }

  func setSelection(_ b64: String?) {
    guard let b64, let data = Data(base64Encoded: b64) else {
      selection = nil
      return
    }
    selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
  }

  func setSelections(_ list: [String]?) {
    selections = (list ?? []).compactMap { b64 in
      guard let data = Data(base64Encoded: b64) else { return nil }
      return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
    }
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
    if context == "recovered" {
      d.set(anchorMs, forKey: "pledgeReport.recovered.anchorMs")
      d.set(try? JSONEncoder().encode(unionOfSelections()), forKey: "pledgeReport.recovered.selection")
    }
  }

  func render() {
    publishStyle()

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
    let filter = context == "recovered"
      ? DeviceActivityFilter(segment: segmentInterval, users: .all, devices: .init([.iPhone]))
      : DeviceActivityFilter(
        segment: segmentInterval,
        users: .all,
        devices: .init([.iPhone, .iPad]),
        applications: selection?.applicationTokens ?? [],
        categories: selection?.categoryTokens ?? [],
        webDomains: selection?.webDomainTokens ?? [])

    let selectionKey = (try? JSONEncoder().encode(selection)).map { $0.base64EncodedString() } ?? ""
    let selectionsKey = selections.compactMap { (try? JSONEncoder().encode($0))?.base64EncodedString() }.joined(separator: ",")
    let key = [context, "\(start.timeIntervalSince1970)", "\(end.timeIntervalSince1970)", segment, selectionKey,
               selectionsKey, textColor ?? "", mutedColor ?? "", accentColor ?? "", "\(fontSize)", "\(maxApps)", "\(anchorMs)"]
      .joined(separator: "|")
    if key == lastKey, host != nil {
      host?.view.frame = bounds
      return
    }
    lastKey = key

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
      OnViewDidUpdateProps { (view: PledgeActivityReportView) in
        view.render()
      }
    }
  }
}
