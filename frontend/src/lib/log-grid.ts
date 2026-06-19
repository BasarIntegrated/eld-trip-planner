import type { DutyStatus, LogSegment } from "@/lib/types";
import { colors } from "@/lib/design-system";

export const LOG_GRID = {
  left: 8.5,
  top: 34.2,
  width: 62.5,
  height: 22.5,
} as const;

export const DUTY_ROW: Record<string, number> = {
  off_duty: 0,
  sleeper: 1,
  driving: 2,
  on_duty: 3,
};

export const DUTY_STATUS_ORDER: DutyStatus[] = [
  "off_duty",
  "sleeper",
  "driving",
  "on_duty",
];

export const DUTY_STATUS_META: Record<
  DutyStatus,
  {
    label: string;
    shortLabel: string;
    /** Single-line label for the duty timeline row legend. */
    timelineLabel: string;
    totalLabel: string;
    remarkLabel: string;
    bar: string;
    bg: string;
    text: string;
    dot: string;
  }
> = {
  off_duty: {
    label: "Off duty",
    shortLabel: "OFF",
    timelineLabel: "Off duty",
    totalLabel: "Off duty total",
    remarkLabel: "Off duty",
    bar: "bg-slate-400",
    bg: "bg-slate-50",
    text: "text-slate-700",
    dot: "bg-slate-400",
  },
  sleeper: {
    label: "Sleeper berth",
    shortLabel: "SB",
    timelineLabel: "Sleeper",
    totalLabel: "Sleeper berth total",
    remarkLabel: "Sleeper berth",
    bar: "bg-violet-500",
    bg: "bg-violet-50",
    text: "text-violet-800",
    dot: "bg-violet-500",
  },
  driving: {
    label: "Driving",
    shortLabel: "D",
    timelineLabel: "Driving",
    totalLabel: "Driving total",
    remarkLabel: "Driving",
    bar: "bg-brand",
    bg: "bg-brand-soft",
    text: "text-brand",
    dot: "bg-brand",
  },
  on_duty: {
    label: "On duty (not driving)",
    shortLabel: "ON",
    timelineLabel: "On duty",
    totalLabel: "On duty total",
    remarkLabel: "On duty",
    bar: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-900",
    dot: "bg-amber-500",
  },
};

/** Compact hour labels matching FMCSA paper logs (M = midnight, N = noon). */
function gridHourLabel(hour: number): string {
  if (hour === 0) return "M";
  if (hour === 12) return "N";
  return String(hour % 12 || 12);
}

/** Hour labels aligned to the left edge of each hour column (FMCSA paper log ticks). */
export const GRID_HOUR_MARKS = Array.from({ length: 24 }, (_, hour) => ({
  label: gridHourLabel(hour),
  percent: (hour / 24) * 100,
}));

/** Legacy sparse labels (kept for reference). */
export const HOUR_MARKS = [
  { label: "12 AM", percent: 0 },
  { label: "6 AM", percent: 25 },
  { label: "12 PM", percent: 50 },
  { label: "6 PM", percent: 75 },
  { label: "12 AM", percent: 100 },
] as const;

/** 15-minute slots in a 24-hour day. */
export const GRID_QUARTER_SLOTS = 96;

const MINUTES_PER_DAY = 24 * 60;

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToSlot(minutes: number): number {
  return minutes / 15;
}

export function timeToPercent(time: string): number {
  return (timeToMinutes(time) / MINUTES_PER_DAY) * 100;
}

export function timeRangeToPercent(
  start: string,
  end: string,
): { left: number; width: number } {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  const left = (startMinutes / MINUTES_PER_DAY) * 100;
  const width = ((endMinutes - startMinutes) / MINUTES_PER_DAY) * 100;
  return { left, width: Math.max(width, 0.15) };
}

export function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function statusToRowIndex(status: DutyStatus): number {
  return DUTY_ROW[status] ?? 0;
}

export interface DutyConnector {
  time: string;
  percent: number;
  fromStatus: DutyStatus;
  toStatus: DutyStatus;
}

/** Vertices where duty status changes — paper log connector dots. */
export function buildDutyConnectors(segments: LogSegment[]): DutyConnector[] {
  const connectors: DutyConnector[] = [];

  for (let i = 0; i < segments.length - 1; i++) {
    const current = segments[i];
    const next = segments[i + 1];
    if (current.status !== next.status && current.end === next.start) {
      connectors.push({
        time: current.end,
        percent: timeToPercent(current.end),
        fromStatus: current.status,
        toStatus: next.status,
      });
    }
  }

  return connectors;
}

/** Row center Y in SVG viewBox coordinates (4 rows × 100 units each). */
export function statusToRowCenterY(status: DutyStatus): number {
  return statusToRowIndex(status) * 100 + 50;
}

/** Legacy helpers for paper-log overlay (kept for compatibility). */
export function timeToX(time: string): number {
  const slot = minutesToSlot(timeToMinutes(time));
  return LOG_GRID.left + (slot / 96) * LOG_GRID.width;
}

export function statusToY(status: string): number {
  const row = DUTY_ROW[status] ?? 0;
  const rowHeight = LOG_GRID.height / 4;
  return LOG_GRID.top + row * rowHeight + rowHeight / 2;
}

export const STOP_COLORS: Record<string, string> = {
  start: "#2563eb",
  pickup: colors.primary,
  dropoff: "#dc2626",
  fuel: "#d97706",
  rest: "#7c3aed",
};
