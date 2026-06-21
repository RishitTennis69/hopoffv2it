# Install HopOff with EAS Build (no USB cable)

Expo builds HopOff in the cloud. You download an **APK** on your phone, install it once, then use **Wi‑Fi + `npm start`** for daily development — same vibe as before with Expo Go / dev client.

No Android Studio required for the build. No USB cable required.

---

## One-time setup

### 1. Expo account

Sign up free at [expo.dev](https://expo.dev) if you don't have an account.

### 2. Log in (PowerShell)

```powershell
cd "C:\Users\Krish Grover\Documents\hopoffv2it"
npx eas-cli login
```

Use the same account you used before if you still have it.

### 3. Link this project to Expo

```powershell
npx eas-cli init
```

- Say **yes** to creating/linking the project.
- This adds a `projectId` to `app.json` under `expo.extra.eas`.

---

## Build the dev app (cloud)

```powershell
cd "C:\Users\Krish Grover\Documents\hopoffv2it"
npm run build:android
```

Or directly:

```powershell
npx eas-cli build --profile development --platform android
```

- First build may ask about **Android credentials** — choose **Let Expo handle it** (generates a keystore).
- Wait ~10–20 minutes. You'll get a **link** when it finishes (also at [expo.dev](https://expo.dev) → your project → Builds).

---

## Install on your phone

1. Open the build **link on your Android phone** (Chrome).
2. Download the **APK**.
3. If prompted, allow **Install unknown apps** for Chrome (or Files).
4. Install and open **HopOff**.

You only repeat this when **native code** changes (usage stats, share sheet, accessibility). JS/UI updates do **not** need a rebuild.

---

## Daily development (Wi‑Fi, no cable)

**On your PC:**

```powershell
cd "C:\Users\Krish Grover\Documents\hopoffv2it"
npm start
```

**On your phone:**

1. Same Wi‑Fi as the PC.
2. Open the **HopOff** app (not Expo Go).
3. It connects to Metro — scan the QR in the terminal if it asks, or it may connect automatically.

Change code → save → app reloads. Same as you remember.

If the phone can't reach the PC (some networks block it):

```powershell
npm start -- --tunnel
```

---

## After install — enable native features

In onboarding (or Settings):

1. **Usage access** — for real screen time on Progress.
2. **Accessibility** — for auto block when you exceed a limit.

**Share from Instagram:** Share a reel → pick **HopOff** (pin it in the share sheet if needed).

---

## Rebuild when native code changes

```powershell
npm run build:android
```

Install the new APK over the old one.

---

## Troubleshooting

| Issue | Fix |
| --- | --- |
| `Not logged in` | Run `npx eas-cli login` |
| Build fails on expo.dev | Open the build log link; paste errors in chat |
| App won't connect to Metro | Kill stale Metro: `npm run start:clean`. Same Wi‑Fi; if still stuck use `npm run start:tunnel:clean`. Force-stop HopOff, then reopen. |
| Infinite loading / DevTools warning | That warning is only Chrome debugging — ignore it. Use `start:clean` above; don't run `npm start` twice (port 8081 conflict skips the server silently). |
| HopOff not in share sheet | Reinstall latest APK after a successful build |
| "Install blocked" | Settings → allow installs from Chrome/Files |

---

## vs local Android Studio

| | EAS Build | USB + `npm run android:device` |
| --- | --- | --- |
| Cable | No | Yes (first install) |
| Android Studio | No | Yes |
| Build location | Expo cloud | Your PC |
| Best for | You | Faster iteration if already set up |
