# HopOff Play Console Launch Checklist

Last updated: 2026-07-12

This checklist is based on the current HopOff repo state, not a generic app template.

## Launch Decision

HopOff is currently closest to:

- App category: Productivity / Tools / Digital wellbeing
- Not medical treatment
- Not a VPN
- Not financial, government, gambling, dating, or child-directed

Avoid store listing claims like:

- "Cures addiction"
- "Treats anxiety/depression"
- "Guaranteed to fix screen time"
- "Clinically proven" unless you have actual evidence

Safer framing:

- "Helps you limit distracting apps"
- "Shows motivational resets when you pass your limits"
- "Tracks selected app usage on-device"
- "Build healthier screen-time habits"

## Owner-Side Required Items

### 1. Publish Policy URLs

Use these URLs in Play Console and inside the app:

- Privacy policy: `https://gethopoff.app/privacy`
- Data deletion: `https://gethopoff.app/delete-data`

Current code already points Settings to both URLs:

- `src/app/settings.tsx`

What the pages should say:

- HopOff tracks selected app usage / distracting app usage.
- HopOff stores goals, selected apps, limits, videos, and usage snapshots on device.
- HopOff may send limited prompts/goals/content to the backend proxy for AI-generated suggestions.
- HopOff uses YouTube/OpenRouter through a server-side proxy.
- HopOff can use microphone/speech recognition only when the user chooses voice goal entry.
- HopOff does not sell personal data.
- Users can clear local app data in Settings.
- If no account system exists, say there is no server account to delete yet.

Status:

- Required before production submission.
- I can draft these pages if you tell me where `gethopoff.app` is hosted.

### 2. Data Safety Form

Use this as the working draft for Play Console. Final wording depends on exactly what Google asks in the form.

Data types likely handled:

| Data type | Collected? | Shared? | Notes |
| --- | --- | --- | --- |
| App activity / app interactions | Yes | No / limited service processing | Usage access reads selected app usage to calculate screen time, limits, and progress. |
| Installed apps / selected apps | Yes | No / limited service processing | App package IDs and selected blocked/redirect apps are stored locally; suggestions may use goal-related catalog data. |
| User-provided goals | Yes | Yes, to service provider if AI enabled | Goals can be sent to HopOff proxy/OpenRouter to generate suggestions. |
| Audio / voice | Maybe | Maybe, only if user uses voice input | Microphone/speech recognition exists for voice goal entry. If not used in production, consider removing or clearly declaring. |
| Device or other IDs | Yes | Yes, to HopOff proxy | Anonymous per-install proxy client id is sent for rate limiting. |
| Videos / content choices | Yes | Maybe | Selected YouTube/video library data is stored locally; YouTube metadata/search goes through proxy. |
| Purchases/subscriptions | Not real yet / future | Google Play | Settings has subscription UI/test state. Declare purchase data only when billing is actually wired. |
| Crash diagnostics | Not obvious in repo | No | No crash analytics SDK found in the current scan. |
| Location | No | No | No location permission found. |
| Contacts | No | No | No contacts permission found. |
| Photos/files | No | No | Storage permissions are blocked in `app.json`. |

Suggested security/privacy answers:

- Data encrypted in transit: Yes, backend proxy requires HTTPS outside dev.
- Users can request/delete data: Yes for local app data; web deletion page should explain current no-account model.
- Data collection optional where true: Voice input is optional; usage/accessibility permissions are needed for core blocking features.
- Data shared with third parties: Yes, service providers if AI/video proxy features are used. Name providers in privacy policy, not necessarily in Play form unless asked.

### 3. Permissions Declaration

Current sensitive Android behavior:

- `PACKAGE_USAGE_STATS` via `plugins/withHopOffAndroid.js`
- Accessibility service via `modules/hopoff-monitor`
- `RECORD_AUDIO` for voice goal entry

Play Console permission justification:

- Usage access: lets HopOff read selected app usage so users can see screen time and enforce limits.
- Accessibility: lets HopOff detect when a blocked app opens and show the intervention/reset screen.
- Microphone: lets users dictate goals; optional.

Avoid saying:

- "We monitor everything you do."
- "We spy on apps."
- "We read messages/content."

Say:

- "HopOff uses usage access and accessibility only to detect selected distracting apps and enforce user-created limits."

### 4. Android Target API

Current repo:

- Expo SDK: `~56.0.12`
- Android version code: `9`
- Expo SDK 56 defaults should target Android API 36, which clears the API 35+ Play requirement.

Before upload:

- Build a fresh production AAB.
- Confirm Play Console does not warn about target API.

Useful command:

```powershell
npx eas build --profile production --platform android
```

### 5. Backend Proxy / AI

Current backend proxy routes that exist:

- `/youtube/search-items`
- `/youtube/details`
- `/youtube/metadata`
- `/ai/polish-goals`
- `/ai/enough-time`
- `/ai/block-alternative`
- `/ai/goal-app-suggestions`
- `/ai/report-content`

Current server env vars needed:

```powershell
npx eas env:create --name YOUTUBE_API_KEY --value "YOUR_KEY" --environment production --visibility sensitive
npx eas env:create --name OPENROUTER_API_KEY --value "YOUR_KEY" --environment production --visibility sensitive
npx eas env:create --name OPENROUTER_MODEL --value "openai/gpt-4o-mini" --environment production --visibility plaintext
npx eas env:create --name EXPO_PUBLIC_HOPOFF_API_BASE_URL --value "https://hopoffv2it.expo.app" --environment production --visibility plaintext
```

Optional but recommended if AI report controls are visible:

```powershell
npx eas env:create --name HOPOFF_REPORT_WEBHOOK_URL --value "https://YOUR_SECURE_WEBHOOK_URL" --environment production --visibility sensitive
```

Deploy command:

```powershell
npx expo export -p web
npx eas deploy --prod --environment production
```

Report-content behavior:

- `/ai/report-content` validates and accepts AI content reports.
- If `HOPOFF_REPORT_WEBHOOK_URL` is configured, reports are forwarded there for developer review.
- If no webhook is configured, the route returns success but only logs a server warning, so configure a webhook before claiming reports are actively reviewed.

### 6. Internal Testing / Pre-launch Report

Before production:

1. Upload AAB to internal testing.
2. Run Play Pre-launch Report.
3. Check for:
   - Crashes
   - Blank screens
   - Stuck permissions screens
   - Video playback errors
   - Dead buttons
   - Accessibility-service warning issues
   - Login/account/deletion policy warnings

Minimum manual test pass:

- Fresh install onboarding.
- Usage access enabled.
- Accessibility enabled.
- Select apps to block.
- Add goals.
- Add videos / starter pack.
- Hit an intervention.
- Press `I'll commit to do better`.
- Press `Let me scroll`.
- Use Settings local data deletion.
- Check YouTube search works with proxy.
- Check AI suggestions work with proxy.

### 7. Store Listing Copy

Recommended title:

- `HopOff`

Short description idea:

- `Limit distracting apps and reclaim your screen time.`

Long description style:

- Focus on app limits, progress, goals, motivational reset videos, and user control.
- Do not mention "addiction cure" or medical outcomes.
- Do not claim guaranteed results.
- Do not overstate Shorts/Reels detection if that feature is not reliable.

Screenshot guidance:

- Use actual app screens.
- Show onboarding, progress, selected apps, Lock In, and intervention.
- Avoid screenshots implying system-level blocking powers beyond what the app does.

## What Is Overkill For This Launch

Probably overkill right now:

- Doppler/Infisical/Keyway vault migration.
- Organization account unless you market HopOff as clinical/medical/mental-health treatment.
- Full user account system.
- Database-backed moderation queue if report controls are hidden.
- Enterprise-grade fraud detection.

Worth doing for public beta:

- EAS server-side secrets.
- Basic proxy rate limits.
- Generic backend errors.
- Accurate privacy policy.
- Accurate Data safety answers.
- Internal testing first.

## Code Items I Can Do Next

Recommended next engineering fixes:

1. Configure `HOPOFF_REPORT_WEBHOOK_URL` if AI report controls remain visible.
2. Draft `privacy` and `delete-data` pages for `gethopoff.app`.
3. Add a small launch-mode check screen/QA doc for all required Play review flows.
4. Build fresh AAB version code `9`.

## Official References

- Expo SDK 56 docs: `https://docs.expo.dev/versions/v56.0.0/`
- Google Play Data safety: `https://support.google.com/googleplay/android-developer/answer/10787469`
- Google Play target API level requirements: `https://support.google.com/googleplay/android-developer/answer/11926878`
- Google Play User Data policy: `https://support.google.com/googleplay/android-developer/answer/10144311`
