"use client";

import { useCallback, useEffect, useState } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { TripRouteCard } from "@/components/dashboard/trip-route-card";
import { RouteMap } from "@/components/route-map";
import { dashboardTheme } from "@/lib/dashboard-theme";

import { TripInputDetails } from "./trip-input-details";
import { AssessmentAssumptions } from "./assessment-assumptions";
import { TripPlannerLanding } from "./trip-planner-landing";
import { TripLoadError, TripLoadSpinner } from "./trip-load-states";
import { TripResultsTabs } from "./trip-results-tabs";
import { useTripPlan } from "./hooks/use-trip-plan";

interface TripPlannerProps {
  initialTripId?: string;
}

export function TripPlanner({ initialTripId }: TripPlannerProps) {
  const {
    plan,
    error,
    locationFieldError,
    isLoading,
    isLoadingTrip,
    lastFormValues,
    submitTrip,
    resetPlan,
  } = useTripPlan({ initialTripId });
  const [locationWarning, setLocationWarning] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [plan]);

  const handleLocationWarningChange = useCallback((warning: string | null) => {
    setLocationWarning(warning);
  }, []);

  if (isLoadingTrip && !plan) {
    return <TripLoadSpinner />;
  }

  if (error && !plan && initialTripId) {
    return <TripLoadError title={error.title} description={error.description} />;
  }

  if (!plan) {
    return (
      <TripPlannerLanding
        defaultValues={lastFormValues}
        onSubmit={submitTrip}
        isLoading={isLoading}
        error={error}
        locationFieldError={locationFieldError}
        locationWarning={locationWarning}
        onLocationWarningChange={handleLocationWarningChange}
      />
    );
  }

  return (
    <div className={dashboardTheme.shell}>
      <DashboardSidebar plan={plan} onEditTrip={resetPlan} />

      <div className={dashboardTheme.main}>
        <div className={dashboardTheme.mainInner}>
          <TripRouteCard plan={plan} />

          <DashboardHeader onEditTrip={resetPlan} />

          <div className="lg:hidden">
            <TripInputDetails summary={plan.summary} />
          </div>

          <RouteMap plan={plan} />

          <TripResultsTabs plan={plan} />

          <AssessmentAssumptions assumptions={plan.meta.assumptions} />
        </div>
      </div>
    </div>
  );
}
