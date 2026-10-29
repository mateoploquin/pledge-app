import DeviceActivity
import SwiftUI

/// Entry point of the report extension. Each scene answers one "context"
/// that the app asks for by name (see PledgeActivityReportView in the app).
@main
struct ReportExtension: DeviceActivityReportExtension {
  var body: some DeviceActivityReportScene {
    TotalActivityReport { TotalActivityView(model: $0) }
    TopAppsReport { TopAppsView(model: $0) }
    OverviewReport { OverviewView(model: $0) }
  }
}
