import { formatLogCalendarDate } from "@/lib/datetime";

export function formatLogDate(date: string): string {
  return formatLogCalendarDate(date, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortLogDate(date: string): string {
  return formatLogCalendarDate(date, {
    month: "short",
    day: "numeric",
  });
}
