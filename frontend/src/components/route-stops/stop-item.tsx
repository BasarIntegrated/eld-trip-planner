import { Badge } from "@/components/ui/badge";
import { formatStopDateTime } from "@/lib/datetime";
import { STOP_COLORS } from "@/lib/log-grid";
import { MAP_MARKER_FALLBACK_COLOR } from "@/lib/map-constants";
import { formatStopDuration } from "@/lib/stops-grouping";
import type { RouteStop } from "@/lib/types";
import { typography } from "@/lib/typography";

interface StopItemProps {
  stop: RouteStop;
}

export function StopItem({ stop }: StopItemProps) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:gap-4 sm:p-3">
      <div className="min-w-0 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{
              backgroundColor: STOP_COLORS[stop.type] ?? MAP_MARKER_FALLBACK_COLOR,
            }}
            aria-hidden="true"
          />
          <Badge variant="secondary" className="text-sm">
            {stop.label}
          </Badge>
        </div>
        <p className={`truncate ${typography.bodySmall} font-medium text-slate-900`}>
          {stop.location}
        </p>
        <time className={typography.helperText} dateTime={stop.time}>
          {formatStopDateTime(stop.time)}
        </time>
      </div>
      {stop.duration_minutes ? (
        <p className={`shrink-0 ${typography.metaLabel} tabular-nums text-slate-700`}>
          {formatStopDuration(stop.duration_minutes)}
        </p>
      ) : null}
    </li>
  );
}
