import { DUTY_STATUS_ORDER } from "@/lib/log-grid";

export const TIMELINE_LAYOUT = {
  rowHeight: 40,
  rowGap: 6,
  /** 96 × 15-minute slots across the 24-hour grid. */
  quarterSlots: 96,
  /** Width of the row-label column (must fit timelineLabel on one line). */
  labelWidth: "8.75rem",
  labelColumnGap: "0.5rem",
  strokeColor: "#111827",
  strokeWidth: 2.8,
} as const;

export const TIMELINE_GRID_HEIGHT =
  DUTY_STATUS_ORDER.length * TIMELINE_LAYOUT.rowHeight +
  (DUTY_STATUS_ORDER.length - 1) * TIMELINE_LAYOUT.rowGap;

export const TIMELINE_SVG_VIEWBOX_HEIGHT = DUTY_STATUS_ORDER.length * 100;
