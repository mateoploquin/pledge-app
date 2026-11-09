import DeviceActivity
import FamilyControls
import ManagedSettings
import SwiftUI

extension DeviceActivityReport.Context {
  /// Home: daily use of the pledged apps before Pledge vs since, and the time
  /// that came back.
  static let recovered = Self("recovered")
}

/// How the comparison is measured (see docs/product.md, "Time back"):
/// - only this iPhone (the filter sets the device);
/// - "pledged" is the apps, categories and sites of every running pledge,
///   counted once; "total" is everything on the phone;
/// - before = average over the 7 days before the first pledge's start day,
///   counting only days with any recorded use (no record means no history);
/// - now = average over full days after the start day, up to yesterday;
///   the start day mixes before and after, and today is not over yet;
/// - back = (before - now) x full days, never below zero.
struct RecoveredModel {
  enum Stage { case noHistory, baselineOnly, compared }

  var stage: Stage = .noHistory
  var beforePledged: TimeInterval = 0
  var nowPledged: TimeInterval = 0
  var beforeTotal: TimeInterval = 0
  var nowTotal: TimeInterval = 0
  var fullDays = 0
  var since = Date()
  var style = ReportStyle.load()

  var back: TimeInterval { max(0, beforePledged - nowPledged) * Double(fullDays) }

  static let baselineDays = 7
  /// Fewer days of history than this before the start and there is nothing fair to compare.
  static let minimumBaselineDays = 3
}

struct RecoveredReport: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .recovered
  let content: (RecoveredModel) -> RecoveredView

  func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> RecoveredModel {
    let defaults = ReportStyle.defaults
    let anchorMs = defaults?.double(forKey: "pledgeReport.recovered.anchorMs") ?? 0
    var selection = FamilyActivitySelection()
    if let raw = defaults?.data(forKey: "pledgeReport.recovered.selection"),
      let decoded = try? JSONDecoder().decode(FamilyActivitySelection.self, from: raw)
    {
      selection = decoded
    }

    let calendar = Calendar.current
    let anchor = anchorMs > 0 ? Date(timeIntervalSince1970: anchorMs / 1000) : Date()
    let anchorDay = calendar.startOfDay(for: anchor)
    let today = calendar.startOfDay(for: Date())

    var pledged: [Date: TimeInterval] = [:]
    var total: [Date: TimeInterval] = [:]
    for await device in data {
      for await segment in device.activitySegments {
        let day = calendar.startOfDay(for: segment.dateInterval.start)
        total[day, default: 0] += segment.totalActivityDuration
        for await category in segment.categories {
          // A pledged category counts whole; otherwise look at its apps and sites.
          if let token = category.category.token, selection.categoryTokens.contains(token) {
            pledged[day, default: 0] += category.totalActivityDuration
            continue
          }
          for await app in category.applications {
            if let token = app.application.token, selection.applicationTokens.contains(token) {
              pledged[day, default: 0] += app.totalActivityDuration
            }
          }
          for await site in category.webDomains {
            if let token = site.webDomain.token, selection.webDomainTokens.contains(token) {
              pledged[day, default: 0] += site.totalActivityDuration
            }
          }
        }
      }
    }

    let baseline = (1...RecoveredModel.baselineDays)
      .compactMap { calendar.date(byAdding: .day, value: -$0, to: anchorDay) }
      .filter { (total[$0] ?? 0) > 0 }
    var after: [Date] = []
    var day = calendar.date(byAdding: .day, value: 1, to: anchorDay) ?? today
    while day < today {
      after.append(day)
      day = calendar.date(byAdding: .day, value: 1, to: day) ?? today
    }

    func average(_ values: [Date: TimeInterval], over days: [Date]) -> TimeInterval {
      days.isEmpty ? 0 : days.reduce(0) { $0 + (values[$1] ?? 0) } / Double(days.count)
    }

    var model = RecoveredModel()
    model.since = anchor
    model.beforePledged = average(pledged, over: baseline)
    model.beforeTotal = average(total, over: baseline)
    model.nowPledged = average(pledged, over: after)
    model.nowTotal = average(total, over: after)
    model.fullDays = after.count
    if baseline.count < RecoveredModel.minimumBaselineDays {
      model.stage = .noHistory
    } else if after.isEmpty {
      model.stage = .baselineOnly
    } else {
      model.stage = .compared
    }
    return model
  }
}

/// Plays once when it appears: the "before" bar, the "now" bar under it, the
/// gap between them turns ember and lifts off, then "11h back." counts up.
/// Everything starts in its final state and is only reset for the animation
/// in onAppear, so a view that never animates still shows the numbers.
struct RecoveredView: View {
  let model: RecoveredModel

  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @State private var nowShown = true
  @State private var marked = true
  @State private var lifted = true
  @State private var backShown = true

  private var cream: Color { model.style.textColor }
  private var muted: Color { cream.opacity(0.6) }
  private var ember: Color { model.style.accentColor }

  private static let dateFormatter: DateFormatter = {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US")
    f.dateFormat = "MMM d"
    return f
  }()

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      switch model.stage {
      case .noHistory:
        Text("Not enough Screen Time from before your pledge to compare yet.")
          .font(.custom("Inter-Regular", size: 16))
          .foregroundColor(muted)
      case .baselineOnly:
        kicker("BEFORE PLEDGE")
        Text("\(formatDuration(model.beforePledged)) a day")
          .font(.custom("Inter-SemiBold", size: 44))
            .tracking(-0.02 * 44)
          .foregroundColor(cream)
          .padding(.top, 8)
        Text("on these apps. Your first full day counts from tomorrow.")
          .font(.custom("Inter-Regular", size: 15))
          .foregroundColor(muted)
          .padding(.top, 4)
      case .compared:
        compared
      }
      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .onAppear(perform: play)
  }

  private var compared: some View {
    VStack(alignment: .leading, spacing: 0) {
      kicker("A DAY ON THESE APPS")
      bars.padding(.top, 14)

      HStack(alignment: .firstTextBaseline, spacing: 10) {
        Text(backText)
          .font(.custom("Inter-SemiBold", size: 56))
            .tracking(-0.02 * 56)
          .foregroundColor(cream)
          .monospacedDigit()
        Text("back.")
          .font(.custom("Inter-Medium", size: 20))
          .foregroundColor(ember)
      }
      .opacity(backShown ? 1 : 0)
      .padding(.top, 22)

      Text(sinceLine)
        .font(.custom("Inter-Regular", size: 15))
        .foregroundColor(muted)
        .opacity(backShown ? 1 : 0)
        .padding(.top, 2)

      Text("All screen time: \(formatDuration(model.beforeTotal)) → \(formatDuration(model.nowTotal)) a day")
        .font(.custom("Inter-Regular", size: 13))
        .foregroundColor(muted)
        .opacity(backShown ? 1 : 0)
        .padding(.top, 14)
    }
  }

  private var bars: some View {
    let longest = max(model.beforePledged, model.nowPledged, 1)
    let gap = max(0, model.beforePledged - model.nowPledged)
    return GeometryReader { geo in
      let full = geo.size.width - 96
      VStack(alignment: .leading, spacing: 12) {
        row("Before", value: model.beforePledged) {
          ZStack(alignment: .leading) {
            Capsule().fill(cream)
              .frame(width: full * CGFloat(model.beforePledged / longest), height: 14)
            // The part of "before" that is gone now stays marked in ember...
            Capsule().fill(marked ? ember : cream)
              .frame(width: full * CGFloat(gap / longest), height: 14)
              .offset(x: full * CGFloat(model.nowPledged / longest))
              .opacity(gap > 0 ? 1 : 0)
            // ...and a copy of it lifts off and fades, on its way to the number.
            Capsule().fill(ember)
              .frame(width: full * CGFloat(gap / longest), height: 14)
              .offset(x: full * CGFloat(model.nowPledged / longest), y: lifted ? -30 : 0)
              .opacity(gap > 0 && marked && !lifted ? 1 : 0)
          }
        }
        row("Now", value: model.nowPledged) {
          Capsule().fill(cream)
            .frame(width: max(full * CGFloat(model.nowPledged / longest), 3), height: 14)
            .opacity(nowShown ? 1 : 0)
        }
      }
    }
    .frame(height: 58)
  }

  private func row<Bar: View>(_ label: String, value: TimeInterval, @ViewBuilder bar: () -> Bar) -> some View {
    HStack(spacing: 12) {
      Text(label.uppercased())
        .font(.custom("Inter-Medium", size: 11))
        .tracking(1.54)
        .foregroundColor(muted)
        .frame(width: 44, alignment: .leading)
      bar()
      Spacer(minLength: 0)
      Text(formatDuration(value))
        .font(.custom("Inter-Regular", size: 12))
        .foregroundColor(muted)
        .monospacedDigit()
        .fixedSize()
    }
  }

  private func kicker(_ text: String) -> some View {
    Text(text)
      .font(.custom("Inter-Medium", size: 11))
      .tracking(1.54)
      .foregroundColor(muted)
  }

  /// "11h", or minutes under an hour.
  private var backText: String {
    let back = model.back
    if back >= 3600 { return "\(Int((back / 3600).rounded()))h" }
    return "\(Int((back / 60).rounded()))m"
  }

  private var sinceLine: String {
    let date = Self.dateFormatter.string(from: model.since)
    if model.back == 0 { return "Not less than before yet. Since \(date)." }
    return "Since \(date), on the apps you pledged."
  }

  private func play() {
    guard model.stage == .compared, !reduceMotion else { return }
    var reset = Transaction()
    reset.disablesAnimations = true
    withTransaction(reset) {
      nowShown = false
      marked = false
      lifted = false
      backShown = false
    }
    let at: (Double, @escaping () -> Void) -> Void = { delay, change in
      DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: change)
    }
    at(0.5) { withAnimation(.easeOut(duration: 0.6)) { nowShown = true } }
    at(1.5) { withAnimation(.easeOut(duration: 0.4)) { marked = true } }
    at(2.3) { withAnimation(.timingCurve(0.4, 0, 0.2, 1, duration: 1.0)) { lifted = true } }
    at(3.1) { withAnimation(.easeOut(duration: 0.6)) { backShown = true } }
  }
}
