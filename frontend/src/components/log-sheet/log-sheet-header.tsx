import { CalendarDays, MapPin } from "lucide-react";

import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatLogDate } from "@/lib/log-format";
import { logSheetLabels, typography } from "@/lib/typography";

import type { LogSheetSectionProps } from "./types";

export function LogSheetHeader({ sheet }: LogSheetSectionProps) {
  return (
    <CardHeader className="border-b border-slate-100 bg-linear-to-br from-slate-50 to-white pb-4">
      <p className={`mb-2 ${typography.overline}`}>{logSheetLabels.driverDailyLog}</p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className={`flex items-center gap-2 ${typography.cardTitle}`}>
            <CalendarDays className="size-5 text-slate-500" />
            {formatLogDate(sheet.date)}
          </CardTitle>
          <CardDescription
            className={`flex items-center gap-1.5 ${typography.cardDescription}`}
          >
            <MapPin className="size-4 shrink-0" />
            {sheet.from_location}
            <span className="text-slate-400">→</span>
            {sheet.to_location}
          </CardDescription>
        </div>
        <MilesDrivenBadge miles={sheet.total_miles_driving} />
      </div>
    </CardHeader>
  );
}

function MilesDrivenBadge({ miles }: { miles: number }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-full border border-brand/20 bg-brand-soft py-1.5 pr-3 pl-1.5 shadow-sm"
      aria-label={`${miles} miles driven`}
    >
      <span
        className="inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full bg-brand px-2 text-sm font-semibold tabular-nums text-white"
        aria-hidden="true"
      >
        {miles}
      </span>
      <span className={`${typography.metaLabel} font-medium text-brand`}>
        mi driven
      </span>
    </div>
  );
}
