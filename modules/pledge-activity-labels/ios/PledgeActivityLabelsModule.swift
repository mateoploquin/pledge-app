import ExpoModulesCore
import FamilyControls
import ManagedSettings
import SwiftUI

/// Draws ONE selection (app, category or web domain) using Apple's
/// privacy-preserving `Label(token)`: the system renders the real icon and
/// name, our code only ever holds opaque tokens. Layout of rows/pills is done
/// in React Native, which keeps scrolling and styling on the JS side.
struct SingleLabelView: View {
  let applicationToken: ApplicationToken?
  let categoryToken: ActivityCategoryToken?
  let webDomainToken: WebDomainToken?
  let fontSize: CGFloat

  var body: some View {
    Group {
      if let t = applicationToken {
        Label(t)
      } else if let t = categoryToken {
        Label(t)
      } else if let t = webDomainToken {
        Label(t)
      } else {
        EmptyView()
      }
    }
    .labelStyle(.titleAndIcon)
    .font(.system(size: fontSize, weight: .medium))
    .foregroundColor(Color(red: 0.11, green: 0.08, blue: 0.06))
    .lineLimit(1)
    .truncationMode(.tail)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }
}

final class PledgeActivityLabelView: ExpoView {
  private var host: UIHostingController<AnyView>?
  private var applicationToken: ApplicationToken?
  private var categoryToken: ActivityCategoryToken?
  private var webDomainToken: WebDomainToken?
  private var fontSize: CGFloat = 15

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    render()
  }

  func setApplication(_ b64: String?) {
    applicationToken = decode(ApplicationToken.self, b64)
    render()
  }
  func setCategory(_ b64: String?) {
    categoryToken = decode(ActivityCategoryToken.self, b64)
    render()
  }
  func setWebDomain(_ b64: String?) {
    webDomainToken = decode(WebDomainToken.self, b64)
    render()
  }
  func setFontSize(_ size: Double?) {
    if let size { fontSize = CGFloat(size) }
    render()
  }

  private func decode<T: Decodable>(_ type: T.Type, _ b64: String?) -> T? {
    guard let b64, let data = Data(base64Encoded: b64) else { return nil }
    return try? JSONDecoder().decode(type, from: data)
  }

  private func render() {
    let root = AnyView(
      SingleLabelView(
        applicationToken: applicationToken,
        categoryToken: categoryToken,
        webDomainToken: webDomainToken,
        fontSize: fontSize))
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

public class PledgeActivityLabelsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PledgeActivityLabels")

    /// Splits a base64 FamilyActivitySelection into per-item opaque tokens
    /// (each re-encoded as base64 JSON) so JS can render one label per item.
    Function("listTokens") { (selection: String) -> [String: [String]] in
      guard let data = Data(base64Encoded: selection),
        let sel = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
      else {
        return ["applications": [], "categories": [], "webDomains": []]
      }
      let enc = JSONEncoder()
      func encodeAll<T: Encodable>(_ items: Set<T>) -> [String] {
        items.compactMap { (try? enc.encode($0))?.base64EncodedString() }
      }
      return [
        "applications": encodeAll(sel.applicationTokens),
        "categories": encodeAll(sel.categoryTokens),
        "webDomains": encodeAll(sel.webDomainTokens),
      ]
    }

    View(PledgeActivityLabelView.self) {
      Prop("applicationToken") { (view: PledgeActivityLabelView, token: String?) in
        view.setApplication(token)
      }
      Prop("categoryToken") { (view: PledgeActivityLabelView, token: String?) in
        view.setCategory(token)
      }
      Prop("webDomainToken") { (view: PledgeActivityLabelView, token: String?) in
        view.setWebDomain(token)
      }
      Prop("fontSize") { (view: PledgeActivityLabelView, size: Double?) in
        view.setFontSize(size)
      }
    }
  }
}
