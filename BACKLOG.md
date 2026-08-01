# HopOff backlog

Items we’ve discussed but not finished yet — Google Cloud setup, integrations, polish, and UX follow-ups. Check things off here as you go.

---

## Google Tasks integration

**Status:** UI toggle only (`GoalsEditor` → Connect → Google Tasks). Toggling “Connected” does not sync goals to Tasks yet.

### What you need to do in Google Cloud

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
2. **APIs & Services → Library** → enable **Google Tasks API**.
3. **OAuth consent screen**
   - User type: **External** (or Internal if you’re on Workspace).
   - Add scope: `https://www.googleapis.com/auth/tasks`
   - Add test users while in “Testing” mode.
4. **Credentials → Create credentials → OAuth client ID**
   - **Android client**
     - Package name: `com.hopoff.app` (must match `app.json`).
     - SHA-1: from your debug keystore or EAS credentials (`eas credentials`).
   - **Web client** (needed for Expo auth redirect flow)
     - Authorized redirect URIs: whatever `expo-auth-session` uses for this app (e.g. Expo proxy URL or custom scheme callback).
5. Copy the **Web client ID** (and Android client ID if separate) into the project — likely as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env` once wired.

### What we still need to build in the app

- [ ] OAuth sign-in with `expo-auth-session` + Google provider.
- [ ] Persist refresh token securely (e.g. `expo-secure-store`).
- [ ] Service module (e.g. `src/services/googleTasks.ts`):
  - List task lists / default list.
  - Create one task per goal line when user connects or when goals change.
  - Handle disconnect / token revoke.
- [ ] Wire `useGoals.connections.googleTasks` to real auth state, not just a boolean toggle.
- [ ] Error UX: token expired, API quota, offline.

### Useful API reference

- [Tasks API overview](https://developers.google.com/tasks)
- [tasks.tasks.insert](https://developers.google.com/tasks/reference/rest/v1/tasks/insert)

---

## iOS goal connections (Apple Notes & Reminders)

**Status:** Same as Google Tasks — toggles in `GoalsEditor` on iOS only; no native sync.

- [ ] **Apple Reminders:** EventKit / Reminders API (or Shortcuts deep link as a lighter v1).
- [ ] **Apple Notes:** No public write API; options are Share Sheet, Shortcuts, or skip and keep Reminders-only on iOS.

---

## AI / LLM services

**Status:** Heuristic mocks in place; UI already calls them.

| Feature | File | Today | Real work |
| --- | --- | --- | --- |
| Goal polish on blur / voice | `src/services/aiPolish.ts` | Keyword/heuristic rewrite | LLM prompt: one short imperative line per goal |
| “That’s enough time to…” + block alternatives | `src/services/insights.ts` | Templates + user goal lines | Optional LLM keyed on `weekHours` + goals |

- [ ] Choose provider (OpenAI, Anthropic, etc.) and add API key to `.env` / EAS secrets.
- [ ] Keep the same `Promise<string>` / return shapes so UI stays unchanged.

---

## YouTube search & embed

### Search (Data API v3)

**Status:** Real search when `EXPO_PUBLIC_YOUTUBE_API_KEY` is set; otherwise mock library in `src/services/youtube.ts`.

- [ ] Confirm key in `.env` and restart Metro with cache clear: `npx expo start -c`
- [ ] Enable **YouTube Data API v3** on the same Google Cloud project as the API key.
- [ ] Restrict the key (Android app + API restriction) before shipping.

**Metro note:** `EXPO_PUBLIC_*` variables are baked in when Metro starts. Changing `.env` without `-c` is why mock titles can still appear.

### In-app playback (embed)

**Status:** Implemented in `src/components/VideoFrame.tsx` — WebView loads YouTube IFrame Player API with:

- `baseUrl` = `https://com.hopoff.app`
- `origin` in `playerVars` = same value (`src/config/appId.ts`)

- [ ] **Verify on device** after Metro restart + full app reload (not just hot refresh).
- [ ] If embed still fails: confirm dev build package is `com.hopoff.app`; Error 153 usually means origin/baseUrl mismatch.
- [ ] Web uses plain `<iframe>` with the same origin query param.

---

## Video library UX (follow-ups)

**Status:** Shipped basics — tap thumbnail to select, center play for preview, white border on `+`, duplicate toasts in `CollectionManager`.

Optional improvements (pick later):

- [ ] **Already in library badge** on search results (`hasVideo()` exists in `useVideos`).
- [ ] **Auto-deselect** duplicates when search results load.
- [ ] **Replace vs skip** dialog when adding a duplicate intentionally.
- [ ] Block selecting duplicates entirely (dim card + “Added” label).

Current behavior: duplicates are skipped silently with toast — `Added N · M already in library` or `Already in your library`.

---

## Subscriptions & paywall

**Status:** Local trial/plan state in `useSubscription.ts` — no App Store / Play Billing yet.

- [ ] Integrate **RevenueCat** or native IAP.
- [ ] Wire onboarding paywall + settings “Restore purchase” to real receipts.
- [ ] Trial expiry gate on tabs (`progress.tsx` already reads `trialExpired`).

---

## Native platform (Android / iOS)

Partially implemented on Android (`nativeUsage.android.ts`); iOS / Expo Go still use mocks in `nativeUsage.ts`.

| Area | File(s) | Notes |
| --- | --- | --- |
| Usage stats + permissions | `nativeUsage.*` | Android: Usage Access + Accessibility steps in onboarding |
| Block when limit exceeded | `blockMonitor.ts` | Accessibility foreground detection → `hopoff://block` |
| Share-sheet video intake | `shareIntake.ts` | TikTok / Instagram links into library |

See also: [NATIVE_SETUP.md](./NATIVE_SETUP.md), [ANDROID_SETUP.md](./ANDROID_SETUP.md), [EAS_BUILD.md](./EAS_BUILD.md).

- [ ] End-to-end block flow on a physical Android dev build.
- [ ] iOS Screen Time / DeviceActivity (entitlements + dev build).
- [ ] Share extension / intent filter for motivation clips.

---

## Permissions onboarding

**Status:** Microphone step **removed** from onboarding (was glitching the Usage → Accessibility flow). Steps: Android = Usage Access → Accessibility; iOS = Screen Time.

- [ ] Voice input on goals (`GoalsVoiceMic`) still uses mic at runtime — separate from onboarding permissions.
- [ ] Production: turn off `config.permissiveOnboarding` behavior for release (`__DEV__` only today).

---

## Environment variables (reference)

Copy `.env.example` → `.env`.

| Variable | Purpose | Status |
| --- | --- | --- |
| `EXPO_PUBLIC_YOUTUBE_API_KEY` | YouTube search | Documented in `.env.example` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth (Tasks) | **Not wired yet** — add when implementing Tasks |
| LLM API key(s) | Polish + insights | **Not wired yet** |

After any `.env` change: `npx expo start -c` and reload the app.

---

## Quick verification checklist (after Metro restart)

- [ ] Dev console shows `[HopOff] YouTube API key loaded: true`
- [ ] Video search returns real titles (not mock names like seeded library)
- [ ] Tap video thumbnail selects; center play opens preview
- [ ] Permissions: after “I enabled Usage Access”, footer shows **Open Accessibility** (Android)
- [ ] YouTube preview plays inside app (or shows “Video unavailable” for dead IDs)

---

*Last updated: June 2025 — add rows here as new items get tabled.*
