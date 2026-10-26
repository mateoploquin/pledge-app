import ExpoModulesCore
import FamilyControls
import ManagedSettings
import SwiftUI

/// Shows the apps / categories / web domains inside a FamilyActivitySelection.
/// Apple's `Label(token)` draws the real icon and name; our code only ever sees
/// opaque tokens, so no extra entitlement is needed and nothing leaks.
struct ActivityLabelsView: View {
  let selection: FamilyActivitySelection
  let iconSize: CGFloat
  let showNames: Bool

  private var bubbleWidth: CGFloat { iconSize + 34 }

  var body: some View {
    ScrollView(.horizontal, showsIndicators: false) {
      HStack(alignment: .top, spacing: 10) {
        ForEach(Array(selection.applicationTokens), id: \.self) { token in
          bubble { Label(token) }
        }
        ForEach(Array(selection.categoryTokens), id: \.self) { token in
          bubble { Label(token) }
        }
        ForEach(Array(selection.webDomainTokens), id: \.self) { token in
          bubble { Label(token) }
        }
      }
      .padding(.horizontal, 2)
      .padding(.vertical, 2)
    }
  }

  /// One rounded card per selection: icon on top, name underneath.
  @ViewBuilder
  private func bubble<L: View>(@ViewBuilder label: () -> L) -> some View {
    let content = label()
    VStack(spacing: 6) {
      content
        .labelStyle(.iconOnly)
        .font(.system(size: iconSize * 0.55))
        .frame(width: iconSize, height: iconSize)
      if showNames {
        // The system label ignores font/lineLimit, so never constrain its
        // width (no truncation) and shrink it visually instead.
        content
          .labelStyle(.titleOnly)
          .font(.footnote)
          .foregroundColor(Color(red: 0.11, green: 0.08, blue: 0.06))
          .fixedSize(horizontal: true, vertical: false)
          .scaleEffect(0.78)
          .frame(height: 16)
      }
    }
    .padding(.vertical, 10)
    .padding(.horizontal, 12)
    .frame(minWidth: bubbleWidth)
    .background(Color.white.opacity(0.92))
    .cornerRadius(16)
  }
}

final class PledgeActivityLabelsView: ExpoView {
  private var host: UIHostingController<AnyView>?
  private var selectionToken: String = ""
  private var iconSize: CGFloat = 44
  private var showNames = true

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    render()
  }

  func update(token: String?, iconSize: Double?, showNames: Bool?) {
    if let token { selectionToken = token }
    if let iconSize { self.iconSize = CGFloat(iconSize) }
    if let showNames { self.showNames = showNames }
    render()
  }

  private func decode(_ token: String) -> FamilyActivitySelection {
    guard let data = Data(base64Encoded: token),
      let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
    else { return FamilyActivitySelection() }
    return selection
  }

  private func render() {
    let root = AnyView(
      ActivityLabelsView(
        selection: decode(selectionToken), iconSize: iconSize, showNames: showNames)
    )
    if let host {
      host.rootView = root
    } else {
      let controller = UIHostingController(rootView: root)
      controller.view.backgroundColor = .clear
      addSubview(controller.view)
      host = controller
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    host?.view.frame = bounds
  }
}

public class PledgeActivityLabelsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PledgeActivityLabels")

    View(PledgeActivityLabelsView.self) {
      Prop("familyActivitySelection") { (view: PledgeActivityLabelsView, token: String?) in
        view.update(token: token, iconSize: nil, showNames: nil)
      }
      Prop("iconSize") { (view: PledgeActivityLabelsView, size: Double?) in
        view.update(token: nil, iconSize: size, showNames: nil)
      }
      Prop("showNames") { (view: PledgeActivityLabelsView, show: Bool?) in
        view.update(token: nil, iconSize: nil, showNames: show)
      }
    }
  }
}
