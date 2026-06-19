import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { dashboardTheme } from "@/lib/dashboard-theme";
import type { TripPlanResponse } from "@/lib/types";
import { tripFormLabels, typography } from "@/lib/typography";

interface TripInputDetailsProps {
  summary: TripPlanResponse["summary"];
  variant?: "default" | "sidebar";
}

const FIELDS = [
  { key: "current_location", label: tripFormLabels.current_location },
  { key: "pickup_location", label: tripFormLabels.pickup_location },
  { key: "dropoff_location", label: tripFormLabels.dropoff_location },
  { key: "current_cycle_used", label: tripFormLabels.current_cycle_used },
] as const;

export function TripInputDetails({
  summary,
  variant = "default",
}: TripInputDetailsProps) {
  const isSidebar = variant === "sidebar";

  return (
    <Card
      className={
        isSidebar
          ? `${dashboardTheme.cardInset} border-gray-200 shadow-none`
          : dashboardTheme.card
      }
    >
      <CardHeader className={isSidebar ? "px-3 pb-1 pt-3" : "pb-2"}>
        <CardTitle className={`${typography.sectionTitle} text-gray-800`}>
          Input details
        </CardTitle>
      </CardHeader>
      <CardContent className={isSidebar ? "px-3 pb-3 pt-0" : undefined}>
        <dl className={`space-y-3 ${typography.bodySmall}`}>
          {FIELDS.map(({ key, label }) => (
            <div key={key}>
              <dt className={typography.metaLabel}>{label}</dt>
              <dd className="mt-0.5 font-medium text-gray-800">
                {key === "current_cycle_used"
                  ? `${summary.current_cycle_used} hrs`
                  : summary[key]}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
