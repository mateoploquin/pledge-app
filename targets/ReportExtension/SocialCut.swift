import DeviceActivity
import ManagedSettings
import SwiftUI

extension DeviceActivityReport.Context {
  /// The onboarding mirror: last week's bars, the social media part of each
  /// day breaking off, and the hours that would come back.
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

struct DayUsage: Identifiable {
  let id: Date
  var total: TimeInterval
  var social: TimeInterval
}

struct SocialCutModel {
  var days: [DayUsage] = []
  var style = ReportStyle.load()
  var social: TimeInterval { days.reduce(0) { $0 + $1.social } }
}

struct SocialCutReport: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .socialCut
  let content: (SocialCutModel) -> SocialCutView

  func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> SocialCutModel {
    var byDay: [Date: DayUsage] = [:]
    let calendar = Calendar.current
    for await device in data {
      for await segment in device.activitySegments {
        let day = calendar.startOfDay(for: segment.dateInterval.start)
        var usage = byDay[day] ?? DayUsage(id: day, total: 0, social: 0)
        usage.total += segment.totalActivityDuration
        for await category in segment.categories {
          for await app in category.applications {
            if let id = app.application.bundleIdentifier, socialMediaBundleIDs.contains(id) {
              usage.social += app.totalActivityDuration
            }
          }
        }
        byDay[day] = usage
      }
    }
    return SocialCutModel(days: byDay.values.sorted { $0.id < $1.id })
  }
}

/// Plays once when it appears:
/// 1. the week rises, one day at a time, each with its total;
/// 2. the social media part of every bar turns ember;
/// 3. those parts break off and drift away;
/// 4. what broke off counts up as "14h back." with the year under it.
struct SocialCutView: View {
  let model: SocialCutModel

  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @State private var risen = false
  @State private var marked = false
  @State private var cut = false
  @State private var showNumber = false
  @State private var shownSeconds: TimeInterval = 0
  @State private var showYear = false

  static let chartHeight: CGFloat = 170
  static let barWidth: CGFloat = 26
  static let radius: CGFloat = 6

  private static let dayFormatter: DateFormatter = {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US")
    f.dateFormat = "EEE"
    return f
  }()

  private var cream: Color { model.style.textColor }
  // The app's muted cream is rgba(), which ReportStyle's hex parser can't read.
  private var muted: Color { cream.opacity(0.6) }
  private var ember: Color { model.style.accentColor }

  var body: some View {
    if model.days.allSatisfy({ $0.total == 0 }) {
      // No Screen Time for the week yet (often right after access is granted).
      // Say so instead of drawing nothing.
      Text("No Screen Time recorded on this phone this week yet.")
        .font(.system(size: 16))
        .foregroundColor(muted)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    } else {
      cutView
    }
  }

  private var cutView: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(spacing: 6) {
        Circle().fill(ember).frame(width: 6, height: 6)
        Text("SOCIAL MEDIA")
          .font(.system(size: 11, weight: .medium))
          .tracking(0.8)
          .foregroundColor(ember)
      }
      .opacity(marked ? 1 : 0)
      .frame(height: 16)

      chart
        .padding(.top, 12)

      VStack(alignment: .leading, spacing: 10) {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
          Text(hoursText(shownSeconds))
            .font(.custom("InstrumentSerif-Regular", size: 64))
            .foregroundColor(cream)
            .monospacedDigit()
          Text("back.")
            .font(.custom("InstrumentSerif-Italic", size: 64))
            .foregroundColor(ember)
        }
        .opacity(showNumber ? 1 : 0)
        Text(yearLine)
          .font(.system(size: 16))
          .foregroundColor(cream)
          .opacity(showYear ? 1 : 0)
      }
      .padding(.top, 28)

      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .task { await play() }
  }

  private var chart: some View {
    let longest = max(model.days.map(\.total).max() ?? 0, 1)
    return HStack(alignment: .bottom, spacing: 0) {
      ForEach(Array(model.days.enumerated()), id: \.element.id) { index, day in
        VStack(spacing: 8) {
          bar(day, index: index, longest: longest)
          Text(Self.dayFormatter.string(from: day.id).uppercased())
            .font(.system(size: 11, weight: .medium))
            .tracking(0.6)
            .foregroundColor(muted)
        }
        .frame(maxWidth: .infinity)
      }
    }
  }

  private func bar(_ day: DayUsage, index: Int, longest: TimeInterval) -> some View {
    let height = Self.chartHeight * CGFloat(day.total / longest)
    let socialHeight = height * CGFloat(min(day.social, day.total) / max(day.total, 1))
    // The kept part stays at least a sliver so a day spent only on social
    // media still shows where it was.
    let keptHeight = max(height - socialHeight, min(height, 4))
    let delay = Double(index) * 0.11

    return VStack(spacing: 6) {
      Spacer(minLength: 0)
      Text(formatDuration(day.total))
        .font(.system(size: 11))
        .foregroundColor(muted)
        .monospacedDigit()
        .lineLimit(1)
        .fixedSize()
        .opacity(risen && !marked ? 1 : 0)
        .animation(.easeOut(duration: 0.4).delay(marked ? 0 : 0.3 + delay), value: risen)
        .animation(.easeOut(duration: 0.3), value: marked)
      ZStack(alignment: .bottom) {
        // The social part sits on top of the kept part and tucks under it by
        // one corner radius, so together they read as one rounded bar.
        RoundedRectangle(cornerRadius: Self.radius)
          .fill(marked ? ember : cream)
          .frame(width: Self.barWidth, height: socialHeight + Self.radius)
          .offset(y: -(keptHeight - Self.radius) + (cut ? -46 : 0))
          .opacity(socialHeight > 0 && !cut ? 1 : 0)
          .animation(.easeOut(duration: 0.35), value: marked)
          .animation(.timingCurve(0.4, 0, 0.2, 1, duration: 1.1).delay(Double(index) * 0.07), value: cut)
        RoundedRectangle(cornerRadius: Self.radius)
          .fill(cream)
          .frame(width: Self.barWidth, height: keptHeight)
      }
      .frame(height: height, alignment: .bottom)
      .scaleEffect(x: 1, y: risen ? 1 : 0, anchor: .bottom)
      .animation(.timingCurve(0.2, 0.8, 0.2, 1, duration: 0.62).delay(delay), value: risen)
    }
    .frame(height: Self.chartHeight + 24, alignment: .bottom)
  }

  private var yearLine: String {
    let days = Int((model.social * 52 / 86_400).rounded())
    return days >= 1 ? "Every week. That's \(days) days a year." : "Every week."
  }

  /// "14h", or minutes under an hour.
  private func hoursText(_ seconds: TimeInterval) -> String {
    let hours = Int((seconds / 3600).rounded())
    if model.social >= 3600 { return "\(hours)h" }
    return "\(Int((seconds / 60).rounded()))m"
  }

  private func pause(_ seconds: Double) async {
    if reduceMotion { return }
    try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
  }

  private func play() async {
    if reduceMotion {
      risen = true; marked = true; cut = true
      showNumber = true; shownSeconds = model.social; showYear = true
      return
    }
    await pause(0.4)
    risen = true
    await pause(1.9)
    marked = true
    await pause(1.0)
    cut = true
    await pause(0.9)
    withAnimation(.easeOut(duration: 0.5)) { showNumber = true }
    let steps = 40
    for step in 1...steps {
      let k = Double(step) / Double(steps)
      shownSeconds = model.social * (1 - pow(1 - k, 3))
      await pause(1.3 / Double(steps))
    }
    await pause(0.5)
    withAnimation(.easeOut(duration: 0.7)) { showYear = true }
  }
}
