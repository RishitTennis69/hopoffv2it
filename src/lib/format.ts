// Time + label formatting helpers.

/** 0.5 -> "30 Min", 1 -> "1 Hr", 2 -> "2 Hrs", 1.5 -> "1 Hr 30 Min" */
export function formatLimit(hours: number): string {
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  if (whole === 0) return `${mins} Min`;
  const hrLabel = `${whole} ${whole === 1 ? 'Hr' : 'Hrs'}`;
  if (mins === 0) return hrLabel;
  return `${hrLabel} ${mins} Min`;
}

/** Compact hours label for stats: 12 -> "12", 1.4 -> "1.4" */
export function formatHours(hours: number): string {
  if (Number.isInteger(hours)) return `${hours}`;
  return hours.toFixed(1);
}

/** minutes -> "47 Min/day" style number (returns just the number) */
export function roundMinutes(minutes: number): number {
  return Math.round(minutes);
}

export function formatHoursUnit(hours: number): string {
  const h = formatHours(hours);
  return hours === 1 ? `${h} Hr` : `${h} Hrs`;
}

export function pct(value: number): string {
  return `${Math.round(value)} %`;
}

/**
 * Daily screen-time stat: under an hour → minutes ("47", "min/day").
 * An hour or more → exact hours to one decimal ("2.1", "hrs/day").
 */
export function formatDailyScreenTime(minutes: number): { value: string; unit: string } {
  if (minutes < 60) {
    return { value: `${Math.round(minutes)}`, unit: 'min/day' };
  }
  const hours = minutes / 60;
  return { value: formatHours(hours), unit: hours === 1 ? 'hr/day' : 'hrs/day' };
}
