# HopOff TestFlight / iOS Build Guide

This guide is for getting HopOff onto an iPhone through Apple TestFlight.

## 1. Go To The Project

Open PowerShell and run:

```powershell
cd "C:\Users\K.Grover29\OneDrive - Bellarmine College Preparatory\Documents\hopoffv2it"
```

## 2. Know What Changes On iOS

The Android blocking/accessibility behavior will not work the same way on iPhone. Apple does not give normal apps the same Accessibility/Usage Stats control that Android does.

For TestFlight, you can still test:

- onboarding
- goals
- videos
- progress UI
- lock-in UI
- scoring UI
- general app flow
- microphone/speech permission flows

But full Android-style app blocking/intervention logic will need a separate iOS strategy, usually using Apple Screen Time / Family Controls APIs.

## 3. Add An iOS Bundle Identifier

In `app.json`, add an iOS bundle identifier under the existing `ios` section.

Example:

```json
"ios": {
  "bundleIdentifier": "com.hopoff.app",
  "supportsTablet": true,
  "userInterfaceStyle": "dark",
  "deploymentTarget": "16.4"
}
```

Use a bundle id you can register in your Apple Developer account. If `com.hopoff.app` is already taken or unavailable, use something unique like:

```text
com.courtmateeee.hopoff
```

## 4. Make Sure You Have Apple Access

You need:

- An Apple Developer Program account
- Access to App Store Connect
- An iPhone with TestFlight installed
- EAS CLI logged in to the Expo account that owns this project

Check Expo login:

```powershell
eas whoami
```

If needed:

```powershell
eas login
```

## 5. Add An iOS Build Profile If Needed

The current `eas.json` has Android-specific settings. The `production` profile can still work for iOS, but if you want an explicit TestFlight profile, add:

```json
"testflight": {
  "distribution": "store",
  "ios": {
    "simulator": false
  }
}
```

Put it inside the `"build"` object in `eas.json`.

## 6. Build For TestFlight

Run:

```powershell
eas build --profile production --platform ios
```

Or, if you added the explicit profile:

```powershell
eas build --profile testflight --platform ios
```

During the first iOS build, EAS may ask you to log in with Apple and let Expo manage certificates/profiles. Say yes unless you already manage Apple credentials manually.

## 7. Submit To App Store Connect

After the build finishes, submit it:

```powershell
eas submit --profile production --platform ios
```

If you used the `testflight` profile for build but only have `production` submit configured, that is okay. Submit profiles are separate from build profiles.

## 8. In App Store Connect

Go to:

```text
https://appstoreconnect.apple.com
```

Then:

1. Open **My Apps**.
2. Select HopOff, or create the app if it does not exist yet.
3. Make sure the bundle identifier matches `app.json`.
4. Go to **TestFlight**.
5. Wait for Apple processing to finish.
6. Add yourself as an internal tester.
7. Install through the TestFlight app on your iPhone.

## 9. When You Need A New iOS Build

You need a new iOS build when you change:

- native modules
- config plugins
- `app.json` native settings
- permissions
- bundle identifier
- splash/icon native config
- anything that needs Apple entitlements

You usually do **not** need a new build for normal JavaScript UI changes after the TestFlight build exists. For those, you can use an EAS Update later, but for early testing it is often simpler to rebuild.

## 10. Useful Commands

Start local Expo:

```powershell
npx expo start
```

Create iOS TestFlight build:

```powershell
eas build --profile production --platform ios
```

Submit latest iOS build:

```powershell
eas submit --profile production --platform ios
```

Check build status:

```powershell
eas build:list --platform ios
```

## References

- Expo SDK 56 docs: https://docs.expo.dev/versions/v56.0.0/
- EAS Build: https://docs.expo.dev/build/introduction/
- EAS Submit: https://docs.expo.dev/submit/introduction/
- Apple TestFlight: https://developer.apple.com/testflight/
