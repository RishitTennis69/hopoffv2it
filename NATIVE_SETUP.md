# HopOff — native integration guide

This document covers turning on the real OS-level features. The app currently
runs against mocks (Expo Go friendly). Enabling native moves the project to a
**development build** (Expo Go can no longer run it) and requires the inputs in
the checklist below.

---

## 0. Important reality check: TikTok / Instagram have no usage/blocking API

There is **no public TikTok or Instagram API** for reading how long you use
those apps or for blocking them. That is by design. All of HopOff's tracking
and blocking is done at the **operating-system level** and works for *any* app:

- **Android** — `UsageStatsManager` reads per-app usage; an `AccessibilityService`
  detects the foreground app and shows the block overlay.
- **iOS** — the **Screen Time / Family Controls** framework family
  (`FamilyControls`, `DeviceActivity`, `ManagedSettings`) handles selection,
  monitoring, and shielding.

The only thing that touches TikTok/Instagram directly is **"Save from
TikTok & Instagram"**, which is just the **OS share sheet** — no API key, no
account. The user shares a link, picks HopOff, and we receive the URL:

- **Android** — an `intent-filter` with `ACTION_SEND` (`text/plain`).
- **iOS** — a **Share Extension** that writes the URL into a shared App Group.

So: nothing to request from TikTok/Instagram. 

---

## 1. What I need from you (checklist)

YouTube (already wired — see §5):
- [ ] A **YouTube Data API v3** key. Put it in `.env` as
      `EXPO_PUBLIC_YOUTUBE_API_KEY=...`. Until then, search uses the mock.

Build tooling (needed for any native feature):
- [ ] Confirm we can switch from Expo Go to a **development build** (this is
      required for all native modules below). I'll run `npx expo prebuild`.
- [ ] An **Expo / EAS account** (`eas login`) if you want cloud builds, or a
      local toolchain (Android Studio; Xcode on a Mac for iOS).
- [ ] A physical **Android device** for testing Usage Access + Accessibility
      (the emulator has no real usage data).

iOS only:
- [ ] A **Mac with Xcode** to build the iOS app + extensions.
- [ ] An **Apple Developer account** ($99/yr).
- [ ] The **Family Controls capability**. The development entitlement works
      while testing; **distribution requires Apple's approval** of the
      "Family Controls (Distribution)" entitlement request form. Please start
      that request early — Apple review can take days/weeks.
- [ ] An **App Group** id (e.g. `group.com.yourco.hopoff`) for sharing data
      between the app and its extensions.

Tell me your final **bundle identifier / package name** (e.g.
`com.yourco.hopoff`) and the App Group id and I'll wire them in.

---

## 2. iOS — Screen Time / Family Controls

Recommended module: [`react-native-device-activity`](https://github.com/kingstinct/react-native-device-activity)
(Expo config plugin, wraps FamilyControls + DeviceActivity + ManagedSettings).

```bash
npx expo install react-native-device-activity
```

`app.json` (add plugin + entitlement; replace ids):

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourco.hopoff",
      "entitlements": {
        "com.apple.developer.family-controls": true
      }
    },
    "plugins": [
      [
        "react-native-device-activity",
        {
          "appGroup": "group.com.yourco.hopoff"
        }
      ]
    ]
  }
}
```

Wiring (replace the mock in `src/services/nativeUsage.ts`):

- **Authorize:** `await ReactNativeDeviceActivity.requestAuthorization()`
  → fulfils the single iOS "Screen Time" permission step.
- **Select apps:** present the native `FamilyActivitySelection` picker
  (`DeviceActivitySelectionView`) instead of our catalog list, since iOS hides
  real bundle ids behind opaque tokens. Store the returned selection.
- **Monitor + block:** schedule a `DeviceActivity` monitor with a usage
  threshold per selection; in the `eventDidReachThreshold` callback apply a
  `ManagedSettings` shield (the block) and/or post our `hopoff://block` link.

> Privacy caveat: iOS does **not** hand raw per-app minutes to JS. You get
> threshold events + a `DeviceActivityReport` SwiftUI extension that *renders*
> usage. So on iOS the "soft spots"/week chart should be driven by a
> DeviceActivityReport extension (or shown as relative), while the **block**
> mechanism is fully functional. Android gives exact minutes.

The block trigger then routes into the existing
[`src/services/blockMonitor.ts`](src/services/blockMonitor.ts) → `triggerBlock(appId)`.

---

## 3. Android — Usage Access + Accessibility block

### 3a. Usage stats (real per-app minutes)

Use a usage-stats module (e.g. `@brighthustle/react-native-usage-stats-manager`)
or a tiny custom Expo module wrapping `UsageStatsManager`.

```bash
npx expo install @brighthustle/react-native-usage-stats-manager
```

Add the special permission + settings intent. Create
`plugins/withUsageAccess.js`:

```js
const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

module.exports = function withUsageAccess(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest['uses-permission'] = manifest['uses-permission'] || [];
    const perms = [
      'android.permission.PACKAGE_USAGE_STATS',
      'android.permission.QUERY_ALL_PACKAGES',
    ];
    for (const name of perms) {
      if (!manifest['uses-permission'].some((p) => p.$['android:name'] === name)) {
        manifest['uses-permission'].push({ $: { 'android:name': name } });
      }
    }
    return cfg;
  });
};
```

Open the Usage Access settings screen from
`openPermissionSettings('usage')` with:
`IntentLauncher.startActivityAsync('android.settings.USAGE_ACCESS_SETTINGS')`
(`expo-intent-launcher`). Read the granted state and pull the last 7 days via
the usage-stats module → return into `getWeekUsage`.

### 3b. Accessibility service (the block overlay)

There is no off-the-shelf Expo module — this is a small custom native service +
config plugin. Create `android/.../HopOffAccessibilityService.kt` (via a Gradle
mod plugin or a local Expo module) that watches
`TYPE_WINDOW_STATE_CHANGED`, compares the foreground package + today's usage
minutes against the user's group limits, and on exceed broadcasts the deep
link `hopoff://block?appId=<id>` (or launches the app to `/block`).

`plugins/withAccessibilityService.js` registers it:

```js
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAccessibilityService(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application[0];
    app.service = app.service || [];
    app.service.push({
      $: {
        'android:name': '.HopOffAccessibilityService',
        'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
        'android:exported': 'false',
      },
      'intent-filter': [{ action: [{ $: { 'android:name': 'android.accessibilityservice.AccessibilityService' } }] }],
      'meta-data': [{ $: { 'android:name': 'android.accessibilityservice', 'android:resource': '@xml/accessibility_service_config' } }],
    });
    return cfg;
  });
};
```

(Plus an `accessibility_service_config.xml` res file — I'll generate it during
prebuild wiring.) `openPermissionSettings('accessibility')` opens
`android.settings.ACCESSIBILITY_SETTINGS`.

### 3c. Share intake (Save from TikTok/Instagram)

Add an `ACTION_SEND` intent-filter so HopOff appears in the share sheet, then
read the shared URL on launch (`expo-linking` / a share-intent module) and feed
it to `addVideo` — replacing the `simulateShare` mock in
[`src/services/shareIntake.ts`](src/services/shareIntake.ts).

---

## 4. Wiring app.json plugins

Once the plugin files exist, reference them:

```json
"plugins": [
  "expo-router",
  "expo-video",
  "./plugins/withUsageAccess",
  "./plugins/withAccessibilityService"
]
```

---

## 5. YouTube (done)

Already implemented in [`src/services/youtube.ts`](src/services/youtube.ts).
Set `EXPO_PUBLIC_YOUTUBE_API_KEY` in `.env` and real search turns on
automatically (otherwise the mock is used). It calls the `search` endpoint
(`type=video&videoDuration=short`) and hydrates durations via `videos.list`.

---

## 6. Build & run (after enabling native)

```bash
# generate native projects (one-time / re-runnable)
npx expo prebuild

# Android (device plugged in)
npx expo run:android

# iOS (on a Mac)
npx expo run:ios
# or EAS cloud builds:
eas build --profile development --platform android
eas build --profile development --platform ios
```

---

## 7. Where the JS swap points are

The UI never changes — only these service files get real implementations:

| Feature | File | Swap |
| --- | --- | --- |
| Installed apps, 7-day usage, permission read/confirm | `src/services/nativeUsage.ts` | replace mock bodies |
| Foreground watch → block deep link | `src/services/blockMonitor.ts` | register native watcher |
| Share-sheet intake | `src/services/shareIntake.ts` | read real shared URL |
| YouTube search | `src/services/youtube.ts` | done (key-gated) |

All of them already return the exact shapes the components consume, so flipping
each one on is isolated and low-risk.
