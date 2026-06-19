import {
  DUTY_STATUS_META,
  DUTY_STATUS_ORDER,
  GRID_HOUR_MARKS,
} from "@/lib/log-grid";

import { TIMELINE_LAYOUT } from "./constants";

export function TimelineHourAxis() {
  const { labelWidth, labelColumnGap } = TIMELINE_LAYOUT;

  return (
    <div className="mb-1 flex gap-2">
      <div className="shrink-0" style={{ width: labelWidth }} aria-hidden />
      <div className="relative h-6 min-w-0 flex-1" style={{ marginLeft: 0, gap: labelColumnGap }}>
        {GRID_HOUR_MARKS.map(({ label, percent }) => (
          <span
            key={`hour-${label}-${percent}`}
            className="absolute top-0 -translate-x-1/2 text-center text-[10px] font-medium leading-none text-slate-500"
            style={{ left: `${percent}%`, minWidth: "1.25rem" }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TimelineRowLabels() {
  const { rowHeight, rowGap, labelWidth } = TIMELINE_LAYOUT;

  return (
    <div
      className="flex shrink-0 flex-col"
      style={{ width: labelWidth, gap: rowGap }}
    >
      {DUTY_STATUS_ORDER.map((status) => {
        const meta = DUTY_STATUS_META[status];
        return (
          <div
            key={status}
            className={`flex items-center gap-2 rounded-md px-2 text-sm font-medium whitespace-nowrap ${meta.bg} ${meta.text}`}
            style={{ height: rowHeight }}
            title={meta.label}
          >
            <span className={`size-2 shrink-0 rounded-full ${meta.dot}`} />
            <span>{meta.timelineLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

export function TimelineBackgroundGrid() {
  const { rowHeight, rowGap, quarterSlots } = TIMELINE_LAYOUT;

  return (
    <>
      {DUTY_STATUS_ORDER.map((status, index) => {
        const meta = DUTY_STATUS_META[status];
        const top = index * (rowHeight + rowGap);
        return (
          <div
            key={status}
            className={`absolute inset-x-0 rounded-md border border-slate-200 ${meta.bg}`}
            style={{ top, height: rowHeight }}
          >
            {Array.from({ length: quarterSlots + 1 }, (_, slot) => {
              const isHour = slot % 4 === 0;
              return (
                <div
                  key={slot}
                  className={`absolute inset-y-0 border-l first:border-l-0 ${
                    isHour ? "border-slate-300" : "border-slate-100"
                  }`}
                  style={{ left: `${(slot / quarterSlots) * 100}%` }}
                />
              );
            })}
          </div>
        );
      })}
    </>
  );
}
