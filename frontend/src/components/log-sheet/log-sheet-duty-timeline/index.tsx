import type { LogSegment } from "@/lib/types";
import { logSheetLabels, typography } from "@/lib/typography";

import { TIMELINE_GRID_HEIGHT } from "./constants";
import {
  TimelineBackgroundGrid,
  TimelineHourAxis,
  TimelineRowLabels,
} from "./timeline-grid";
import { TimelineOverlays } from "./timeline-overlays";
import { TimelineSvg } from "./timeline-svg";

interface DutyTimelineProps {
  segments: LogSegment[];
}

export function DutyTimeline({ segments }: DutyTimelineProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className={typography.sectionTitle}>{logSheetLabels.dutyStatus}</h4>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="min-w-[52rem] p-3 sm:p-4">
          <TimelineHourAxis />

          <div className="flex gap-2">
            <TimelineRowLabels />

            <div className="relative flex-1" style={{ height: TIMELINE_GRID_HEIGHT }}>
              <TimelineBackgroundGrid />
              <TimelineSvg segments={segments} />
              <TimelineOverlays segments={segments} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
