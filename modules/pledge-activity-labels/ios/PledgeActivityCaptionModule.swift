import ExpoModulesCore
import FamilyControls
import ManagedSettings
import SwiftUI

/// The pledge's apps as one line of small spaced caps ("INSTAGRAM, TIKTOK,
/// YOUTUBE"), right-aligned, as in the v2 Paper pledge detail. Apple only lets
/// the system draw names from tokens (`Label(token)`), so the whole caption is
/// drawn here; JS never learns which apps they are. Past `maxItems` the rest
/// is summed up as "+N".
struct ActivityCaptionView: View {
  let selection: FamilyActivitySelection?
  let fontSize: CGFloat
  let tracking: CGFloat
  let color: Color
  let maxItems: Int
  let fontName: String
  let uppercase: Bool
  let leading: Bool
  let iconsOnly: Bool
  let iconSize: CGFloat

  private enum Item: Hashable {
    case app(ApplicationToken)
    case category(ActivityCategoryToken)
    case web(WebDomainToken)
  }

  private var items: [Item] {
    guard let s = selection else { return [] }
    return s.applicationTokens.map { .app($0) }
      + s.categoryTokens.map { .category($0) }
      + s.webDomainTokens.map { .web($0) }
  }

  @ViewBuilder private func label(_ item: Item) -> some View {
    switch item {
    case .app(let t): Label(t)
    case .category(let t): Label(t)
    case .web(let t): Label(t)
    }
  }

  var body: some View {
    let all = items
    if iconsOnly {
      iconRow(all)
    } else {
      nameRow(all)
    }
  }

  /// App icons at a fixed size (the system can't report a name's width, but
  /// an icon's is known), as many as fit, then "+N".
  private func iconRow(_ all: [Item]) -> some View {
    GeometryReader { geo in
      let size = iconSize
      let gap: CGFloat = 6
      let countRoom: CGFloat = all.count > 1 ? fontSize * 2.6 : 0
      let fit = max(1, Int((geo.size.width - countRoom + gap) / (size + gap)))
      let k = min(all.count, maxItems, fit)
      let rest = all.count - k
      HStack(spacing: gap) {
        if !leading { Spacer(minLength: 0) }
        ForEach(Array(all.prefix(k).enumerated()), id: \.offset) { _, item in
          label(item)
            .labelStyle(.iconOnly)
            .frame(width: size, height: size)
            .clipShape(RoundedRectangle(cornerRadius: size * 0.23, style: .continuous))
        }
        if rest > 0 {
          Text("+\(rest)")
            .font(.custom(fontName, size: fontSize))
            .foregroundColor(color)
            .fixedSize()
            .padding(.leading, 2)
        }
        if leading { Spacer(minLength: 0) }
      }
      .frame(width: geo.size.width, height: geo.size.height, alignment: leading ? .leading : .trailing)
    }
  }

  private func nameRow(_ all: [Item]) -> some View {
    let shown = Array(all.prefix(maxItems))
    let rest = all.count - shown.count
    return HStack(spacing: 0) {
      if !leading { Spacer(minLength: 0) }
      ForEach(Array(shown.enumerated()), id: \.offset) { index, item in
        label(item)
          .labelStyle(.titleOnly)
          .lineLimit(1)
          .truncationMode(.tail)
        if index < shown.count - 1 { Text(", ") }
      }
      if rest > 0 { Text(" +\(rest)") }
      if leading { Spacer(minLength: 0) }
    }
    .font(.custom(fontName, size: fontSize))
    .tracking(tracking)
    .textCase(uppercase ? .uppercase : nil)
    .foregroundColor(color)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: leading ? .leading : .trailing)
  }
}

final class PledgeActivityCaptionView: ExpoView {
  private var host: UIHostingController<AnyView>?
  private var selection: FamilyActivitySelection?
  private var fontSize: CGFloat = 11
  private var tracking: CGFloat = 1.54
  private var color = Color(red: 0xA8 / 255, green: 0x94 / 255, blue: 0x88 / 255)
  private var maxItems = 3
  private var fontName = "Inter-Medium"
  private var uppercase = true
  private var leading = false
  private var iconsOnly = false
  private var iconSize: CGFloat = 22

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    render()
  }

  func setSelection(_ b64: String?) {
    if let b64, let data = Data(base64Encoded: b64) {
      selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
    } else {
      selection = nil
    }
    render()
  }
  func setFontSize(_ v: Double?) { if let v { fontSize = CGFloat(v) }; render() }
  func setTracking(_ v: Double?) { if let v { tracking = CGFloat(v) }; render() }
  func setMaxItems(_ v: Int?) { if let v { maxItems = max(1, v) }; render() }
  func setFontName(_ v: String?) { fontName = v ?? "Inter-Medium"; render() }
  func setUppercase(_ v: Bool?) { uppercase = v ?? true; render() }
  func setAlign(_ v: String?) { leading = v == "leading"; render() }
  func setIconsOnly(_ v: Bool?) { iconsOnly = v ?? false; render() }
  func setIconSize(_ v: Double?) { if let v { iconSize = CGFloat(v) }; render() }
  func setColor(_ hex: String?) {
    if let hex, let rgb = UInt32(hex.trimmingCharacters(in: CharacterSet(charactersIn: "#")), radix: 16) {
      color = Color(
        red: Double((rgb >> 16) & 0xFF) / 255,
        green: Double((rgb >> 8) & 0xFF) / 255,
        blue: Double(rgb & 0xFF) / 255)
    }
    render()
  }

  private func render() {
    let root = AnyView(
      ActivityCaptionView(
        selection: selection, fontSize: fontSize, tracking: tracking, color: color, maxItems: maxItems,
        fontName: fontName, uppercase: uppercase, leading: leading,
        iconsOnly: iconsOnly, iconSize: iconSize))
    if let host {
      host.rootView = root
    } else {
      let controller = UIHostingController(rootView: root)
      controller.view.backgroundColor = .clear
      controller.view.isUserInteractionEnabled = false
      addSubview(controller.view)
      host = controller
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    host?.view.frame = bounds
  }
}

public class PledgeActivityCaptionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PledgeActivityCaption")

    View(PledgeActivityCaptionView.self) {
      Prop("familyActivitySelection") { (view: PledgeActivityCaptionView, v: String?) in view.setSelection(v) }
      Prop("fontSize") { (view: PledgeActivityCaptionView, v: Double?) in view.setFontSize(v) }
      Prop("tracking") { (view: PledgeActivityCaptionView, v: Double?) in view.setTracking(v) }
      Prop("color") { (view: PledgeActivityCaptionView, v: String?) in view.setColor(v) }
      Prop("maxItems") { (view: PledgeActivityCaptionView, v: Int?) in view.setMaxItems(v) }
      Prop("fontName") { (view: PledgeActivityCaptionView, v: String?) in view.setFontName(v) }
      Prop("uppercase") { (view: PledgeActivityCaptionView, v: Bool?) in view.setUppercase(v) }
      Prop("align") { (view: PledgeActivityCaptionView, v: String?) in view.setAlign(v) }
      Prop("iconsOnly") { (view: PledgeActivityCaptionView, v: Bool?) in view.setIconsOnly(v) }
      Prop("iconSize") { (view: PledgeActivityCaptionView, v: Double?) in view.setIconSize(v) }
    }
  }
}
