import ExpoModulesCore

#if canImport(FamilyControls) && canImport(ManagedSettings) && canImport(SwiftUI)
import FamilyControls
import ManagedSettings
import SwiftUI
#endif

public class HopOffMonitorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("HopOffMonitor")

    AsyncFunction("isScreenTimeAvailable") {
      return screenTimeAvailable()
    }

    AsyncFunction("getScreenTimeAuthorizationStatus") {
      return screenTimeAuthorizationStatus()
    }

    AsyncFunction("requestScreenTimeAuthorization") { (promise: Promise) in
      requestScreenTimeAuthorization(promise: promise)
    }.runOnQueue(.main)

    AsyncFunction("presentFamilyActivityPicker") { (promise: Promise) in
      presentFamilyActivityPicker(promise: promise)
    }.runOnQueue(.main)

    AsyncFunction("getFamilyActivitySelectionSummary") {
      return familyActivitySelectionSummary()
    }

    AsyncFunction("startShieldingFamilyActivitySelection") {
      return startShieldingFamilyActivitySelection()
    }

    AsyncFunction("stopShieldingFamilyActivitySelection") {
      stopShieldingFamilyActivitySelection()
    }
  }
}

private let familyActivitySelectionKey = "hopoff.familyActivitySelection"
private let shieldStoreName = ManagedSettingsStore.Name("hopoff.selection")

private func screenTimeAvailable() -> Bool {
#if canImport(FamilyControls) && canImport(ManagedSettings)
  if #available(iOS 16.0, *) {
    return true
  }
#endif
  return false
}

private func screenTimeAuthorizationStatus() -> String {
#if canImport(FamilyControls)
  if #available(iOS 16.0, *) {
    switch AuthorizationCenter.shared.authorizationStatus {
    case .notDetermined:
      return "notDetermined"
    case .denied:
      return "denied"
    case .approved:
      return "approved"
    @unknown default:
      return "unknown"
    }
  }
#endif
  return "unavailable"
}

private func requestScreenTimeAuthorization(promise: Promise) {
#if canImport(FamilyControls)
  if #available(iOS 16.0, *) {
    Task { @MainActor in
      do {
        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
        promise.resolve(screenTimeAuthorizationStatus())
      } catch {
        promise.reject("ERR_SCREEN_TIME_AUTH", error.localizedDescription)
      }
    }
    return
  }
#endif
  promise.resolve("unavailable")
}

private func familyActivitySelectionSummary() -> [String: Int] {
#if canImport(FamilyControls)
  if #available(iOS 16.0, *), let selection = loadFamilyActivitySelection() {
    return [
      "applications": selection.applicationTokens.count,
      "categories": selection.categoryTokens.count,
      "webDomains": selection.webDomainTokens.count
    ]
  }
#endif
  return ["applications": 0, "categories": 0, "webDomains": 0]
}

private func startShieldingFamilyActivitySelection() -> Bool {
#if canImport(FamilyControls) && canImport(ManagedSettings)
  if #available(iOS 16.0, *), let selection = loadFamilyActivitySelection() {
    let store = ManagedSettingsStore(named: shieldStoreName)
    store.shield.applications = selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
    store.shield.applicationCategories = selection.categoryTokens.isEmpty
      ? nil
      : .specific(selection.categoryTokens)
    store.shield.webDomains = selection.webDomainTokens.isEmpty ? nil : selection.webDomainTokens
    return true
  }
#endif
  return false
}

private func stopShieldingFamilyActivitySelection() {
#if canImport(ManagedSettings)
  if #available(iOS 16.0, *) {
    ManagedSettingsStore(named: shieldStoreName).clearAllSettings()
  }
#endif
}

#if canImport(FamilyControls)
@available(iOS 16.0, *)
private func loadFamilyActivitySelection() -> FamilyActivitySelection? {
  guard let data = UserDefaults.standard.data(forKey: familyActivitySelectionKey) else {
    return nil
  }
  return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
}

@available(iOS 16.0, *)
private func saveFamilyActivitySelection(_ selection: FamilyActivitySelection) {
  if let data = try? JSONEncoder().encode(selection) {
    UserDefaults.standard.set(data, forKey: familyActivitySelectionKey)
  }
}
#endif

private func presentFamilyActivityPicker(promise: Promise) {
#if canImport(FamilyControls) && canImport(SwiftUI)
  if #available(iOS 16.0, *) {
    guard AuthorizationCenter.shared.authorizationStatus == .approved else {
      promise.reject("ERR_SCREEN_TIME_NOT_AUTHORIZED", "Screen Time authorization is required before selecting apps.")
      return
    }

    guard let presentingViewController = UIApplication.shared.currentViewController() else {
      promise.reject("ERR_NO_VIEW_CONTROLLER", "Unable to find a view controller to present the Screen Time picker.")
      return
    }

    let picker = FamilyActivityPickerHost(
      initialSelection: loadFamilyActivitySelection() ?? FamilyActivitySelection()
    ) { selection in
      saveFamilyActivitySelection(selection)
      promise.resolve(familyActivitySelectionSummary())
    }

    let controller = UIHostingController(rootView: picker)
    controller.modalPresentationStyle = .formSheet
    presentingViewController.present(controller, animated: true)
    return
  }
#endif
  promise.resolve(["applications": 0, "categories": 0, "webDomains": 0])
}

#if canImport(FamilyControls) && canImport(SwiftUI)
@available(iOS 16.0, *)
private struct FamilyActivityPickerHost: View {
  @Environment(\.dismiss) private var dismiss
  @State private var selection: FamilyActivitySelection
  let onDone: (FamilyActivitySelection) -> Void

  init(initialSelection: FamilyActivitySelection, onDone: @escaping (FamilyActivitySelection) -> Void) {
    _selection = State(initialValue: initialSelection)
    self.onDone = onDone
  }

  var body: some View {
    NavigationView {
      FamilyActivityPicker(selection: $selection)
        .navigationTitle("Choose Apps")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
          ToolbarItem(placement: .cancellationAction) {
            Button("Cancel") {
              dismiss()
            }
          }
          ToolbarItem(placement: .confirmationAction) {
            Button("Done") {
              onDone(selection)
              dismiss()
            }
          }
        }
    }
  }
}
#endif

private extension UIApplication {
  func currentViewController(
    from rootViewController: UIViewController? = UIApplication.shared
      .connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }?
      .rootViewController
  ) -> UIViewController? {
    if let navigationController = rootViewController as? UINavigationController {
      return currentViewController(from: navigationController.visibleViewController)
    }
    if let tabBarController = rootViewController as? UITabBarController {
      return currentViewController(from: tabBarController.selectedViewController)
    }
    if let presented = rootViewController?.presentedViewController {
      return currentViewController(from: presented)
    }
    return rootViewController
  }
}
