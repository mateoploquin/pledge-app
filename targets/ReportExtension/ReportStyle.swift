import Foundation
import SwiftUI

/// Presentation settings the app writes to the shared App Group before it
/// shows a report. The extension can only read; nothing flows back out.
struct ReportStyle {
  static let appGroup =
    Bundle.main.object(forInfoDictionaryKey: "REACT_NATIVE_DEVICE_ACTIVITY_APP_GROUP") as? String
  static var defaults: UserDefaults? { UserDefaults(suiteName: appGroup) }

  var textColor: Color
  var mutedColor: Color
  var accentColor: Color
  var fontSize: CGFloat
  var maxApps: Int

  static func load() -> ReportStyle {
    let d = defaults
    let fontSize = d?.double(forKey: "pledgeReport.fontSize") ?? 0
    let maxApps = d?.integer(forKey: "pledgeReport.maxApps") ?? 0
    let ink = Color(red: 0.11, green: 0.08, blue: 0.06)
    return ReportStyle(
      textColor: Color(hex: d?.string(forKey: "pledgeReport.textColor")) ?? ink,
      mutedColor: Color(hex: d?.string(forKey: "pledgeReport.mutedColor")) ?? ink.opacity(0.55),
      accentColor: Color(hex: d?.string(forKey: "pledgeReport.accentColor")) ?? Color(red: 1.0, green: 0.35, blue: 0.0),
      fontSize: fontSize > 0 ? CGFloat(fontSize) : 44,
      maxApps: maxApps > 0 ? maxApps : 5)
  }
}

extension Color {
  /// "#RRGGBB" or "#RRGGBBAA".
  init?(hex: String?) {
    guard var h = hex?.trimmingCharacters(in: .whitespacesAndNewlines) else { return nil }
    if h.hasPrefix("#") { h.removeFirst() }
    guard h.count == 6 || h.count == 8, let v = UInt64(h, radix: 16) else { return nil }
    let r, g, b, a: Double
    if h.count == 8 {
      r = Double((v >> 24) & 0xFF) / 255; g = Double((v >> 16) & 0xFF) / 255
      b = Double((v >> 8) & 0xFF) / 255; a = Double(v & 0xFF) / 255
    } else {
      r = Double((v >> 16) & 0xFF) / 255; g = Double((v >> 8) & 0xFF) / 255
      b = Double(v & 0xFF) / 255; a = 1
    }
    self.init(red: r, green: g, blue: b, opacity: a)
  }
}

func formatDuration(_ seconds: TimeInterval) -> String {
  let total = Int(seconds.rounded())
  let h = total / 3600
  let m = (total % 3600) / 60
  if h > 0 { return "\(h)h \(m)m" }
  if m > 0 { return "\(m)m" }
  return total > 0 ? "<1m" : "0m"
}
