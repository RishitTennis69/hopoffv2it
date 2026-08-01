# Google Play Compliance Audit

Audit date: 2026-07-12

## Source-Level Status

| Area | Status | Evidence / action |
| --- | --- | --- |
| App title length | Pass | `HopOff` is 6 characters in `app.json`. |
| Target API level | Needs build confirmation | Native Gradle uses `rootProject.ext.targetSdkVersion`; confirm the produced AAB targets Android 15 / API 35 or newer in Play Console or with bundletool. |
| Version code drift | Fixed | `app.json` and `android/app/build.gradle` both use Android `versionCode` 8. |
| Network encryption | Pass with one config guard | Runtime proxy URLs must be HTTPS outside dev; app-visible URLs found in source use HTTPS. |
| Unnecessary sensitive permissions | Improved | Blocked `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE`, and `WRITE_EXTERNAL_STORAGE` in `app.json`; removed them from the checked-in main Android manifest. |
| Usage access / accessibility | Review risk | `PACKAGE_USAGE_STATS` and an accessibility service are core to app limiting. Keep store listing, onboarding copy, and Play declarations tightly limited to screen-time tracking and blocking distracting apps. |
| Privacy policy in app | Added | Settings links to `https://gethopoff.app/privacy`. Ensure the URL is live, public, non-editable by users, and also entered in Play Console. |
| Account deletion | Pass if no accounts | Settings now states HopOff does not create in-app user accounts and offers local data deletion. If account creation is added later, add in-app and web account deletion flows. |
| AI reporting | Added | AI-generated progress/block suggestions now include in-app report controls. Reports post to `/ai/report-content` when the proxy exists or queue locally otherwise. |
| Broken functionality | Needs device QA | TypeScript passes. Run a production Android internal test and review Play Pre-launch Report for crashes, blank pages, and inactive buttons. |

## Play Console Checklist

- Developer account type: confirm whether the app is owned by an Organization account if Google classifies HopOff as health/wellbeing or another restricted category.
- Data safety: disclose local usage data, selected apps/package visibility, microphone/speech recognition use, generated goals/prompts, proxy client ID, AI provider processing, YouTube/social embed/proxy calls, and any subscription/purchase data handled by the store SDK once real billing is added.
- Privacy policy: publish the same policy URL in Play Console and Settings.
- Permissions declarations: justify Usage Access and Accessibility only as app-limit/blocking functionality. Do not describe the service as surveillance or broad device monitoring.
- Content categories: HopOff does not appear to be gambling, lending, VPN, government, dating/social, or child-directed. Keep the target audience out of children unless the product, ads SDKs, and data collection model are redesigned for Families policy.
- Generative AI: maintain the in-app report path and wire the production proxy endpoint to developer review/moderation before launch.
- Store metadata: screenshots should show actual app limiting/progress flows and should not imply guaranteed mental-health outcomes, system warnings, or unsupported app-store performance claims.
