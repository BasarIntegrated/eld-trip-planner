import { cycleBarColor, CYCLE_LIMIT_HOURS } from "@/lib/cycle-recap";
import type { LogSheet } from "@/lib/types";
import { logSheetLabels, typography } from "@/lib/typography";

interface LogSheetCycleRecapProps {
  recap: LogSheet["recap"];
  cyclePercent: number;
}

export function LogSheetCycleRecap({
  recap,
  cyclePercent,
}: LogSheetCycleRecapProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className={typography.sectionTitle}>{logSheetLabels.cycleRecap}</h4>
        <span className={typography.metaLabel}>{logSheetLabels.propertyCarrying}</span>
      </div>

      <div className="mb-4">
        <div className={`mb-1.5 flex justify-between ${typography.helperText}`}>
          <span>{logSheetLabels.cycleUsed}</span>
          <span className={`font-medium ${typography.tabularValue}`}>
            {recap.cycle_used}h / {CYCLE_LIMIT_HOURS}h
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuenow={Math.round(cyclePercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${recap.cycle_used} of ${CYCLE_LIMIT_HOURS} hours used in the 8-day cycle`}
        >
          <div
            className={`h-full rounded-full transition-all ${cycleBarColor(cyclePercent)}`}
            style={{ width: `${cyclePercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <RecapStat
          label={logSheetLabels.onDutyToday}
          value={`${recap.on_duty_today}h`}
        />
        <RecapStat
          label={logSheetLabels.totalOnDuty}
          value={`${recap.cycle_used}h`}
          emphasis
        />
        <RecapStat
          label={`${logSheetLabels.hoursAvailable} (${CYCLE_LIMIT_HOURS} − cycle used)`}
          value={`${recap.cycle_available}h`}
        />
      </div>
      <p className={`mt-3 ${typography.helperText}`}>
        70-hour / 8-day driver · Property-carrying
      </p>
    </div>
  );
}

function RecapStat({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
      <p className={typography.metaLabel}>{label}</p>
      <p
        className={`mt-0.5 text-base font-semibold ${typography.tabularValue} ${emphasis ? "text-slate-950" : "text-slate-700"}`}
      >
        {value}
      </p>
    </div>
  );
}
