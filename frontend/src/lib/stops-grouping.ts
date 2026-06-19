import type { RouteStop } from "@/lib/types";
import { TRIP_DISPLAY_TIMEZONE, tripLocalDateKey } from "@/lib/datetime";

export interface StopDayGroup {
  dateKey: string;
  dayIndex: number;
  heading: string;
  stops: RouteStop[];
}

const DAY_HEADING_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
};

/** Group chronologically ordered stops by calendar day (trip-local timezone). */
export function groupStopsByDay(stops: RouteStop[]): StopDayGroup[] {
  const groups = new Map<string, RouteStop[]>();

  for (const stop of stops) {
    const dateKey = toDateKey(stop.time);
    const bucket = groups.get(dateKey);
    if (bucket) {
      bucket.push(stop);
    } else {
      groups.set(dateKey, [stop]);
    }
  }

  return Array.from(groups.entries()).map(([dateKey, dayStops], dayIndex) => ({
    dateKey,
    dayIndex,
    heading: formatDayHeading(dateKey, dayIndex),
    stops: dayStops,
  }));
}

function toDateKey(isoTime: string): string {
  return tripLocalDateKey(isoTime);
}

function formatDayHeading(dateKey: string, dayIndex: number): string {
  const label = new Date(`${dateKey}T12:00:00Z`).toLocaleDateString("en-US", {
    ...DAY_HEADING_FORMAT,
    timeZone: TRIP_DISPLAY_TIMEZONE,
  });
  return `Day ${dayIndex + 1} · ${label}`;
}

export function formatStopDuration(minutes: number): string {
  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1 hr" : `${hours} hr`;
  }
  return `${minutes} min`;
}

export function formatStopsSummary(stopCount: number, dayCount: number): string {
  const stopLabel = `${stopCount} stop${stopCount === 1 ? "" : "s"}`;
  if (dayCount <= 1) {
    return stopLabel;
  }
  return `${stopLabel} across ${dayCount} days`;
}
