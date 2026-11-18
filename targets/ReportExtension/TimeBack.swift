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

/// "3 h 15 min", "45 min", "2 h".
func hoursMinutes(_ minutes: Int) -> String {
  let h = minutes / 60, m = minutes % 60
  if h > 0 && m > 0 { return "\(h) h \(m) min" }
  return h > 0 ? "\(h) h" : "\(m) min"
}

/// The limit step's picture (owner, 18 Nov 2026: "personalized to what we
/// saw on the first screen ... how many years of my life I'm getting back").
/// One square per 15 minutes of a day on the chosen apps, last week's
/// average: the limit's squares stay dim, the rest light up as time back.
/// Below, that time back a day, then over a life (80 years). The limit comes
/// from the app through the App Group as the slider moves, read here a few
/// times a second, so the picture follows the slider. With no data for
/// these apps, the average day (3 h 45 min). Same drawing as TimeBackFallback
/// in set-time-limit.tsx.
struct TimeBackView: View {
  let model: TimeBackModel

  private var cream: Color { model.style.textColor }
  private var muted: Color { model.style.mutedColor }
  /// color.textTertiary in the app's tokens.
  private let tertiary = Color(red: 0xA8 / 255, green: 0x94 / 255, blue: 0x88 / 255)

  /// Minutes a day on the chosen apps, last week.
  private var perDay: Int {
    model.total > 0 ? Int((model.total / 60 / 7).rounded()) : Int(averageDayHours * 60)
  }

  var body: some View {
    TimelineView(.periodic(from: .now, by: 0.1)) { _ in
      let limit = max(0, ReportStyle.defaults?.integer(forKey: "pledgeReport.limitMinutes") ?? 0)
      content(limit: limit)
    }
  }

  private func content(limit: Int) -> some View {
    let back = max(0, perDay - limit)
    let squares = min(Int((Double(perDay) / 15).rounded(.up)), 64)
    let kept = min(Int((Double(limit) / 15).rounded(.up)), squares)
    let life = lifeParts(Double(back) / 60)
    return VStack(alignment: .leading, spacing: 10) {
      Text((model.total > 0 ? "These apps, last week: \(hoursMinutes(perDay)) a day" : "An average day: \(hoursMinutes(perDay))")
        .uppercased())
        .font(.custom("Inter-Medium", size: 11))
        .tracking(1.54)
        .foregroundColor(tertiary)
      DaySquares(count: squares, dim: kept, color: cream)
        .animation(.easeOut(duration: 0.2), value: kept)
      if back > 0 {
        (Text(hoursMinutes(back)).font(.custom("Inter-SemiBold", size: 20)).foregroundColor(cream)
          + Text(" a day back.").font(.custom("Inter-Regular", size: 20)).foregroundColor(muted))
          .padding(.top, 8)
        HStack(alignment: .firstTextBaseline, spacing: 8) {
          Text("\(life.value) \(life.unit)")
            .font(.custom("Inter-SemiBold", size: 44))
            .tracking(-0.88)
            .foregroundColor(cream)
          Text("of your life, back.")
            .font(.custom("Inter-Regular", size: 20))
            .foregroundColor(muted)
        }
      } else {
        Text("You already stay under this.")
          .font(.custom("Inter-Regular", size: 20))
          .foregroundColor(muted)
          .padding(.top, 8)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

/// Sixteen squares to a row, 4 pt apart, the first `dim` faint.
struct DaySquares: View {
  let count: Int
  let dim: Int
  let color: Color

  var body: some View {
    GeometryReader { geo in
      let size = floor((geo.size.width - 4 * 15) / 16)
      VStack(alignment: .leading, spacing: 4) {
        ForEach(0..<Int((Double(count) / 16).rounded(.up)), id: \.self) { row in
          HStack(spacing: 4) {
            ForEach(0..<min(16, count - row * 16), id: \.self) { col in
              let i = row * 16 + col
              Rectangle()
                .fill(color.opacity(i < dim ? 0.16 : 1))
                .frame(width: size, height: size)
            }
          }
        }
      }
    }
    .frame(height: CGFloat(Int((Double(count) / 16).rounded(.up))) * 24)
  }
}
