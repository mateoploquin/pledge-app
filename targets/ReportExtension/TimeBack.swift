import DeviceActivity
import SwiftUI

extension DeviceActivityReport.Context {
  /// The limit step: what the chosen apps took a day last week, and what the
  /// limit the user is setting gives back, a day and over a life.
  static let timeBack = Self("timeBack")
}

struct TimeBackModel {
  /// Time on the chosen apps over last week (0 means nothing recorded).
  var total: TimeInterval = 0
  var style = ReportStyle.load()
}

struct TimeBackReport: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .timeBack
  let content: (TimeBackModel) -> TimeBackView

  func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> TimeBackModel {
    var model = TimeBackModel()
    for await device in data {
      for await segment in device.activitySegments {
        model.total += segment.totalActivityDuration
      }
    }
    return model
  }
}

/// The limit step's answer, one sentence (owner, 18 Nov 2026: "It has to be
/// OBVIOUS what it means. Anything else is noise."): "You get back / 8 years
/// / of your life." The years are what the limit saves a day against last
/// week's daily time on the chosen apps, over an 80-year life; with no data
/// for these apps, the average day (3 h 45 min). The limit comes from the
/// app through the App Group as the slider moves, checked here ten times a
/// second and redrawn only when it changes. Same drawing as TimeBackFallback
/// in set-time-limit.tsx.
struct TimeBackView: View {
  let model: TimeBackModel

  private var cream: Color { model.style.textColor }
  private var muted: Color { model.style.mutedColor }

  /// Minutes a day on the chosen apps, last week.
  private var perDay: Int {
    model.total > 0 ? Int((model.total / 60 / 7).rounded()) : Int(averageDayHours * 60)
  }

  /// The limit as last read; the view redraws only when it changes.
  @State private var limit = TimeBackView.readLimit()

  private static func readLimit() -> Int {
    max(0, ReportStyle.defaults?.integer(forKey: "pledgeReport.limitMinutes") ?? 0)
  }

  var body: some View {
    // Polled, not redrawn: a TimelineView rebuilt the whole picture ten times
    // a second and on the owner's phone it kept blinking out (18 Nov 2026).
    content(limit: limit)
      .onReceive(Timer.publish(every: 0.1, on: .main, in: .common).autoconnect()) { _ in
        let now = TimeBackView.readLimit()
        if now != limit { limit = now }
      }
  }

  private func content(limit: Int) -> some View {
    let back = max(0, perDay - limit)
    let life = lifeParts(Double(back) / 60)
    return VStack(alignment: .leading, spacing: 0) {
      if back > 0 {
        Text("You get back")
          .font(.custom("Inter-Regular", size: 22))
          .foregroundColor(muted)
        Text("\(life.value) \(life.unit)")
          .font(.custom("Inter-SemiBold", size: 64))
          .tracking(-1.6)
          .foregroundColor(cream)
          .lineLimit(1)
          .minimumScaleFactor(0.5)
        Text("of your life.")
          .font(.custom("Inter-Regular", size: 22))
          .foregroundColor(cream)
      } else {
        Text("You already stay under this.")
          .font(.custom("Inter-Regular", size: 22))
          .foregroundColor(muted)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}
