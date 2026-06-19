export const CYCLE_LIMIT_HOURS = 70;

export function cycleUsedPercent(
  used: number,
  limit: number = CYCLE_LIMIT_HOURS,
): number {
  return Math.min((used / limit) * 100, 100);
}

export function cycleBarColor(percent: number): string {
  if (percent >= 85) return "bg-red-600";
  if (percent >= 70) return "bg-amber-500";
  return "bg-brand";
}
