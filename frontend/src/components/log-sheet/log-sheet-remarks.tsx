import { Clock, MessageSquareText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DUTY_STATUS_META, formatTime12h } from "@/lib/log-grid";
import type { LogSegment } from "@/lib/types";
import { logSheetLabels, typography } from "@/lib/typography";

interface LogSheetRemarksProps {
  segments: LogSegment[];
}

export function LogSheetRemarks({ segments }: LogSheetRemarksProps) {
  return (
    <div className="space-y-3">
      <h4 className={`flex items-center gap-2 ${typography.sectionTitle}`}>
        <MessageSquareText className="size-4 text-slate-500" />
        {logSheetLabels.remarks}
      </h4>
      <ul className="space-y-2">
        {segments.map((segment, index) => {
          const meta = DUTY_STATUS_META[segment.status];
          return (
            <li
              key={`${segment.start}-${segment.end}-${segment.status}-${index}`}
              className="flex gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
            >
              <div
                className={`flex shrink-0 items-start gap-1.5 pt-0.5 ${typography.helperText}`}
              >
                <Clock className="size-3.5" />
                <span className={typography.tabularValue}>
                  {formatTime12h(segment.start)}
                  <span className="text-slate-300"> – </span>
                  {formatTime12h(segment.end)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <Badge
                  variant="secondary"
                  className={`mb-1 text-[10px] ${meta.bg} ${meta.text}`}
                >
                  {meta.remarkLabel}
                </Badge>
                <p className={typography.bodySmall}>{segment.remark}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
