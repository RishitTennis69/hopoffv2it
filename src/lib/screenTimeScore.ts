interface ScoreInput {
  todayMinutes: number;
  avgDailyMinutes?: number;
  groups: { limitHours: number }[];
  commitRate: number;
}

function clampScore(value: number): number {
  return Math.max(5, Math.min(100, Math.round(value)));
}

function progressScore(usedMinutes: number, goalMinutes: number): number {
  const ratio = usedMinutes / Math.max(30, goalMinutes);

  if (ratio <= 1) return 100 - ratio * 20;
  if (ratio <= 2) return 80 - (ratio - 1) * 45;

  return Math.max(5, 35 - (ratio - 2) * 18);
}

function generalUsageScore(dailyMinutes: number): number {
  const hours = dailyMinutes / 60;

  if (hours <= 1) return 100 - hours * 5;
  if (hours <= 3) return 95 - (hours - 1) * 15;
  if (hours <= 6) return 65 - (hours - 3) * 15;

  return Math.max(5, 20 - (hours - 6) * 5);
}

export function screenTimeScore({ todayMinutes, avgDailyMinutes, groups, commitRate }: ScoreInput): number {
  const limitMinutes = groups.reduce((sum, group) => sum + group.limitHours * 60, 0);
  const dailyLimitMinutes = limitMinutes > 0 ? limitMinutes : 180;
  const dailyMinutes = avgDailyMinutes && avgDailyMinutes > 0 ? avgDailyMinutes : todayMinutes;

  const averageLimitScore = progressScore(dailyMinutes, dailyLimitMinutes);
  const commitmentScore = Math.max(0, Math.min(100, commitRate));
  const averageUsageScore = generalUsageScore(dailyMinutes);

  return clampScore(averageLimitScore * 0.35 + commitmentScore * 0.15 + averageUsageScore * 0.5);
}
