import type { AppGroup, DayUsage } from '@/store/types';

export function appsOverLimit(
  spots: { appId: string; minutes: number }[],
  groups: AppGroup[],
): { appId: string; minutes: number; limitHours: number }[] {
  return spots.flatMap((spot) => {
    const group = groups.find((g) => g.appIds.includes(spot.appId));
    if (!group) return [];
    const limitMinutes = group.limitHours * 60;
    if (spot.minutes <= limitMinutes) return [];
    return [{ appId: spot.appId, minutes: spot.minutes, limitHours: group.limitHours }];
  });
}

/** Index of the most recent day in synced usage (treated as "today"). */
export function todayDayIndex(week: DayUsage[]): number {
  return Math.max(0, week.length - 1);
}

export function softSpotsForDay(week: DayUsage[], dayIndex: number) {
  const day = week[dayIndex];
  if (!day) return [];
  return Object.entries(day.byApp)
    .map(([appId, minutes]) => ({ appId, minutes }))
    .sort((a, b) => b.minutes - a.minutes);
}

/** First tracked app over its daily limit today, if any. */
export function primaryOverLimitToday(
  week: DayUsage[],
  groups: AppGroup[],
): { appId: string; minutes: number; limitHours: number } | null {
  if (!week.length || !groups.length) return null;
  const idx = todayDayIndex(week);
  const over = appsOverLimit(softSpotsForDay(week, idx), groups);
  return over[0] ?? null;
}
