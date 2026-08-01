# Dashboard visualization ideas

Replacements or upgrades for the current **Your week** bar chart on the Progress tab. These fit HopOff’s tone and mostly use data you already have (or can add incrementally).

---

## 1. Commit rate ring

A single circular gauge (e.g. **68% commit rate**) with supporting copy underneath: *12 commits · 6 scroll-throughs*.

**Why:** More motivating than a bar chart of raw hours. Surfaces whether interventions are working, not just how much time was lost.

**Data:** `commits`, `wastes`, `commitRate()` in `useUsage` — already available.

---

## 2. Vulnerability heatmap

A **7 × 4 grid**: days of the week × time blocks (morning / afternoon / evening / night). Color intensity = minutes on tracked apps.

**Why:** Answers “when am I vulnerable?” — e.g. late-night TikTok vs morning Instagram.

**Data:** Start coarse (morning vs evening) from daily totals; refine later with hourly usage events if you add them.

---

## 3. Streak + rebound

- **Streak:** “3-day commit streak”
- **Rebound:** “Last intervention: 2h ago”

**Why:** Pairs accountability with recovery — not just shame, but momentum when they commit after a block.

**Data:** Persist last commit timestamp and compute consecutive days with at least one commit.

---

## 4. Soft spot timeline (today)

A horizontal strip for **today only**: which app consumed the most time, with the daily limit shown as a tick or marker on the same axis.

**Why:** Actionable *right now* instead of a historical week view. Complements **Your soft spots** without duplicating a list.

**Data:** Today’s `byApp` from synced usage + group limits from `useApps`.

---

## 5. Before / after HopOff

Compare average daily tracked minutes **this week vs last week** (or since install).

**Why:** Shows whether limits and interventions are actually reducing waste over time.

**Data:** Rolling 7-day averages from `week` history; optional baseline from first sync week.

---

## 6. Goal proximity

Tie wasted hours to stated goals — e.g. *“This week = 4 gym sessions worth of scroll time.”*

**Why:** Same emotional hook as **That’s enough time to…**, but as a persistent dashboard widget.

**Data:** `weekHours()` + `goalLines()`; reuse or extend `generateEnoughTimeInsights` logic.

---

## Recommended direction

**Best swap for “Your week”:** combine **#1 (commit ring)** + **#2 (time-of-day heatmap)**.

- One **emotional** metric (am I choosing better after blocks?)
- One **pattern** insight (when do I slip?)

Keep day selection as tabs or a row on the heatmap instead of a separate bar chart.

---

## Implementation notes

| Idea              | Effort | Native / new data?      |
|-------------------|--------|-------------------------|
| Commit rate ring  | Low    | No                      |
| Soft spot timeline| Low    | No                      |
| Goal proximity    | Low    | No (OpenRouter optional)|
| Streak + rebound  | Medium | Small store fields      |
| Before / after    | Medium | Persist more history    |
| Vulnerability heatmap | Medium → High | Hourly buckets later |

---

## Out of scope for v1

- Per-app hourly breakdown without usage-event instrumentation
- Social / leaderboard comparisons

---

## Baseline shift — where to integrate

**Baseline shift** = compare tracked usage *now* vs a stored baseline (first week, pre-HopOff average, or rolling prior week). Shows whether limits are actually working.

### Option A — Under the stat strip (recommended first)

A thin delta row between the glass stat strip and “That’s enough time to…”:

```
↓ 18 min/day vs your first week
```

- Always visible, doesn’t compete with the ring or timeline
- Pairs naturally with **Time wasted** / **Screen time** numbers above

### Option B — Inside “Your week” bar chart

Ghost bars (baseline) behind current bars, or a horizontal reference line across the chart. User taps a day and sees current vs baseline for that weekday.

- Best if baseline is **per-weekday** (Mon vs Mon)
- More visual, more engineering (persist 7-day baseline snapshot)

### Option C — Settings → Progress footnote

Low-key: “Since you started: −12% screen time.” Good for users who don’t want dashboard clutter; easy to miss.

### Option D — Post-intervention only

After block screen commit/dismiss, a one-line “You’re 8 min below your baseline today.” Reinforces the intervention moment; not a dashboard widget.

### Option E — Apps tab

On each group card: small arrow vs baseline (“−22 min this week”). Ties baseline to **limits**, not the Progress hero.

**Suggested path:** ship **Option A** on Progress first (one persisted `baselineAvgMinutesPerDay` set on first successful usage sync), then **Option B** if you keep the week chart long term.
