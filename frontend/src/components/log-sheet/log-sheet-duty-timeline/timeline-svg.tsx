import {
  buildDutyConnectors,
  statusToRowCenterY,
  timeRangeToPercent,
} from "@/lib/log-grid";
import type { LogSegment } from "@/lib/types";

import {
  TIMELINE_LAYOUT,
  TIMELINE_SVG_VIEWBOX_HEIGHT,
} from "./constants";

interface TimelineSvgProps {
  segments: LogSegment[];
}

export function TimelineSvg({ segments }: TimelineSvgProps) {
  const connectors = buildDutyConnectors(segments);
  const { strokeColor, strokeWidth } = TIMELINE_LAYOUT;

  return (
    <svg
      viewBox={`0 0 100 ${TIMELINE_SVG_VIEWBOX_HEIGHT}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      aria-hidden
    >
      {segments.map((segment) => {
        const y = statusToRowCenterY(segment.status);
        const { left, width } = timeRangeToPercent(segment.start, segment.end);
        return (
          <line
            key={`h-${segment.status}-${segment.start}-${segment.end}`}
            x1={left}
            y1={y}
            x2={left + width}
            y2={y}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
          />
        );
      })}

      {connectors.map((connector) => {
        const y1 = statusToRowCenterY(connector.fromStatus);
        const y2 = statusToRowCenterY(connector.toStatus);
        return (
          <line
            key={`v-${connector.time}-${connector.fromStatus}-${connector.toStatus}`}
            x1={connector.percent}
            y1={y1}
            x2={connector.percent}
            y2={y2}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}
