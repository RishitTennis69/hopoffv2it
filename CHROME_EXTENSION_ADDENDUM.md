# HopOff Chrome Extension Addendum

Use this addendum alongside `CHROME_EXTENSION.md`. It captures product changes made after the original Chrome extension prompt and tells the Chrome extension developer what to add or update if their implementation does not already include it.

The main principle has not changed: do not turn HopOff into a settings-heavy control panel. Keep one core product loop:

`Allowance -> Session Interruption -> Commit or Waste -> Goal Next Step`

Everything below should feel like a layer on that loop, not a separate mode.

## 1. Shortened Onboarding

Remove the old question-based onboarding from the Chrome extension if it exists.

Do not ask:

- `How much time do you spend on your phone?`
- `What do you get distracted by?`
- Any multi-question trigger survey before value is shown.

Use this onboarding order:

1. Welcome
2. Goals
3. Videos
4. Apps/Sites
5. Permissions

Progress dots should represent only the four setup steps after Welcome:

- Goals
- Videos
- Apps/Sites
- Permissions

The goals step must happen before Videos and Apps/Sites, because later screens and block interventions depend on the user's goals and self-message.

## 2. Goals Step Additions

The Goals onboarding step should collect three things:

1. Goal text
2. Self-written overlay message
3. Goal target after commit

### Goal Text

Title:

`Define your weekly goals.`

Subtitle:

`These become the alternatives we surface when you hit a limit.`

Placeholder:

```text
e.g. Read 10 pages
Go to the gym
Call my family
```

### Self-Written Overlay Message

Label:

`OVERLAY MESSAGE`

Placeholder:

`Write what future-you needs to hear`

This is optional. If present, it becomes the first line shown in the block page intro.

### Goal Target After Commit

Label:

`AFTER I COMMIT`

Mobile HopOff opens a native app after commit. The Chrome extension should use a URL target instead.

Recommended preset targets:

- Google Calendar
- Google Docs
- Notion
- Slack web
- Strava web
- GitHub
- Custom URL

When the user commits on the block page, open this target. If the block page replaced the distracting tab, prefer using the current tab for the goal target.

## 3. Message-First Block Page

The block page sequence has changed. The video should not appear immediately.

Use this sequence:

1. User crosses a daily, session, or Lock In limit.
2. Redirect the distracting tab to the HopOff block page.
3. Show an intro message for 5 seconds.
4. Fade the intro out.
5. Fade the motivation video in.
6. Do not reveal actions until the video ends.
7. After video ends, reveal the goal alternative and choices.

### Intro Behavior

If the user wrote a self-message, show it first.

If no self-message exists, show a generated headline.

Then show a second line using the normal block headline system.

Animation:

- Line 1 encrypted/scramble resolve: about `700ms`
- Line 2 starts: about `720ms`
- Total intro duration: `5000ms`
- Fade intro to video: about `650ms`

### Video Behavior

- 9:16 frame
- Centered in the same phone-like column
- YouTube controls hidden
- No seeking
- Sound on if browser allows it
- If autoplay is blocked, show a single play affordance in HopOff style
- Track ended event

Before video ends, footer caption:

`Watch the full clip...`

### Footer After Video Ends

Show:

- `Instead, {goal fragment}`
- Primary pill: `I'll commit to do better`
- Ghost text/button: `I'm gonna waste my life`

Commit behavior:

1. Record a commit.
2. Route HopOff's internal app state to Progress.
3. Open the selected goal target URL if one exists.
4. If no target exists, return to the main HopOff app.

Waste behavior:

1. Record a waste.
2. Snooze the blocked site/group for 15 minutes.
3. Return to the distracting site.

## 4. Session Limits

Each site group should support both a daily cap and session interruptions.

Data model:

```ts
interface SiteGroup {
  id: string;
  name: string;
  siteIds: string[];
  limitHours: number;
  sessionCount?: number;
  sessionLimitMinutes?: number;
}
```

Default session behavior:

- User chooses 2, 3, or 4 sessions.
- `sessionLimitMinutes = round(limitHours * 60 / sessionCount)`.
- Daily limit is still the hard cap.
- Session limit creates an earlier interruption while the user is actively scrolling.

Example:

- Daily limit: `1 Hr`
- Sessions: `3`
- Session limit: `20 min`

In the UI, group cards should show both:

- Daily limit, e.g. `1 Hr`
- Session label, e.g. `20m sessions`

In the group modal, show:

`Interrupt every 20 min across this group.`

## 5. Lock In Layer

Add Lock In as a layer on top of the default limits, not as a separate mode.

Do not label the app as having modes like `Default Mode`, `Focus Mode`, or `Lock Mode`. The user should understand this as:

- Normal HopOff limits always exist.
- Lock In temporarily makes those limits stricter.

### Lock In Panel Placement

Place the Lock In panel on the Progress tab, under the stat card and before the insight/week sections.

Panel title:

`Lock In`

Subtitle:

`Temporarily block your distracting groups.`

### Quick Lock In Sessions

Add three quick buttons:

- `30 min`
- `60 min`
- `90 min`

When tapped/clicked, set `lockInUntil = Date.now() + minutes * 60_000`.

While active, show a single active pill:

`{remaining time} left`

Also show a small `Stop` action to end the quick session early.

### Scheduled Lock In Windows

Add three schedule toggles:

```ts
const DEFAULT_LOCK_IN_SCHEDULES = [
  { id: 'morning', label: 'Morning', startMinute: 6 * 60, endMinute: 9 * 60, enabled: false },
  { id: 'work_school', label: 'Work / school', startMinute: 9 * 60, endMinute: 15 * 60, enabled: false },
  { id: 'night', label: 'Night', startMinute: 21 * 60, endMinute: 24 * 60, enabled: false },
];
```

Display each row as:

- Label
- Time window, e.g. `6:00 AM-9:00 AM`
- Toggle

Use the same dark glass row style as HopOff settings/select rows.

### Lock In Enforcement

Lock In applies to the user's existing distracting site groups. It does not ask the user to pick a second set of sites.

If Lock In is active:

- Block matching sites immediately, even if the user is under their daily or session limit.
- Still show the normal block page.
- Still allow the same choices after the video.

The order of enforcement should be:

1. If site/group is snoozed, allow until snooze expires.
2. If Lock In quick session is active, block.
3. If current time is inside an enabled schedule window, block.
4. If session limit exceeded, block.
5. If daily limit exceeded, block.

This keeps Lock In understandable and prevents it from becoming a separate rules system.

## 6. Chrome Extension State Additions

Add these fields to the persisted site/app store:

```ts
type LockInScheduleId = 'morning' | 'work_school' | 'night';

interface LockInSchedule {
  id: LockInScheduleId;
  label: string;
  startMinute: number;
  endMinute: number;
  enabled: boolean;
}

interface SitesState {
  selectedIds: string[];
  groups: SiteGroup[];
  lockInUntil: number | null;
  lockInSchedules: LockInSchedule[];
}
```

Actions:

```ts
startLockIn(minutes: number): void;
stopLockIn(): void;
toggleLockInSchedule(id: LockInScheduleId): void;
```

Persist these in `chrome.storage.local`.

## 7. Background Service Worker Logic

The service worker should evaluate blocking on every active-tab update, alarm tick, and idle-state return.

Pseudo-logic:

```ts
function shouldBlock(siteId: string, now: number) {
  if (isSnoozed(siteId, now)) return false;
  if (lockInUntil && lockInUntil > now) return true;
  if (isInsideEnabledLockInWindow(now)) return true;
  if (activeSessionMinutes(siteId) >= group.sessionLimitMinutes) return true;
  if (todayMinutes(siteId) >= group.limitHours * 60) return true;
  return false;
}
```

`isInsideEnabledLockInWindow` should support windows that might cross midnight, even if the current defaults do not.

```ts
function containsMinute(startMinute: number, endMinute: number, minute: number) {
  if (startMinute <= endMinute) return minute >= startMinute && minute < endMinute;
  return minute >= startMinute || minute < endMinute;
}
```

## 8. Dashboard Metrics Guidance

Do not overload the dashboard. Keep the current main stat card simple.

Current recommended stats:

- `Time wasted`
- `Screen time`
- `Commit rate`

Potential future metrics like `Longest Focus` or `HopOff Score` are not required in this addendum unless explicitly requested later.

## 9. Bloat Guardrails

These changes should not make HopOff feel like a complex automation tool.

Avoid:

- A separate mode switcher
- Multiple profile systems
- Calendar-like scheduling controls
- Complex exception rules
- Too many dashboard metrics
- Explaining every concept with long paragraphs

Prefer:

- One Lock In panel
- Three quick buttons
- Three simple schedule toggles
- Existing groups as the source of truth
- The same block experience for every kind of intervention

## 10. Acceptance Checklist

The Chrome extension is up to date when:

- Onboarding is Welcome -> Goals -> Videos -> Apps/Sites -> Permissions.
- Goals captures goals, self-message, and goal target URL.
- Block page uses 5-second message-first sequence before video.
- Block actions are hidden until the video ends.
- Commit opens goal target URL when configured.
- Site groups have daily and session limits.
- Progress tab includes Lock In panel.
- Lock In quick sessions support 30/60/90 minutes.
- Lock In schedule toggles include Morning, Work / school, Night.
- Lock In blocks selected distracting groups even under normal limits.
- Lock In does not appear as a separate mode.
- Existing HopOff visual language remains intact.
