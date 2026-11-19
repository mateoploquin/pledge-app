import DeviceActivity
import FamilyControls
import ManagedSettings
import os
import SwiftUI

let timeBackLog = Logger(subsystem: "com.pledgecompany.pledge.ReportExtension", category: "timeBack")

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

  /// Reads everything and picks the chosen apps out itself, like the mirror
  /// and Home's time back: asked with the apps as a filter, the report never
  /// drew on phones (19 Nov 2026). If the data hasn't come in two seconds it
  /// draws from the average day rather than nothing.
  func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> TimeBackModel {
    timeBackLog.log("configuration started")
    let race = Race<TimeInterval>()
    Task { race.finish(await Self.chosenTime(data)) }
    Task {
      try? await Task.sleep(nanoseconds: 2_000_000_000)
      if race.finish(0) { timeBackLog.error("data timed out, drawing the average day") }
    }
    var model = TimeBackModel()
    model.total = await race.value
    timeBackLog.log("configuration done, minutes a week: \(Int(model.total / 60), privacy: .public)")
    return model
  }

  /// Last week's time on the chosen apps, categories and sites.
  private static func chosenTime(_ data: DeviceActivityResults<DeviceActivityData>) async -> TimeInterval {
    var selection = FamilyActivitySelection()
    if let raw = ReportStyle.defaults?.data(forKey: "pledgeReport.timeBack.selection"),
      let decoded = try? JSONDecoder().decode(FamilyActivitySelection.self, from: raw)
    {
      selection = decoded
    }
    var total: TimeInterval = 0
    for await device in data {
      for await segment in device.activitySegments {
        for await category in segment.categories {
          if let token = category.category.token, selection.categoryTokens.contains(token) {
            total += category.totalActivityDuration
            continue
          }
          for await app in category.applications {
            if let token = app.application.token, selection.applicationTokens.contains(token) {
              total += app.totalActivityDuration
            }
          }
          for await site in category.webDomains {
            if let token = site.webDomain.token, selection.webDomainTokens.contains(token) {
              total += site.totalActivityDuration
            }
          }
        }
      }
    }
    return total
  }
}

/// The first of two answers wins; the other is dropped.
final class Race<T>: @unchecked Sendable {
  private let lock = NSLock()
  private var result: T?
  private var waiter: CheckedContinuation<T, Never>?

  /// True when this answer was the first.
  @discardableResult
  func finish(_ value: T) -> Bool {
    lock.lock()
    guard result == nil else { lock.unlock(); return false }
    result = value
    let w = waiter
    waiter = nil
    lock.unlock()
    w?.resume(returning: value)
    return true
  }

  var value: T {
    get async {
      await withCheckedContinuation { c in
        lock.lock()
        if let result { lock.unlock(); c.resume(returning: result); return }
        waiter = c
        lock.unlock()
      }
    }
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
    let _ = timeBackLog.log("drawn, limit \(limit, privacy: .public)")
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
