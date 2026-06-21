# Android Studio setup (HopOff dev build)

HopOff now uses **native Android code** (usage stats, share sheet, accessibility
block trigger). That means a **development build** on your phone — not Expo Go.

## 1. Install Android Studio

1. Download [Android Studio](https://developer.android.com/studio) and run the installer.
2. In the setup wizard, install:
   - **Android SDK**
   - **Android SDK Platform** (API 35 or latest)
   - **Android SDK Build-Tools**
   - **Android SDK Platform-Tools** (includes `adb`)
3. Open Android Studio → **Settings → Languages & Frameworks → Android SDK** and note the **SDK Location** (usually `C:\Users\<you>\AppData\Local\Android\Sdk`).

### Set environment variables (Windows)

PowerShell (run once, then restart the terminal):

```powershell
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
$path = [System.Environment]::GetEnvironmentVariable("Path", "User")
[System.Environment]::SetEnvironmentVariable("Path", "$path;$env:LOCALAPPDATA\Android\Sdk\platform-tools", "User")
```

Verify in a **new** terminal:

```powershell
adb version
```

## 2. Prepare your phone

1. **Settings → About phone** → tap **Build number** 7 times (enables Developer options).
2. **Settings → Developer options** → enable **USB debugging**.
3. Plug the phone into your PC with a data cable.
4. Accept the **Allow USB debugging** prompt on the phone.
5. Verify:

```powershell
adb devices
```

You should see your device listed (not `unauthorized`).

## 3. Build and install HopOff

From the project folder:

```powershell
cd "C:\Users\Krish Grover\Documents\hopoffv2it"
npm install
npx expo prebuild --platform android
npm run android:device
```

The first build can take **10–20 minutes** (Gradle downloads). After that, installs are faster.

If multiple devices are connected, pick your phone when prompted.

## 4. Start the dev server (after first install)

Terminal 1 — Metro bundler:

```powershell
cd "C:\Users\Krish Grover\Documents\hopoffv2it"
npm start
```

Terminal 2 — only needed when you change **native** code:

```powershell
npm run android:device
```

Day-to-day JS/UI changes reload from Metro without rebuilding native.

## 5. Grant permissions on the device

During onboarding → **Permissions**:

1. **Usage access** — Settings → HopOff → Allow. Then tap **I enabled Usage Access** in the app. Progress tab will show **real** screen time.
2. **Accessibility** (optional but needed for auto-block) — Settings → HopOff → turn on. Lets HopOff show the block screen when you exceed a limit in TikTok/Instagram/etc.

## 6. Test share from Instagram / TikTok

1. Finish onboarding and add at least one motivation video.
2. Open **Instagram** or **TikTok**, find a reel, tap **Share**.
3. Pick **HopOff** from the share sheet (you may need to tap **More** and pin it the first time).
4. HopOff opens and the link is added to your **Videos** library.

No Instagram or TikTok API key — the OS passes the URL.

## 7. Test the block screen

1. In **Apps**, create a group with a **very low limit** (e.g. 30 min) for an app you use.
2. Enable **Accessibility** for HopOff.
3. Use that app past the limit — HopOff should open the block overlay.

Or use **Preview block screen** on the Progress tab anytime.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `adb` not found | Set `ANDROID_HOME` / PATH (step 1) and open a new terminal |
| `SDK location not found` | Create `%LOCALAPPDATA%\Android\Sdk` via Android Studio SDK Manager |
| Device unauthorized | Revoke USB debugging authorizations on phone, replug, accept prompt |
| Usage stats all zero | Confirm Usage access is on; disable battery optimization for HopOff |
| HopOff missing from share sheet | Reinstall after prebuild; share **text/link** posts (not all apps share the same way) |
| Build fails on Gradle | Open `android/` in Android Studio once and let it sync |

## YouTube search

Real search is already enabled via `.env` → `EXPO_PUBLIC_YOUTUBE_API_KEY`. Restrict that key in Google Cloud Console to **YouTube Data API v3** and your Android app package `com.hopoff.app`.
