import { Card, CardContent } from "@/components/ui/card";
import { cycleUsedPercent } from "@/lib/cycle-recap";
import type { LogSheet } from "@/lib/types";

import { DutyTimeline } from "./log-sheet-duty-timeline";
import { LogSheetCycleRecap } from "./log-sheet-cycle-recap";
import { LogSheetHeader } from "./log-sheet-header";
import { LogSheetMetadata } from "./log-sheet-metadata";
import { LogSheetRemarks } from "./log-sheet-remarks";
import { LogSheetTotals } from "./log-sheet-totals";

interface LogSheetViewProps {
  sheet: LogSheet;
}

export function LogSheetView({ sheet }: LogSheetViewProps) {
  const remarks = sheet.segments.filter((segment) => segment.remark);
  const cyclePercent = cycleUsedPercent(sheet.recap.cycle_used);

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <LogSheetHeader sheet={sheet} />

      <CardContent className="space-y-6 p-4 sm:p-6">
        <LogSheetMetadata sheet={sheet} />
        <DutyTimeline segments={sheet.segments} />
        <LogSheetTotals totals={sheet.totals} />
        <LogSheetCycleRecap recap={sheet.recap} cyclePercent={cyclePercent} />
        {remarks.length > 0 ? <LogSheetRemarks segments={remarks} /> : null}
      </CardContent>
    </Card>
  );
}
