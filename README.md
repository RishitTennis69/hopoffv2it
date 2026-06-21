# HopOff

> Stop scrolling. Start living.

HopOff is a black, cinematic screen-time intervention app. Instead of a gray "time's up" banner, it interrupts you at the moment you waste time with your own motivation clips and a blunt reminder of what you said you'd rather be doing.

This repo contains the **complete, runnable UI/UX** built with Expo Router. Every screen, animation, piece of state and persistence is implemented. The deep native integrations (usage tracking, the block trigger, platform permissions) and external APIs (YouTube search, AI goal polish, share-sheet intake) sit behind a clean service layer with realistic **mock implementations** so the whole app runs offline with no API keys. Each mock marks the real work with `TODO(native/real)`.

## Tech stack

- **Expo SDK 56** (managed) + **expo-router** (file-based navigation) + **TypeScript**
- **react-native-reanimated** + **react-native-gesture-handler** — onboarding transitions, scramble text, bar bounce, dial drag, list reorder
- **react-native-svg** — the HourWheel dial + spokes, shield icon
- **expo-video** + **react-native-webview** — 9:16 MP4 playback + YouTube embeds
- **expo-haptics**, **@expo-google-fonts/inter**, **expo-linking** (`hopoff://block`)
- **@react-native-async-storage/async-storage** + **zustand** — persisted state

## Running on Android (recommended: EAS Build)

**No USB cable. No Android Studio.** Expo builds HopOff in the cloud; you install an APK on your phone once, then use Wi‑Fi + `npm start` like before.

**Step-by-step:** [EAS_BUILD.md](EAS_BUILD.md)

```powershell
cd "C:\Users\Krish Grover\Documents\hopoffv2it"
npx eas-cli login
npx eas-cli init
npm run build:android
```

When the build finishes, open the link **on your phone**, install the APK, then:

```powershell
npm start
```

Open **HopOff** on your phone (same Wi‑Fi). Not Expo Go.

Alternative (local build + USB): [ANDROID_SETUP.md](ANDROID_SETUP.md)

## Project structure

```
src/
  app/                     # expo-router routes
    _layout.tsx            # fonts, providers, root Stack, status bar
    index.tsx              # gate -> onboarding or tabs (waits for hydration)
    onboarding/            # 8-step flow (welcome + questions + apps + goals
                           #   + videos + permissions + paywall)
    (tabs)/                # progress | videos | goals | apps (dark tab bar)
    block.tsx              # full-screen intervention overlay
    settings.tsx           # subscription + log out
  components/              # design-system + feature components
  theme/                   # colors, typography (Inter), spacing, radius
  store/                   # zustand stores (persisted via AsyncStorage)
  services/                # native + external integrations (mocked)
  data/                    # the app catalog
  lib/                     # haptics, time formatting, onboarding steps
```

## Design language

- Pure black canvas (`#000000`); white type, light cards (`#F0F0F0`) for stat tiles and primary CTAs
- Dark glass panels (~4% white fill, hairline borders that brighten when active), 22px card radius, 999px pills
- Inter everywhere (Black / ExtraBold / SemiBold / Regular)
- Pill buttons: primary (light), dark (secondary), ghost (dismiss), accent (`#3466AA`)
- Light haptics on meaningful taps

## What is mocked (and where the real work goes)

The app is fully functional against these mocks. Search each file for `TODO` to find the integration points.

| Area | Mock file | Real implementation |
| --- | --- | --- |
| Installed apps + 7-day usage + permission status | `src/services/nativeUsage.ts` | Android: `PackageManager` + `UsageStatsManager` (Usage Access). iOS: Screen Time / `FamilyControls` + `DeviceActivity` (entitlement). |
| Limit-exceeded block trigger | `src/services/blockMonitor.ts` | Android: `AccessibilityService` watches the foreground app and broadcasts `hopoff://block?appId=…`. iOS: `DeviceActivityMonitor` threshold event. |
| YouTube search | `src/services/youtube.ts` | YouTube Data API v3 `search` + `videos.list` for durations (needs an API key). |
| AI goal "polish" | `src/services/aiPolish.ts` | An LLM call that rewrites each line as a short imperative goal. |
| Share-sheet intake (TikTok/Instagram) | `src/services/shareIntake.ts` | Android `ACTION_SEND` intent-filter; iOS Share Extension writing to an app group. |
| Dashboard / block insights | `src/services/insights.ts` | Optional LLM generation keyed on weekly hours + goals. |

### Native build notes

The real usage/accessibility/Screen Time modules require a **development build** (`npx expo prebuild` + EAS), config plugins, and platform entitlements — they cannot run in Expo Go. The service interfaces above are designed so swapping in the native modules requires no changes to the UI.

## State

All stores persist to AsyncStorage and rehydrate on launch (`src/app/index.tsx` waits for hydration before routing):

- `useOnboarding` — answers (triggers, daily hours, priorities) + completion flag
- `useApps` — selected apps + groups with daily limits
- `useGoals` — goal text + connected services
- `useVideos` — motivation library (seeded with 3 starter clips)
- `useUsage` — week usage, soft spots, commit/waste counts
- `useSubscription` — trial start + plan
