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
/// as AverageStory in screen-time-mirror.tsx, except that since 19 Nov 2026
/// the squares here are whole points, at least 4 pt, and the life no longer
/// pulls back (the app's copy still does; bring it over).
struct SocialCutView: View {
  let model: SocialCutModel

  /// The life adds three stops between its phrase and its last words.
  enum Phase: Int, Comparable {
    case out, grow, lead, that, count, years, number
    static func < (a: Phase, b: Phase) -> Bool { a.rawValue < b.rawValue }
  }

  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @State private var beat = 0
  @State private var phase = Phase.grow
  /// Hours in the pile; grows with each beat.
  /// How far the current beat's squares have grown, 0 to 1.
  @State private var growth: Double = 0
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
      Beat(frame: "In your life", lead: ".", value: life.value, unit: life.unit, tail: tail),
    ]
  }

  /// The squares' story: hours at each beat and the beat being drawn.
  private var pile: Pile {
    Pile(counts: pileSizes.map { Int($0.rounded()) }, beat: beat)
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
          // Drawn taller than its 160 pt box: the life floods down over
          // where the words were (they're hidden then) and fades out before
          // the bottom of the report. A week, month or year too big for the
          // box at the smallest square runs off its bottom edge, fading, and
          // never reaches the words below.
          let flood = beat == all.count - 1
          PileCanvas(pile: pile, e: growth, color: cream)
            .frame(height: flood ? 420 : 160, alignment: .top)
            .mask(alignment: .top) {
              LinearGradient(
                stops: flood
                  ? [.init(color: .black, location: 0.55), .init(color: .clear, location: 0.95)]
                  : [.init(color: .black, location: 1)],
                startPoint: .top, endPoint: .bottom
              )
            }
            .frame(height: 160, alignment: .top)
        }
        .opacity(pileGone ? 0 : 1)
      }
      if beat == all.count - 1 {
        lifeWords(all[beat])
      } else {
        words(all[min(beat, all.count - 1)])
      }
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

  /// The life, said slowly (owner, 18 Nov 2026: "In your life. Pause. Give a
  /// person time to understand what that means. That's 13. Pause. Years on
  /// your phone."): "In your life." alone, then "That's", the number, then
  /// "Years" big (capital Y), then "on your phone."
  private func lifeWords(_ b: Beat) -> some View {
    let unit = b.unit.prefix(1).uppercased() + b.unit.dropFirst()
    return VStack(alignment: .leading, spacing: 4) {
      reveal(phase >= .lead) {
        (Text(b.frame).font(.custom("Inter-SemiBold", size: 26)).foregroundColor(cream)
          + Text(b.lead).font(.custom("Inter-Regular", size: 26)).foregroundColor(muted))
          .tracking(-0.39)
      }
      reveal(phase >= .that) {
        Text("That's")
          .font(.custom("Inter-Regular", size: 26))
          .tracking(-0.39)
          .foregroundColor(muted)
      }
      HStack(alignment: .firstTextBaseline, spacing: 14) {
        reveal(phase >= .count) {
          Text("\(b.value)")
            .font(.custom("Inter-SemiBold", size: 96))
            .tracking(-4.8)
            .foregroundColor(cream)
            .lineLimit(1)
            .minimumScaleFactor(0.5)
        }
        reveal(phase >= .years) {
          // Inter like the rest of the page (owner, 18 Nov 2026), big.
          Text(unit)
            .font(.custom("Inter-SemiBold", size: 64))
            .tracking(-1.9)
            .foregroundColor(cream)
            .fixedSize()
        }
      }
      reveal(phase >= .number) {
        Text(b.tail)
          .font(.custom("Inter-Regular", size: 20))
          .foregroundColor(muted)
      }
    }
  }

  private func reveal<V: View>(_ shown: Bool, @ViewBuilder _ v: () -> V) -> some View {
    v().opacity(shown ? 1 : 0).offset(y: shown ? 0 : 10)
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
        // No pulling back to fit every hour (owner, 19 Nov 2026): for heavy
        // users that meant 150,000 one-point squares, grey mush on screen
        // and in any recording. The flood holds a moment, then fades.
        await sleep(4.5 + 1.0)
        withAnimation(.easeInOut(duration: 1.2)) { pileGone = true }
        await sleep(1.2)
        pileRemoved = true
      }
      withAnimation(.easeOut(duration: 0.5)) { phase = .lead }
      if i < last {
        await sleep(0.8)
        withAnimation(.easeOut(duration: 0.5)) { phase = .number }
        await sleep(0.5 + 2.6)
      } else {
        // STORY.life in screen-time-mirror.tsx.
        await sleep(2.2)
        withAnimation(.easeOut(duration: 0.5)) { phase = .that }
        await sleep(0.6)
        withAnimation(.easeOut(duration: 0.5)) { phase = .count }
        await sleep(1.8)
        withAnimation(.easeOut(duration: 1.1)) { phase = .years }
        await sleep(1.2)
        withAnimation(.easeOut(duration: 0.5)) { phase = .number }
      }
    }
  }
}

/// The squares' story: hours at each beat (a week, a month, a year, a
/// life) and the beat being drawn.
///
/// Every square and gap is a whole number of points (owner, 19 Nov 2026: on
/// a friend's phone the grid looked blurry and uneven). Whole points are
/// whole pixels on every iPhone, and a gap of at least 1 pt survives a
/// screen recording being scaled down; the old 0.64 pt gaps turned to mush.
/// The smallest square is 4 pt with a 1 pt gap, the same for everyone: a
/// pile too big for the box at that size runs off its bottom and fades
/// instead of shrinking to dust. One square is still one hour.
struct Pile {
  let counts: [Int]
  let beat: Int

  /// The pile's box (set when drawn).
  var box: CGSize = .zero

  /// The smallest step from one square to the next: a 4 pt square, 1 pt gap.
  static let minStep: Double = 5

  private var last: Int { counts.count - 1 }
  /// The life: it floods past the box.
  var isFlood: Bool { beat == last }
  private var near: [Int] { counts.map { Int(Double($0).squareRoot().rounded(.up)) } }

  /// Beat k's step if its pile, a near-square, fits the box (at least 6
  /// squares across).
  private func fit(_ k: Int) -> Double {
    let c = near[k], r = Int((Double(counts[k]) / Double(c)).rounded(.up))
    return min(box.width / Double(max(c, 6)), box.height / Double(max(r, 6)))
  }

  /// Whole points, never under the smallest step. Rounded down so a pile
  /// that fits the box still fits.
  private func snap(_ v: Double) -> Double { max(v.rounded(.down), Pile.minStep) }

  /// The year's step; the life floods on at the same size.
  private var lastStep: Double { box.width > 0 ? snap(fit(last - 1)) : Pile.minStep }

  /// The widest rows: as many whole steps as fit the box.
  private var maxCols: Int { box.width > 0 ? max(1, Int(box.width / lastStep)) : Int.max }

  /// Each beat's pile is a near-square of this many columns; one too tall
  /// for the box at its size widens first (up to the box's width) and only
  /// then runs off the bottom. The life's rows are the full width.
  var cols: [Int] {
    near.enumerated().map { k, c in
      if k == last || box.height <= 0 { return k == last ? maxCols : min(c, maxCols) }
      let fitRows = max(1, Int(box.height / snap(fit(k))))
      let need = Int((Double(counts[k]) / Double(fitRows)).rounded(.up))
      return min(max(c, need), maxCols)
    }
  }

  /// Hours drawn when the beat has grown by e (0 to 1): the first beat counts
  /// up from nothing, the others grow in log steps from the beat before.
  func hours(_ e: Double) -> Double {
    // Exact at the end (exp/log can land a hair under, 1,368 for 1,369).
    if e >= 1 { return Double(counts[beat]) }
    if beat == 0 { return Double(counts[0]) * e }
    let a = log(Double(counts[beat - 1])), b = log(Double(counts[beat]))
    return exp(a + (b - a) * e)
  }

  /// The step from one square to the next and the square drawn in it, both
  /// whole points: the gap is about a sixth of the step, at least 1 pt.
  func cell(_ e: Double) -> (square: Double, cell: Double) {
    let s = square(e)
    let gap = max(1, (s * 0.16).rounded())
    return (s, s - gap)
  }

  /// The step: each beat's pile fits the box, in whole points, zooming
  /// between beats in log steps; the life at the year's size.
  func square(_ e: Double) -> Double {
    if beat == last { return lastStep }
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
/// them in the box; at the smallest square it stops, and the life floods
/// down past the box and fades ("we feel, wow, that's a lot"). Each row is
/// one dashed line, a dash per square, so even a big life draws cheaply.
/// The box is the top 160 pt; for the life the canvas runs on below it.
struct PileCanvas: View, Animatable {
  let pile: Pile
  var e: Double
  let color: Color
  var animatableData: Double {
    get { e }
    set { e = newValue }
  }

  var body: some View {
    Canvas { ctx, size in
      var pile = self.pile
      pile.box = CGSize(width: size.width, height: 160)
      let n = Int(pile.hours(e).rounded(.down))
      let (s, cell) = pile.cell(e)
      guard s > 0 else { return }
      let visibleCols = Int(size.width / s) + 1
      let rows = pile.rows(n, maxRows: Int(size.height / s) + 1)
      let style = StrokeStyle(lineWidth: cell, dash: [cell, s - cell])
      func row(_ y: Int, _ len: Int) -> Path {
        var p = Path()
        let count = min(len, visibleCols)
        guard count > 0 else { return p }
        let mid = Double(y) * s + cell / 2
        p.move(to: CGPoint(x: 0, y: mid))
        p.addLine(to: CGPoint(x: Double(count) * s - (s - cell), y: mid))
        return p
      }
      // A week, month or year that overruns its box fades over its last
      // 40 pt; the life's flood is faded by the view's mask.
      let fade = 40.0
      if !pile.isFlood && Double(rows.count) * s > size.height {
        for (y, len) in rows.enumerated() {
          let top = Double(y) * s
          let alpha = min(1, max(0, (size.height - top) / fade))
          guard alpha > 0 else { break }
          ctx.stroke(row(y, len), with: .color(color.opacity(alpha)), style: style)
        }
      } else {
        var p = Path()
        for (y, len) in rows.enumerated() { p.addPath(row(y, len)) }
        ctx.stroke(p, with: .color(color), style: style)
      }
    }
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
