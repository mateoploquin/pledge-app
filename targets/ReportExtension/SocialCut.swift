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

/// One beat of the story: a sentence opening on its time frame, a big
/// number, a line.
struct Beat {
  let frame: String
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
/// app's title above says "Let's look at your screen time." Then beat by
/// beat, a week, a month, a year and a life, each told in order (owner,
/// 18 Nov 2026: "dots, phrase, number, so that the human can read it"): the
/// last words go, the squares grow, then the phrase, then the number. The
/// life's squares flood past their box and fade before its words. 24-hour
/// days, an 80-year life, from last week's Screen Time on all devices. A
/// report can't be tapped, so it plays on its own. Same story and timings
/// as AverageStory in screen-time-mirror.tsx.
struct SocialCutView: View {
  let model: SocialCutModel

  enum Phase { case out, grow, lead, number }

  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @State private var beat = 0
  @State private var phase = Phase.grow
  /// Hours in the pile; grows with each beat.
  /// How far the current beat's squares have grown, 0 to 1.
  @State private var growth: Double = 0
  @Environment(\.displayScale) private var displayScale
  /// The life's squares have faded; then the pile makes way for the words.
  @State private var pileGone = false
  @State private var pileRemoved = false

  private var cream: Color { model.style.textColor }
  private var muted: Color { model.style.mutedColor }
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
    // Told to the user, straight (owner, 18 Nov 2026: "look at the user dead
    // straight and show him his problem"). Every beat opens on its time
    // frame and ends "on your phone." Month, year and lifetime are last
    // week's pace carried forward; with no data, the average.
    let tail = "on your phone."
    // Direct words (owner, 18 Nov 2026): "this week", "this month".
    return [
      Beat(frame: "This week", lead: ", you spent", value: week.value, unit: week.unit, tail: tail),
      Beat(frame: "This month", lead: ", you'll spend", value: month.value, unit: month.unit, tail: tail),
      Beat(frame: "This year", lead: ", you'll spend", value: year.value, unit: year.unit, tail: tail),
      Beat(frame: "In your life", lead: ", you'll spend", value: life.value, unit: life.unit, tail: tail),
    ]
  }

  /// The squares' story: hours at each beat, the beat being drawn, pixels.
  private var pile: Pile {
    Pile(counts: pileSizes.map { Int($0.rounded()) }, beat: beat, pixel: 1 / displayScale)
  }

  var body: some View {
    let all = beats
    VStack(alignment: .leading, spacing: 18) {
      if !pileRemoved {
        // The time, drawn (owner, 18 Nov 2026): one ivory square per hour.
        VStack(alignment: .leading, spacing: 10) {
          PileCount(pile: pile, e: growth)
            .font(.custom("Inter-Medium", size: 11))
            .tracking(1.54)
            .foregroundColor(tertiary)
          PileShape(pile: pile, e: growth)
            .fill(cream)
            .frame(height: 160)
            // The life floods down over where the words were (they're hidden
            // then) and fades out before the bottom of the report.
            .mask(alignment: .top) {
              LinearGradient(
                stops: [.init(color: .black, location: 0.55), .init(color: .clear, location: 0.95)],
                startPoint: .top, endPoint: .bottom
              )
              .frame(height: 420)
            }
        }
        .opacity(pileGone ? 0 : 1)
      }
      words(all[min(beat, all.count - 1)])
    }
    .padding(.top, 8)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .task { await play(all.count) }
  }

  /// Inter only, the same shape every beat (owner, 18 Nov 2026): the time
  /// frame, the number with its unit, the same few words after.
  private func words(_ b: Beat) -> some View {
    let showLead = phase == .lead || phase == .number
    let showNumber = phase == .number
    return VStack(alignment: .leading, spacing: 4) {
      // A sentence to the user, the time frame in it bold and bright.
      (Text(b.frame).font(.custom("Inter-SemiBold", size: 26)).foregroundColor(cream)
        + Text(b.lead).font(.custom("Inter-Regular", size: 26)).foregroundColor(muted))
        .tracking(-0.39)
        .fixedSize(horizontal: false, vertical: true)
        .opacity(showLead ? 1 : 0)
        .offset(y: showLead ? 0 : 10)
      VStack(alignment: .leading, spacing: 4) {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
          Text("\(b.value)")
            .font(.custom("Inter-SemiBold", size: 96))
            .tracking(-4.8)
            .foregroundColor(cream)
            .lineLimit(1)
            .minimumScaleFactor(0.5)
          Text(b.unit)
            .font(.custom("Inter-SemiBold", size: 44))
            .tracking(-0.88)
            .foregroundColor(cream)
        }
        Text(b.tail)
          .font(.custom("Inter-Regular", size: 20))
          .foregroundColor(muted)
      }
      .opacity(showNumber ? 1 : 0)
      .offset(y: showNumber ? 0 : 10)
    }
  }

  private func sleep(_ seconds: Double) async {
    try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
  }

  /// The story's timings; same as STORY in screen-time-mirror.tsx.
  private func play(_ count: Int) async {
    let last = count - 1
    if reduceMotion {
      beat = last
      phase = .number
      pileRemoved = true
      return
    }
    for i in 0..<count {
      if i > 0 {
        withAnimation(.easeIn(duration: 0.35)) { phase = .out }
        await sleep(0.35)
        beat = i
        phase = .grow
      }
      // The squares grow, in log steps. The life takes longer and starts slow
      // (ease in), so the screen fills over a few seconds and the count races
      // on past what can be shown; then the squares fade away.
      growth = 0
      if i == 0 { await sleep(0.3) }
      if i < last {
        // The week's squares come one by one at a steady beat (an eased count
        // lands most of them in one lump in the middle).
        let grow = i == 0 ? 1.6 : 1.7
        withAnimation(i == 0 ? .linear(duration: grow) : .easeInOut(duration: grow)) { growth = 1 }
        await sleep(grow)
      } else {
        withAnimation(.timingCurve(0.55, 0.085, 0.68, 0.53, duration: 4.5)) { growth = 1 }
        await sleep(4.5 + 0.9)
        withAnimation(.easeInOut(duration: 1.2)) { pileGone = true }
        await sleep(1.2)
        pileRemoved = true
      }
      withAnimation(.easeOut(duration: 0.5)) { phase = .lead }
      await sleep(0.8)
      withAnimation(.easeOut(duration: 0.5)) { phase = .number }
      if i < last { await sleep(0.5 + 2.6) }
    }
  }
}

/// The squares' story: hours at each beat (a week, a month, a year, a
/// life), the beat being drawn, and the screen's pixel size.
struct Pile {
  let counts: [Int]
  let beat: Int
  let pixel: Double

  /// The pile's box (set when drawn).
  var box: CGSize = .zero

  private var last: Int { counts.count - 1 }
  private var near: [Int] { counts.map { Int(Double($0).squareRoot().rounded(.up)) } }

  /// Beat k's square size if its pile, a near-square, fits the box (at
  /// least 6 squares across).
  private func fit(_ k: Int) -> Double {
    let c = near[k], r = Int((Double(counts[k]) / Double(c)).rounded(.up))
    return min(box.width / Double(max(c, 6)), box.height / Double(max(r, 6)))
  }

  private func snap(_ v: Double) -> Double { max((v / pixel).rounded() * pixel, 4) }

  /// The life keeps the year's square size (it stops zooming there) and its
  /// rows span exactly the box's width, so the flood ends flush on both sides
  /// (owner, 18 Nov 2026: a gap opened on the right as squares shrank).
  private var maxCols: Int { box.width > 0 ? Int(box.width / snap(fit(last - 1))) : Int.max }
  private var lifeSquare: Double { box.width / Double(maxCols) }

  /// Each beat's pile is a near-square of this many columns, never wider
  /// than the life's rows.
  var cols: [Int] { near.map { min($0, maxCols) } }

  /// Hours drawn when the beat has grown by e (0 to 1): the first beat counts
  /// up from nothing, the others grow in log steps from the beat before.
  func hours(_ e: Double) -> Double {
    // Exact at the end (exp/log can land a hair under, 1,368 for 1,369).
    if e >= 1 { return Double(counts[beat]) }
    if beat == 0 { return Double(counts[0]) * e }
    let a = log(Double(counts[beat - 1])), b = log(Double(counts[beat]))
    return exp(a + (b - a) * e)
  }

  /// Square size: each beat's pile fits the box, snapped to pixels, zooming
  /// between beats in log steps; the life at the year's size.
  func square(_ e: Double) -> Double {
    if beat == last { return lifeSquare }
    if beat == 0 { return snap(fit(0)) }
    return snap(exp(log(fit(beat - 1)) + (log(fit(beat)) - log(fit(beat - 1))) * e))
  }

  /// Row lengths: the beat before is a block in the top-left corner and the
  /// new squares fill the free cells row by row, so every row is a run from
  /// the left edge and a square never moves once placed. Same as pileRows in
  /// screen-time-mirror.tsx.
  func rows(_ n: Int, maxRows: Int) -> [Int] {
    var rows: [Int] = []
    if beat > 0 {
      var left = counts[beat - 1]
      while left > 0 && rows.count < maxRows {
        rows.append(min(left, cols[beat - 1]))
        left -= cols[beat - 1]
      }
    }
    var add = max(0, n - (beat > 0 ? counts[beat - 1] : 0))
    var y = 0
    while add > 0 && y < maxRows {
      let have = y < rows.count ? rows[y] : 0
      let free = cols[beat] - have
      let take = min(free, add)
      if y < rows.count { rows[y] = have + take } else { rows.append(take) }
      add -= take
      y += 1
    }
    return rows
  }
}

/// The time, drawn (owner, 18 Nov 2026): one ivory square per hour. A beat's
/// squares fill in around the last beat's while the view pulls back to fit
/// them in the box; at 4 pt it stops and the life floods down past the box,
/// fading out ("we feel, wow, that's a lot"). Only the squares that can be
/// on screen are drawn. Same drawing as Pile in screen-time-mirror.tsx.
struct PileShape: Shape {
  let pile: Pile
  var e: Double
  var animatableData: Double {
    get { e }
    set { e = newValue }
  }

  func path(in rect: CGRect) -> Path {
    var pile = self.pile
    pile.box = rect.size
    let n = Int(pile.hours(e).rounded(.down))
    let s = pile.square(e)
    let cell = s * (1 - 0.16)
    let maxCols = Int((rect.width + 40) / s) + 1
    var p = Path()
    for (y, len) in pile.rows(n, maxRows: Int((rect.height + 300) / s) + 1).enumerated() {
      for x in 0..<min(len, maxCols) {
        p.addRect(CGRect(x: rect.minX + Double(x) * s, y: rect.minY + Double(y) * s, width: cell, height: cell))
      }
    }
    return p
  }
}

/// "1,369 HOURS · ONE SQUARE, ONE HOUR", counting with the pile; hidden
/// until the first square.
struct PileCount: View, Animatable {
  let pile: Pile
  var e: Double
  var animatableData: Double {
    get { e }
    set { e = newValue }
  }

  var body: some View {
    let n = Int(pile.hours(e).rounded(.down))
    Text("\(n.formatted(.number.locale(Locale(identifier: "en_US")))) \(n == 1 ? "hour" : "hours") · one square, one hour".uppercased())
      .opacity(n >= 1 ? 1 : 0)
  }
}
