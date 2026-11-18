import DeviceActivity
import ManagedSettings
import SwiftUI

extension DeviceActivityReport.Context {
  /// The onboarding mirror (Paper B1): last week's Screen Time told as a
  /// story, from a week to a lifetime.
  static let socialCut = Self("socialCut")
}

/// Apps counted as social media. Bundle IDs, not Apple's "Social" category:
/// that one files TikTok and YouTube under Entertainment. Messaging apps are
/// left out on purpose.
let socialMediaBundleIDs: Set<String> = [
  "com.burbn.instagram",
  "com.zhiliaoapp.musically",  // TikTok
  "com.toyopagroup.picaboo",  // Snapchat
  "com.google.ios.youtube",
  "com.facebook.Facebook",
  "com.atebits.Tweetie2",  // X
  "com.reddit.Reddit",
  "com.burbn.barcelona",  // Threads
  "pinterest",
  "AlexisBarreyat.BeReal",
  "com.linkedin.LinkedIn",
  "com.tumblr.tumblr",
  "xyz.blueskyweb.app",
  "tv.twitch",
  "com.hammerandchisel.discord",
]

/// Shown when Screen Time has nothing for the week (owner, 17 Nov 2026: never
/// an empty page): about 3h 45m a day on a phone, the worldwide average
/// (DataReportal 2024). Keep in sync with AVERAGE_DAY_HOURS in
/// src/screens/onboarding/setup/screen-time-mirror.tsx.
let averageDayHours: Double = 3.75

/// The life the last line is counted over. Keep in sync with LIFE_YEARS.
let lifeYears: Double = 80

/// A number and its unit: (36, "hours"), (45, "minutes").
func hoursParts(_ hours: Double) -> (value: Int, unit: String) {
  if hours >= 1 { let h = Int(hours.rounded()); return (h, h == 1 ? "hour" : "hours") }
  let m = max(1, Int((hours * 60).rounded()))
  return (m, m == 1 ? "minute" : "minutes")
}

/// Whole days, or hours under a day: (7, "days"), (9, "hours").
func daysParts(_ hours: Double) -> (value: Int, unit: String) {
  if hours < 24 { return hoursParts(hours) }
  let d = Int((hours / 24).rounded())
  return (d, d == 1 ? "day" : "days")
}

/// Whole years, or months under a year.
func lifeParts(_ hoursADay: Double) -> (value: Int, unit: String) {
  let years = hoursADay / 24 * lifeYears
  if years >= 1 { let y = Int(years.rounded()); return (y, y == 1 ? "year" : "years") }
  let months = max(1, Int((years * 12).rounded()))
  return (months, months == 1 ? "month" : "months")
}

/// One beat of the story: a line, a big number, a line.
struct Beat {
  let lead: String
  let value: Int
  let unit: String
  let tail: String
}

struct SocialCutModel {
  /// Social media time over the week.
  var social: TimeInterval = 0
  /// All Screen Time over the week (0 means nothing recorded yet).
  var total: TimeInterval = 0
  /// Social apps by time spent, most first (names the system gives us here).
  var topNames: [String] = []
  var style = ReportStyle.load()
}

struct SocialCutReport: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .socialCut
  let content: (SocialCutModel) -> SocialCutView

  func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> SocialCutModel {
    var model = SocialCutModel()
    var byApp: [String: (name: String, time: TimeInterval)] = [:]
    for await device in data {
      for await segment in device.activitySegments {
        model.total += segment.totalActivityDuration
        for await category in segment.categories {
          for await app in category.applications {
            guard let id = app.application.bundleIdentifier, socialMediaBundleIDs.contains(id) else { continue }
            model.social += app.totalActivityDuration
            let name = app.application.localizedDisplayName ?? id
            byApp[id] = (name, (byApp[id]?.time ?? 0) + app.totalActivityDuration)
          }
        }
      }
    }
    model.topNames = byApp.values.sorted { $0.time > $1.time }.prefix(3).map(\.name)
    return model
  }
}

/// The mirror as a story (owner, 17 Nov 2026: "people need a story"). The
/// app's title above says "Let's look at your screen time." Then one beat at
/// a time, each fading into the next: last week in hours, a month in days, a
/// year in days, and the last beat, which stays: a lifetime in years, "OF
/// YOUR Life." (24-hour days, an 80-year life, from last week's Screen Time on
/// all devices). A report can't be tapped, so it plays on its own.
struct SocialCutView: View {
  let model: SocialCutModel

  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @State private var beat = -1
  /// The current beat has settled and is drifting smaller.
  @State private var drifting = false
  /// Hours in the pile under the story; grows with each beat.
  @State private var pileHours: Double = 0
  /// The life has grown and the pile has faded away.
  @State private var pileGone = false

  private var cream: Color { model.style.textColor }
  private var muted: Color { model.style.mutedColor }
  private var solar: Color { model.style.accentColor }
  /// color.textTertiary in the app's tokens.
  private let tertiary = Color(red: 0xA8 / 255, green: 0x94 / 255, blue: 0x88 / 255)

  /// Hours on the phone at each beat: a week, 30 days, 365 days, a life.
  private var pileSizes: [Double] { [perDay * 7, perDay * 30, perDay * 365, perDay * 365 * lifeYears] }

  /// No Screen Time for the week yet (often right after access is granted):
  /// the average instead, told about most people.
  private var average: Bool { model.total == 0 }
  private var perDay: Double { average ? averageDayHours : model.total / 3600 / 7 }

  private var beats: [Beat] {
    let week = hoursParts(perDay * 7)
    let month = daysParts(perDay * 30)
    let year = daysParts(perDay * 365)
    let life = lifeParts(perDay)
    if average {
      return [
        Beat(lead: "Most people spend", value: week.value, unit: week.unit, tail: "a week on their phone."),
        Beat(lead: "In a month, that's", value: month.value, unit: month.unit, tail: "looking down."),
        Beat(lead: "In a year, it adds up to", value: year.value, unit: year.unit, tail: ""),
        Beat(lead: "", value: life.value, unit: life.unit, tail: "OF YOUR"),
      ]
    }
    return [
      Beat(lead: "Last week, you spent", value: week.value, unit: week.unit, tail: "on your phone."),
      Beat(lead: "In a month, that's", value: month.value, unit: month.unit, tail: "looking down."),
      Beat(lead: "In a year, it adds up to", value: year.value, unit: year.unit, tail: ""),
      Beat(lead: "If you keep going like this, that's", value: life.value, unit: life.unit, tail: "OF YOUR"),
    ]
  }

  var body: some View {
    let all = beats
    VStack(alignment: .leading, spacing: 10) {
      story(all)
      // The time, drawn (owner, 18 Nov 2026): one square per hour.
      VStack(alignment: .leading, spacing: 10) {
        PileCount(logHours: log(max(pileHours, 1)))
          .font(.custom("Inter-Medium", size: 11))
          .tracking(1.54)
          .foregroundColor(tertiary)
        PileShape(logHours: log(max(pileHours, 1)))
          .fill(solar)
          .frame(height: 128)
      }
      .opacity(pileGone ? 0 : 1)
    }
    .padding(.top, 16)
    .task { await play(all.count) }
  }

  private func story(_ all: [Beat]) -> some View {
    ZStack(alignment: .topLeading) {
      ForEach(Array(all.enumerated()), id: \.offset) { i, b in
        beatView(b, last: i == all.count - 1)
          .opacity(beat == i ? 1 : 0)
          // Zooming out (owner, 18 Nov 2026): a beat arrives from bigger,
          // drifts smaller while it's read, and shrinks away for the next.
          .scaleEffect(scale(i), anchor: .leading)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  private func beatView(_ b: Beat, last: Bool) -> some View {
    VStack(alignment: .leading, spacing: 4) {
      // A blank lead keeps the number where the other beats put it.
      Text(b.lead.isEmpty ? " " : b.lead)
        .font(.custom("Inter-Regular", size: 20))
        .foregroundColor(muted)
        .fixedSize(horizontal: false, vertical: true)
      HStack(alignment: .firstTextBaseline, spacing: 10) {
        Text("\(b.value)")
          .font(.custom("Inter-SemiBold", size: 112))
          .tracking(-5.6)
          .foregroundColor(cream)
          .lineLimit(1)
          .minimumScaleFactor(0.5)
        Text(b.unit)
          .font(.custom("Inter-Medium", size: 36))
          .tracking(-0.72)
          .foregroundColor(cream)
      }
      if last {
        // "Life." in manuscript (Great Vibes), capital L, ivory (owner, 18 Nov 2026).
        HStack(alignment: .firstTextBaseline, spacing: 12) {
          Text(b.tail)
            .font(.custom("NotoSerifDisplay-Regular", size: 30))
            .tracking(0.3)
            .foregroundColor(cream)
          Text("Life.")
            .font(.custom("GreatVibes-Regular", size: 60))
            .foregroundColor(cream)
        }
        // Great Vibes' capital L rises well above the font's ascent: room for it.
        .padding(.top, 18)
      } else if !b.tail.isEmpty {
        Text(b.tail)
          .font(.custom("Inter-Regular", size: 20))
          .foregroundColor(muted)
      }
    }
  }

  private func scale(_ i: Int) -> CGFloat {
    if beat == i { return drifting ? 0.95 : 1 }
    return beat < i ? 1.3 : 0.7
  }

  /// About 3.2 s a beat; the last one stays. Same timings as ZoomOut in
  /// screen-time-mirror.tsx.
  private func play(_ count: Int) async {
    let sizes = pileSizes
    if reduceMotion {
      beat = count - 1
      pileHours = sizes[count - 1]
      pileGone = true
      return
    }
    pileHours = sizes[0]
    try? await Task.sleep(nanoseconds: 300_000_000)
    for i in 0..<count {
      withAnimation(.easeOut(duration: 0.8)) {
        beat = i
        drifting = false
      }
      // The pile grows in step, in log steps. The life takes longer and
      // starts slow (ease in), so the screen fills over a few seconds and the
      // count races on past what can be shown; then the squares fade away.
      if i < count - 1 {
        withAnimation(.easeInOut(duration: 1.7)) { pileHours = sizes[i] }
      } else {
        withAnimation(.timingCurve(0.55, 0.085, 0.68, 0.53, duration: 5)) { pileHours = sizes[i] }
        Task {
          try? await Task.sleep(nanoseconds: 5_900_000_000)
          withAnimation(.easeInOut(duration: 1.4)) { pileGone = true }
        }
      }
      try? await Task.sleep(nanoseconds: 800_000_000)
      withAnimation(.linear(duration: i < count - 1 ? 2.4 : 3.2)) { drifting = true }
      if i < count - 1 { try? await Task.sleep(nanoseconds: 2_400_000_000) }
    }
  }

}

/// The pile: one square per hour on the phone, in rows of a near-square
/// filled like a calendar. Through the
/// week, the month and the year the view pulls back to fit it in its box
/// (at least 6 squares across); then it stops at 5 pt squares and the life
/// grows past the box and out of the report's frame (owner, 18 Nov 2026:
/// "we feel, wow, that's a lot"). Animates in log hours. Only the squares
/// that can be on screen are drawn. Same drawing as Pile in
/// screen-time-mirror.tsx.
struct PileShape: Shape {
  var logHours: Double
  var animatableData: Double {
    get { logHours }
    set { logHours = newValue }
  }

  func path(in rect: CGRect) -> Path {
    let n = max(1, Int(exp(logHours).rounded(.down)))
    let side = max(Double(n).squareRoot(), 6)
    // Whole points, as in the app (keeps squares on the pixel grid).
    let s = max(floor(min(rect.width / side, rect.height / side)), 5)
    let cell = s * (1 - 0.16)
    let corner = s > 6 ? min(cell * 0.2, 3) : 0
    // The report is at most a screen tall; anything past that is clipped.
    let width = Int(Double(n).squareRoot().rounded(.up))
    let cols = min(width, Int((rect.width + 40) / s) + 1)
    let rows = Int((rect.height + 500) / s) + 1
    var p = Path()
    for y in 0..<rows {
      for x in 0..<cols {
        // Rows of a near-square, filled like a calendar: only the last row
        // is ever short.
        let i = y * width + x
        if i >= n { continue }
        let r = CGRect(x: rect.minX + Double(x) * s, y: rect.minY + Double(y) * s, width: cell, height: cell)
        if corner > 0 { p.addRoundedRect(in: r, cornerSize: CGSize(width: corner, height: corner)) } else { p.addRect(r) }
      }
    }
    return p
  }
}

/// "1,369 HOURS · ONE SQUARE, ONE HOUR", counting with the pile.
struct PileCount: View, Animatable {
  var logHours: Double
  var animatableData: Double {
    get { logHours }
    set { logHours = newValue }
  }

  var body: some View {
    let n = Int(exp(logHours).rounded())
    Text("\(n.formatted(.number.locale(Locale(identifier: "en_US")))) \(n == 1 ? "hour" : "hours") · one square, one hour".uppercased())
  }
}
