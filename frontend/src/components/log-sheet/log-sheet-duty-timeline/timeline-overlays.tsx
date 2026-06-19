import {
  DUTY_STATUS_META,
  formatTime12h,
  statusToRowIndex,
  timeRangeToPercent,
  timeToPercent,
} from "@/lib/log-grid";
import type { LogSegment } from "@/lib/types";

import { TIMELINE_LAYOUT } from "./constants";

interface TimelineOverlaysProps {
  segments: LogSegment[];
}

function TimelineDot({ left, top }: { left: number; top: number }) {
  return (
    <div
      className="absolute z-10 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red-600 shadow-sm"
      style={{ left: `${left}%`, top }}
    />
  );
}

export function TimelineOverlays({ segments }: TimelineOverlaysProps) {
  const { rowHeight, rowGap } = TIMELINE_LAYOUT;

  return (
    <>
      {segments.flatMap((segment) => {
        const rowTop = statusToRowIndex(segment.status) * (rowHeight + rowGap);
        const centerY = rowTop + rowHeight / 2;
        const startX = timeToPercent(segment.start);
        const endX = timeToPercent(segment.end);
        return [
          <TimelineDot
            key={`dot-start-${segment.status}-${segment.start}`}
            left={startX}
            top={centerY}
          />,
          <TimelineDot
            key={`dot-end-${segment.status}-${segment.end}`}
            left={endX}
            top={centerY}
          />,
        ];
      })}

      {segments.map((segment) => {
        const top = statusToRowIndex(segment.status) * (rowHeight + rowGap);
        const { left, width } = timeRangeToPercent(segment.start, segment.end);
        const meta = DUTY_STATUS_META[segment.status];
        const label = `${formatTime12h(segment.start)} – ${formatTime12h(segment.end)} · ${meta.label}${segment.remark ? `: ${segment.remark}` : ""}`;

        return (
          <div
            key={`tip-${segment.status}-${segment.start}-${segment.end}`}
            className="absolute cursor-default"
            style={{ top, left: `${left}%`, width: `${width}%`, height: rowHeight }}
            title={label}
            aria-label={label}
          />
        );
      })}
    </>
  );
}
