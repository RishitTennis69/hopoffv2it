# HopOff Chrome Extension Recreation Prompt

> You are an expert product engineer and frontend designer. Build a standalone Chrome extension that recreates HopOff as faithfully as possible for the browser. Treat this as a frame-by-frame, pixel-by-pixel recreation of the existing mobile app's frontend language, product behavior, pacing, and emotional tone, adapted to very different Chrome extension dimensions.

Do not redesign HopOff. Translate it. The extension should feel like the same product moved from a phone into Chrome: black cinematic canvas, white typography, frosted dark glass, blunt intervention copy, motivation videos, goal-driven alternatives, session limits, and a calm but firm block experience.

## Product Summary

HopOff is a screen-time intervention app. It does not show a generic "time's up" banner. It interrupts the user's scroll with:

- A short self-written or generated message.
- A quiet pause.
- A motivation video the user chose.
- A direct choice: commit to doing better, or intentionally continue wasting time.
- A goal-based next action, optionally opening a goal app/site after the user commits.

The Chrome extension version should track websites instead of mobile apps, but the mental model stays the same: users choose distracting sites, group them, set daily/session limits, add goals, add motivation videos, and get blocked when a limit is crossed.

## Target Platform

Build a Manifest V3 Chrome extension.

Use:

- React + TypeScript
- Vite
- Manifest V3 service worker
- `chrome.storage.local` persistence
- `chrome.tabs`, `chrome.alarms`, `chrome.idle`, `chrome.permissions`, and host permissions
- CSS modules or plain CSS with design tokens
- Framer Motion or CSS animations for transitions
- YouTube iframe embeds for motivation videos

The output should be a complete extension project, but this prompt is only the build spec. Do not ask for the original mobile source code.

## Chrome Extension Surfaces

Use these extension surfaces:

- `onboarding.html`: opens on first install.
- `app.html`: main HopOff dashboard, opened when the extension icon is clicked.
- `block.html`: replaces or overlays the distracting tab when a limit is reached.
- `settings.html` or an in-app settings route.
- Background service worker for usage tracking and block triggers.
- Optional content scripts for Shorts/Reels/feed-specific detection.

Do not use a tiny default browser-action popup as the main app. The app needs room to breathe. Clicking the extension icon should open or focus the full `app.html` tab.

## Visual Identity

Recreate HopOff's mobile frontend language as closely as possible.

### Canvas

- Pure black background: `#000000`.
- UI should feel cinematic, spare, and intentional.
- Avoid generic dashboard styling.
- Avoid colorful gradients, marketing hero sections, or friendly productivity-app cheeriness.
- The app should feel quiet, serious, and slightly confrontational.

### Layout Adaptation

Because Chrome dimensions differ from phone dimensions:

- Onboarding and block screens should render in a centered phone-like column, roughly `420px` to `520px` wide.
- Main dashboard can use a wider centered column, roughly `680px` to `760px`.
- Keep the same vertical rhythm as mobile: generous spacing, strong center alignment, compact controls.
- Do not stretch the UI edge-to-edge across desktop.
- On narrow windows, collapse naturally to a phone-width responsive layout.

### Colors

Use these tokens exactly:

```css
:root {
  --bg: #000000;
  --card: #F0F0F0;
  --card-text: #000000;

  --text: #FFFFFF;
  --text-muted: rgba(255,255,255,0.6);
  --text-faint: rgba(255,255,255,0.3);
  --text-ghost: rgba(255,255,255,0.18);

  --glass-fill: rgba(255,255,255,0.04);
  --glass-fill-active: rgba(255,255,255,0.08);
  --glass-border: rgba(255,255,255,0.10);
  --glass-border-active: rgba(255,255,255,0.18);
  --glass-highlight: rgba(255,255,255,0.22);

  --dark: #0E0E0E;
  --dark-elevated: #161616;
  --accent: #3466AA;

  --danger: #E2453C;
  --success: #3FB984;

  --scrim: rgba(0,0,0,0.5);
  --scrim-heavy: rgba(0,0,0,0.92);
}
```

### Spacing And Radius

```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;
  --space-2xl: 24px;
  --space-3xl: 32px;
  --screen-pad: 22px;

  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-card: 22px;
  --radius-pill: 999px;
}
```

### Typography

Use Inter or a visually equivalent local font bundle. Match this scale:

```css
.t-hero {
  font-weight: 900;
  font-size: 34px;
  line-height: 39px;
  letter-spacing: -0.5px;
}

.t-title {
  font-weight: 800;
  font-size: 30px;
  line-height: 36px;
  letter-spacing: -0.4px;
}

.t-subheading {
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
}

.t-body {
  font-weight: 400;
  font-size: 15px;
  line-height: 22px;
}

.t-body-strong {
  font-weight: 600;
  font-size: 16px;
  line-height: 22px;
}

.t-caption {
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0.3px;
}

.t-stat {
  font-weight: 800;
  font-size: 30px;
  letter-spacing: -1px;
}

.t-button {
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.1px;
}
```

## Core Components

Implement these components and reuse them everywhere.

### PillButton

Full-width rounded pill button.

- `primary`: fill `--card`, text `--card-text`
- `dark`: fill `--dark`, text white, hairline glass border
- `ghost`: transparent, muted text
- `accent`: fill `--accent`, white text
- Min height `58px`
- Border radius `999px`
- Pressed opacity `0.88`
- Disabled opacity `0.35`

### GlassCard

Dark frosted card:

- Background `--glass-fill`
- Border `1px solid --glass-border`
- Radius `22px`
- Active state uses `--glass-fill-active` and `--glass-border-active`

### ScreenTitle

Centered title and optional muted subtitle.

### ProgressDots

Dots for onboarding progress:

- Current dot is white and wider.
- Inactive dots are faint.
- Clickable to jump between completed/available onboarding steps.

### HourWheel

Circular limit picker:

- SVG dial.
- White progress arc.
- White handle with small black center dot.
- Center text shows current value.
- Drag with pointer events.
- Snap to step values.

### VideoCard

9:16 thumbnail card:

- Rounded vertical frame.
- Center play badge.
- Duration badge.
- Title and author metadata.
- Add/remove/select affordance.

### GroupCard

Represents a group of distracting sites:

- Stacked site icons.
- Group name.
- Daily limit label.
- Session label, like `20m sessions`.
- Optional delete icon.

### BlockVideoFrame

9:16 video frame for the block page:

- YouTube iframe.
- Autoplay with sound if allowed.
- Controls hidden during block.
- Detect video ended.
- If autoplay is blocked by Chrome, show one large play button in the same style and require click.

## Data Model

Use persisted Zustand stores backed by `chrome.storage.local`.

```ts
type BlockMode = 'shorts' | 'reels';

interface Site {
  id: string;
  name: string;
  brand: string;
  domains: string[];
  parentId?: string;
  mode?: BlockMode;
  match?: string;
}

interface SiteGroup {
  id: string;
  name: string;
  siteIds: string[];
  limitHours: number;
  sessionCount?: number;
  sessionLimitMinutes?: number;
}

interface VideoClip {
  id: string;
  source: 'youtube' | 'mp4';
  youtubeId?: string;
  url?: string;
  title: string;
  author: string;
  durationSec: number;
  thumbnail?: string;
}

interface DayUsage {
  label: string;
  bySite: Record<string, number>;
}

interface GoalAppTarget {
  siteId: string;
  name: string;
  url: string;
}

interface GoalsState {
  text: string;
  selfMessage: string;
  goalTarget: GoalAppTarget | null;
}

interface UsageState {
  week: DayUsage[];
  selectedDayIndex: number;
  commits: number;
  wastes: number;
  snoozeUntil: Record<string, number>;
}
```

## Built-In Site Catalog

Use these default sites:

```ts
const SITES = [
  {
    id: 'youtube',
    name: 'YouTube',
    brand: 'youtube',
    domains: ['youtube.com'],
  },
  {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    brand: 'youtube_shorts',
    parentId: 'youtube',
    mode: 'shorts',
    domains: ['youtube.com'],
    match: '/shorts',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    brand: 'tiktok',
    domains: ['tiktok.com'],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    brand: 'instagram',
    domains: ['instagram.com'],
  },
  {
    id: 'reels',
    name: 'Instagram Reels',
    brand: 'reels',
    parentId: 'instagram',
    mode: 'reels',
    domains: ['instagram.com'],
    match: '/reels',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    brand: 'reddit',
    domains: ['reddit.com'],
  },
  {
    id: 'x',
    name: 'X',
    brand: 'x',
    domains: ['x.com', 'twitter.com'],
  },
];
```

Also support custom sites.

## Onboarding Flow

The current HopOff onboarding is intentionally short. Do not include old questions like "How much time do you spend on your phone?" or "What distracts you?"

Use this flow:

1. Welcome
2. Goals
3. Videos
4. Apps/Sites
5. Permissions

Progress dots should count the four setup steps after Welcome:

- Goals
- Videos
- Apps/Sites
- Permissions

### Welcome

Full black screen in centered phone-like column.

Copy:

- Eyebrow: `HopOff`
- Hero line 1: `Stop scrolling.`
- Hero line 2: `Start living.`
- Primary button: `Start My HopOff Journey`

Show a vertical 9:16 motivational video in the center. Autoplay with sound when possible.

### Goals

Title:

`Define your weekly goals.`

Subtitle:

`These become the alternatives we surface when you hit a limit.`

Fields:

- Multiline goals textarea.
- Placeholder:

```text
e.g. Read 10 pages
Go to the gym
Call my family
```

- Self-written overlay message input.
- Label: `OVERLAY MESSAGE`
- Placeholder: `Write what future-you needs to hear`
- Goal target picker.
- Label: `AFTER I COMMIT`
- User can choose one destination site/app-like target to open after committing. In a browser extension, this should be a URL such as Google Docs, Calendar, Slack web, Strava web, Notion, or a custom URL.

Footer button:

`Continue`

Disabled until the goals textarea has text.

### Videos

Title:

`Here's your starter library.`

Subtitle:

`We added three to get you going. Make it yours`

Behavior:

- Seed with three short motivational clips.
- Let user search YouTube and add clips.
- If the user keeps defaults, confirm with modal:

Title: `Keep the starter picks?`

Message:

`You haven't changed your library — we'll keep the three starter clips. You can edit them anytime.`

Buttons:

- `Keep starter picks`
- `Go back`

Footer:

`Continue`

Disabled if library is empty.

### Apps/Sites

Title:

`Select the sites to limit.`

Subtitle:

`Pick what pulls you in, then group sites with a daily limit.`

Behavior:

- User selects distracting sites.
- User creates groups.
- Each group has a daily limit via HourWheel.
- Each group also has session splitting: 2, 3, or 4 sessions.
- Show computed session length, e.g. `Interrupt every 20 min across this group.`
- Group cards show daily limit plus session label, e.g. `1 Hr` and `20m sessions`.

Footer:

`Continue`

Disabled until at least one group has a limit.

### Permissions

Title:

`Turn on permissions`

Body:

`HopOff uses your browsing activity to show your screen time and to step in when you pass a limit. Your data never leaves your browser.`

Permission steps:

- Storage
- Tabs
- Idle detection
- Alarms
- Host permissions for selected sites

Use Chrome runtime permission requests. When permissions are granted, detect immediately and advance the in-app checklist without requiring another button press.

After all permissions are complete, route to the main app.

## Main App

Clicking the extension icon opens the main app page. It should default to Progress.

Use four top tabs:

- Progress
- Videos
- Goals
- Apps

Use the same dark tab visual language from mobile: active white, inactive faint, compact icon + label.

### Progress Tab

Title:

`What you could have been doing`

Show:

- StatCard with `Time wasted`, `Screen time`, `Commit rate`
- Insight section: `That's enough time to...`
- Weekly bar chart
- Soft spots list
- Settings and Log out controls

Soft spots:

- Sort selected day's site usage descending.
- If empty, show:

`No tracked site usage yet today.`

Over-limit rows should use danger styling.

### Videos Tab

Title:

`Unlock your motivation`

Show video library and YouTube search.

### Goals Tab

Title:

`Work towards your biggest dreams`

Show:

- Goals editor
- Self-message editor
- Goal target URL picker/editor

### Apps Tab

Title:

`Block out the noise`

Show site manager, groups, limits, and session settings.

## Block Page

This is the most important screen. Recreate it carefully.

The block page should be centered, black, and phone-like. It should not look like a Chrome error page.

### Sequence

1. The user hits a limit.
2. The distracting tab redirects to `block.html?site=<siteId>`.
3. The block page shows the intro message for 5 seconds.
4. The intro fades out.
5. The motivation video fades in and starts.
6. The footer actions remain hidden until the video ends.
7. After the video ends, show the alternative goal line and actions.

### Intro Message

If the user wrote a self-message, show that first.

If not, show a generated block headline.

Then show a second line using a generated headline such as `Enough scrolling.` or `{site} can wait.`

Use encrypted/scramble text animation:

- Line 1 resolves over about `700ms`.
- Line 2 starts around `720ms`.
- Intro lasts total `5000ms`.
- Fade transition into video lasts around `650ms`.

### Block Headlines

Pick from:

```ts
const BLOCK_HEADLINES = [
  ['Enough scrolling.', `Your {site} limit's up.`],
  ['Time to hop off.', `{site} can wait.`],
  ['This feed had its turn.', `Step away from {site}.`],
  ['You hit your limit.', `Close {site} for now.`],
  ['Pause the scroll.', `{site} isn't going anywhere.`],
  ['Your future self called.', `It wants you off {site}.`],
  ['Not one more swipe.', `{site} - you're done for today.`],
  ['Break the loop.', `You set a limit on {site}.`],
];
```

### Video

- 9:16 frame.
- Centered.
- No YouTube controls.
- No seeking.
- Sound on.
- If autoplay is blocked, show a play overlay.
- Track ended event.

Before video ends, footer caption:

`Watch the full clip...`

### Footer After Video Ends

Fade in after video ended.

Show:

- `Instead, {goal fragment}`
- Primary button: `I'll commit to do better`
- Ghost text/button: `I'm gonna waste my life`

Behavior:

- Commit records a commit, returns HopOff's own app route to Progress, then opens the selected goal target URL if one exists.
- If no goal target exists, return to main Progress.
- Waste records a waste, snoozes this site for 15 minutes, and returns to the blocked site.

## Session Limits

Daily limits are still the hard cap. Session limits create earlier interruptions.

For each group:

- `limitHours` is the daily budget.
- `sessionCount` is 2, 3, or 4.
- `sessionLimitMinutes = round(limitHours * 60 / sessionCount)`.

Example:

- 1 hour daily limit
- 3 sessions
- Session interrupt every 20 minutes

Chrome service worker behavior:

- Track active tab foreground time.
- Pause tracking when Chrome is idle/locked.
- Flush time frequently with `chrome.alarms`.
- Persist today's usage in `chrome.storage.local`.
- If active continuous session exceeds `sessionLimitMinutes`, trigger block.
- If total daily usage exceeds `limitHours * 60`, trigger block.
- If site is snoozed, do not block until snooze expires.

## Goal Target After Commit

The browser version cannot open native mobile apps, so use URLs.

Examples:

- Google Calendar
- Google Docs
- Notion
- Slack web
- Strava web
- GitHub
- A custom URL entered by the user

When the user commits from the block page:

1. Record commit.
2. Mark HopOff's internal route as Progress.
3. Open the goal target URL in the current tab or a new tab.

Prefer current tab if the block page replaced the distracting tab.

## Self-Written Messages

The user can write a short message to themselves during onboarding and edit it later in Goals.

Use this message at the top of the block sequence.

If empty, fall back to generated block headlines.

Keep this message prominent but not decorative. It should feel like future-you interrupting present-you.

## Usage Tracking

Use service worker state plus persisted storage.

Track:

- Active tab URL
- Matched site ID
- Session start time
- Daily usage by site
- Weekly usage by site
- Snoozes
- Commit/waste counts

Important:

- Service workers sleep. Persist often.
- Use `chrome.alarms` to reconcile.
- Use `chrome.idle` to avoid counting idle computer time.
- Use URL matching for normal sites.
- Use path matching for feed-only modes like YouTube Shorts (`/shorts`) and Instagram Reels (`/reels`).
- Do not claim Shorts/Reels usage if detection is uncertain.

## Formatting Helpers

Use exactly:

```ts
function formatLimit(hours: number) {
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  if (whole === 0) return `${mins} Min`;
  const hr = `${whole} ${whole === 1 ? 'Hr' : 'Hrs'}`;
  return mins === 0 ? hr : `${hr} ${mins} Min`;
}

function formatHours(h: number) {
  return Number.isInteger(h) ? `${h}` : h.toFixed(1);
}

function formatHoursUnit(h: number) {
  return `${formatHours(h)} ${h === 1 ? 'Hr' : 'Hrs'}`;
}

function pct(v: number) {
  return `${Math.round(v)} %`;
}
```

## Derived Stats

Progress stat card:

- `Time wasted`: total tracked site hours over the synced window.
- `Screen time`: average tracked minutes per day.
- `Commit rate`: `commits / (commits + wastes) * 100`, rounded. Show `0` if no interactions.

## Copy Tone

HopOff is direct, not bubbly.

Use phrases like:

- `Stop scrolling.`
- `Start living.`
- `What you could have been doing`
- `Unlock your motivation`
- `Work towards your biggest dreams`
- `Block out the noise`
- `I'll commit to do better`
- `I'm gonna waste my life`
- `Instead, read 3 pages now`

Avoid:

- Friendly gamification
- Streak confetti
- Cutesy mascot language
- Corporate wellness copy
- Explanatory in-app paragraphs unless needed for permissions

## Definition Of Done

The extension is complete when:

- First install opens onboarding.
- Onboarding flow is exactly: Welcome, Goals, Videos, Apps/Sites, Permissions.
- Main app has Progress, Videos, Goals, Apps tabs.
- Users can create site groups with daily and session limits.
- Users can write self-messages.
- Users can choose a goal target URL after commit.
- Usage tracking works across browser sessions.
- Session and daily limits trigger the block page.
- Block page follows the message-first, video-second sequence.
- Commit opens goal target.
- Waste snoozes for 15 minutes and returns to the distracting site.
- UI matches HopOff's black/glass/light-card design language.
- The result feels like HopOff, not a generic productivity extension.
