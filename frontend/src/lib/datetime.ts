/** US Central — matches backend trip simulation timezone (log grid + stops). */
export const TRIP_DISPLAY_TIMEZONE = "America/Chicago";

const TRIP_LOCAL_BASE: Intl.DateTimeFormatOptions = {
  timeZone: TRIP_DISPLAY_TIMEZONE,
  timeZoneName: "short",
};

/** Format an ISO timestamp in trip-local time (US Central). */
export function formatTripLocalDateTime(
  value: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Date(value).toLocaleString("en-US", {
    ...TRIP_LOCAL_BASE,
    ...options,
  });
}

export function formatStopDateTime(value: string): string {
  return formatTripLocalDateTime(value, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatPlanCreatedAt(value: string): string {
  return formatTripLocalDateTime(value, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Calendar date (YYYY-MM-DD) in trip-local timezone for stop grouping. */
export function tripLocalDateKey(isoTime: string): string {
  return new Date(isoTime).toLocaleDateString("en-CA", {
    timeZone: TRIP_DISPLAY_TIMEZONE,
  });
}

/** Format a YYYY-MM-DD log date (no time component) in trip-local timezone. */
export function formatLogCalendarDate(
  date: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: TRIP_DISPLAY_TIMEZONE,
    ...options,
  });
}
