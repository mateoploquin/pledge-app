import ExpoModulesCore
import UIKit

/// Apple's Liquid Glass behind a pledge bubble (owner, 18 Nov 2026: "this is
/// how Apple designed its bubbles ... I want the same feeling"). On iOS 26 it
/// is the system's own glass (UIGlassEffect): it bends and catches the light
/// of what's behind it, the drifting sun included. The view only draws the
/// material; React Native draws the bubble's contents on top of it.
final class PledgeGlassView: ExpoView {
  private let effectView = UIVisualEffectView()
  var cornerRadius: Double = 24 { didSet { apply() } }
  /// A tint laid into the glass ("#RRGGBBAA"), or none for clear glass.
  var tint: String? { didSet { apply() } }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    effectView.isUserInteractionEnabled = false
    addSubview(effectView)
    apply()
  }

  private func apply() {
    if #available(iOS 26.0, *) {
      let glass = UIGlassEffect(style: .regular)
      glass.tintColor = tint.flatMap(PledgeGlassView.color)
      glass.isInteractive = false
      effectView.effect = glass
      effectView.cornerConfiguration = .corners(radius: .fixed(cornerRadius))
    } else {
      // Older iOS has no Liquid Glass; the JS side draws its own glass there.
      effectView.effect = nil
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    effectView.frame = bounds
  }

  private static func color(_ hex: String) -> UIColor? {
    var s = hex.trimmingCharacters(in: .whitespaces)
    if s.hasPrefix("#") { s.removeFirst() }
    guard s.count == 6 || s.count == 8, let v = UInt64(s, radix: 16) else { return nil }
    let r, g, b, a: CGFloat
    if s.count == 8 {
      r = CGFloat((v >> 24) & 0xFF) / 255; g = CGFloat((v >> 16) & 0xFF) / 255
      b = CGFloat((v >> 8) & 0xFF) / 255; a = CGFloat(v & 0xFF) / 255
    } else {
      r = CGFloat((v >> 16) & 0xFF) / 255; g = CGFloat((v >> 8) & 0xFF) / 255
      b = CGFloat(v & 0xFF) / 255; a = 1
    }
    return UIColor(red: r, green: g, blue: b, alpha: a)
  }
}

public class PledgeGlassModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PledgeGlass")

    /// True where the system's Liquid Glass exists (iOS 26 and later).
    Function("isSupported") { () -> Bool in
      if #available(iOS 26.0, *) { return true }
      return false
    }

    View(PledgeGlassView.self) {
      Prop("cornerRadius") { (view: PledgeGlassView, value: Double?) in
        view.cornerRadius = value ?? 24
      }
      Prop("tint") { (view: PledgeGlassView, value: String?) in
        view.tint = value
      }
    }
  }
}
