import DeviceActivity
import FamilyControls
import ManagedSettings
import SwiftUI

extension DeviceActivityReport.Context {
  /// One big number: total time in the filter.
  static let totalActivity = Self("totalActivity")
  /// The apps that took the most time, with icon, name and duration.
  static let topApps = Self("topApps")
  /// Total and top apps in one scene, so a screen needs one report, not two.
  /// (Two report views on one screen share an extension process and the
  /// second one can come up blank on a remount.)
  static let overview = Self("overview")
}

struct AppUsage: Identifiable {
  let id: String
  let token: ApplicationToken?
  let name: String
  let duration: TimeInterval
}

struct UsageSummary {
  var total: TimeInterval = 0
  var apps: [AppUsage] = []
  var style = ReportStyle.load()
}

/// Walks Apple's async result tree once and sums per app across every
/// segment and device in the filter.
func summarize(_ data: DeviceActivityResults<DeviceActivityData>, maxApps: Int) async -> UsageSummary {
  var summary = UsageSummary()
  var byApp: [String: AppUsage] = [:]
  for await device in data {
    for await segment in device.activitySegments {
      summary.total += segment.totalActivityDuration
      for await category in segment.categories {
        for await app in category.applications {
          let key = app.application.bundleIdentifier
            ?? app.application.localizedDisplayName
            ?? UUID().uuidString
          let previous = byApp[key]?.duration ?? 0
          byApp[key] = AppUsage(
            id: key,
            token: app.application.token,
            name: app.application.localizedDisplayName ?? "App",
            duration: previous + app.totalActivityDuration)
        }
      }
    }
  }
  summary.apps = Array(byApp.values.sorted { $0.duration > $1.duration }.prefix(maxApps))
  return summary
}

struct TotalActivityReport: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .totalActivity
  let content: (UsageSummary) -> TotalActivityView

  func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> UsageSummary {
    await summarize(data, maxApps: 1)
  }
}

struct TopAppsReport: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .topApps
  let content: (UsageSummary) -> TopAppsView

  func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> UsageSummary {
    await summarize(data, maxApps: ReportStyle.load().maxApps)
  }
}

struct OverviewReport: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .overview
  let content: (UsageSummary) -> OverviewView

  func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> UsageSummary {
    await summarize(data, maxApps: ReportStyle.load().maxApps)
  }
}

/// The big total with the top apps under it. Heights match
/// OVERVIEW_GAP / TOP_APPS_ROW_HEIGHT in the RN component.
struct OverviewView: View {
  let model: UsageSummary
  static let gap: CGFloat = 16

  var body: some View {
    VStack(alignment: .leading, spacing: Self.gap) {
      Text(formatDuration(model.total))
        .font(.system(size: model.style.fontSize, weight: .bold, design: .rounded))
        .foregroundColor(model.style.textColor)
        .minimumScaleFactor(0.5)
        .lineLimit(1)
        .frame(height: model.style.fontSize * 1.25, alignment: .leading)
      TopAppsView(model: model)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

struct TotalActivityView: View {
  let model: UsageSummary

  var body: some View {
    Text(formatDuration(model.total))
      .font(.system(size: model.style.fontSize, weight: .bold, design: .rounded))
      .foregroundColor(model.style.textColor)
      .minimumScaleFactor(0.5)
      .lineLimit(1)
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }
}

/// Rows of fixed height (see ROW_HEIGHT in the RN component) so the app can
/// size the native view without knowing how many apps were used.
struct TopAppsView: View {
  let model: UsageSummary
  static let rowHeight: CGFloat = 52

  var body: some View {
    let longest = model.apps.first?.duration ?? 1
    VStack(spacing: 0) {
      if model.apps.isEmpty {
        Text("No activity yet")
          .font(.system(size: 15))
          .foregroundColor(model.style.mutedColor)
          .frame(maxWidth: .infinity, alignment: .leading)
          .frame(height: Self.rowHeight)
      }
      ForEach(model.apps) { app in
        VStack(alignment: .leading, spacing: 6) {
          HStack(alignment: .center) {
            if let token = app.token {
              Label(token)
                .labelStyle(.titleAndIcon)
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(model.style.textColor)
                .lineLimit(1)
            } else {
              Text(app.name)
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(model.style.textColor)
                .lineLimit(1)
            }
            Spacer(minLength: 8)
            Text(formatDuration(app.duration))
              .font(.system(size: 15, weight: .semibold, design: .rounded))
              .foregroundColor(model.style.textColor)
              .monospacedDigit()
          }
          GeometryReader { geo in
            ZStack(alignment: .leading) {
              Capsule().fill(model.style.textColor.opacity(0.08))
              Capsule()
                .fill(model.style.accentColor)
                .frame(width: max(6, geo.size.width * CGFloat(app.duration / max(longest, 1))))
            }
          }
          .frame(height: 6)
        }
        .frame(height: Self.rowHeight)
      }
      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
  }
}
