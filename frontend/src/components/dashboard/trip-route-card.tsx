import { CopyTripLinkButton } from "@/components/shared/copy-trip-link-button";
import { dashboardTheme } from "@/lib/dashboard-theme";
import { CYCLE_LIMIT_HOURS } from "@/lib/cycle-recap";
import { formatPlanCreatedAt } from "@/lib/datetime";
import { formatTripRoute } from "@/lib/trip-route-label";
import type { TripPlanResponse } from "@/lib/types";
import { typography } from "@/lib/typography";

interface TripRouteCardProps {
  plan: TripPlanResponse;
}

export function TripRouteCard({ plan }: TripRouteCardProps) {
  const { summary } = plan;

  return (
    <div className={`${dashboardTheme.card} p-5 sm:p-6`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={typography.overline}>Trip overview</p>
          <h1 className={`mt-1 ${typography.cardTitle}`}>
            {formatTripRoute(summary, { short: true })}
          </h1>
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-gray-50 p-3 space-y-2">
        <p className={`${typography.bodySmall} font-medium text-gray-700`}>
          {formatTripRoute(summary)}
        </p>
        <ul className={`${typography.metaLabel} space-y-1 text-gray-600`}>
          {plan.route.legs.map((leg) => (
            <li key={`${leg.from}-${leg.to}`}>
              {leg.from} → {leg.to}: {leg.miles} mi
            </li>
          ))}
        </ul>
        <p className={`${typography.helperText} pt-1`}>
          City-center to city-center routing — not street-level addresses.
        </p>
      </div>

      <dl className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${typography.bodySmall}`}>
        <div className={dashboardTheme.cardInset + " p-3"}>
          <dt className={typography.metaLabel}>Total miles</dt>
          <dd className="mt-1 font-semibold tabular-nums text-gray-900">
            {summary.total_miles} mi
          </dd>
        </div>
        <div className={dashboardTheme.cardInset + " p-3"}>
          <dt className={typography.metaLabel}>Log sheets</dt>
          <dd className="mt-1 font-semibold tabular-nums text-gray-900">
            {summary.total_days}
          </dd>
        </div>
        <div className={dashboardTheme.cardInset + " p-3"}>
          <dt className={typography.metaLabel}>Fuel stops</dt>
          <dd className="mt-1 font-semibold tabular-nums text-gray-900">
            {summary.fuel_stops}
          </dd>
        </div>
        <div className={dashboardTheme.cardInset + " p-3"}>
          <dt className={typography.metaLabel}>Cycle after</dt>
          <dd className="mt-1 font-semibold tabular-nums text-gray-900">
            {summary.projected_cycle_used}/{CYCLE_LIMIT_HOURS}h
            <span className="block text-sm font-normal text-gray-500">
              {summary.cycle_available}h available
            </span>
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className={typography.metaLabel + " text-gray-500"}>
          Saved · Planned {formatPlanCreatedAt(plan.meta.created_at)} · {plan.meta.engine}
        </p>
        <CopyTripLinkButton tripId={plan.id} />
      </div>
    </div>
  );
}
