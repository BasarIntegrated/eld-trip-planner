import { DUTY_STATUS_META, DUTY_STATUS_ORDER } from "@/lib/log-grid";
import type { DutyStatus } from "@/lib/types";
import { typography } from "@/lib/typography";

interface LogSheetTotalsProps {
  totals: Record<DutyStatus, string>;
}

export function LogSheetTotals({ totals }: LogSheetTotalsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {DUTY_STATUS_ORDER.map((status) => {
        const meta = DUTY_STATUS_META[status];
        return (
          <div
            key={status}
            className={`rounded-lg border border-slate-200 px-3 py-2.5 ${meta.bg}`}
          >
            <p className={typography.metaLabel}>{meta.totalLabel}</p>
            <p
              className={`mt-0.5 text-lg font-semibold ${typography.tabularValue} ${meta.text}`}
            >
              {totals[status]}
            </p>
          </div>
        );
      })}
    </div>
  );
}
