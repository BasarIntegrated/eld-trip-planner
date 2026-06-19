import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { dashboardTheme } from "@/lib/dashboard-theme";
import {
  DEFAULT_FULL_ASSUMPTIONS,
  formatAssessmentAssumptions,
} from "@/lib/format-assumptions";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";

const BRIEF_ASSUMPTION_COUNT = 4;

interface AssessmentAssumptionsProps {
  /** From plan.meta.assumptions when a trip is loaded. */
  assumptions?: Record<string, string | number | boolean>;
  /** `brief` — assessment brief only (landing); `full` — includes FMCSA limits (results). */
  variant?: "brief" | "full";
  className?: string;
}

function AssumptionsList({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-1 text-sm text-gray-500", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="text-brand" aria-hidden="true">
            •
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function AssessmentAssumptions({
  assumptions,
  variant = "full",
  className,
}: AssessmentAssumptionsProps) {
  const fullItems = assumptions
    ? formatAssessmentAssumptions(assumptions)
    : DEFAULT_FULL_ASSUMPTIONS;
  const items =
    variant === "brief"
      ? fullItems.slice(0, BRIEF_ASSUMPTION_COUNT)
      : fullItems;

  if (variant === "brief") {
    return (
      <aside
        className={cn(
          "mt-6 rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3 text-left",
          className,
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Assessment assumptions
        </p>
        <AssumptionsList items={items} className="mt-2 text-slate-600" />
      </aside>
    );
  }

  return (
    <Card className={cn(dashboardTheme.card, className)}>
      <CardHeader className="pb-2">
        <CardTitle className={`${typography.sectionTitle} text-gray-800`}>
          Assessment assumptions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AssumptionsList items={items} className="space-y-1.5" />
      </CardContent>
    </Card>
  );
}
