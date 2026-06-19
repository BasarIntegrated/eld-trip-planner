import { AlertCircle } from "lucide-react";

import { AppLogo } from "@/components/shared/app-logo";
import { TripForm } from "@/components/trip-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { LocationField } from "@/lib/location-errors";
import type { TripPlanRequest } from "@/lib/types";
import { typography } from "@/lib/typography";

import { AssessmentAssumptions } from "./assessment-assumptions";

interface PlanError {
  title: string;
  description: string;
}

interface LocationFieldError {
  field: LocationField;
  message: string;
}

interface TripPlannerLandingProps {
  defaultValues: TripPlanRequest;
  onSubmit: (values: TripPlanRequest) => Promise<void>;
  isLoading: boolean;
  error: PlanError | null;
  locationFieldError: LocationFieldError | null;
  locationWarning: string | null;
  onLocationWarningChange: (warning: string | null) => void;
}

export function TripPlannerLanding({
  defaultValues,
  onSubmit,
  isLoading,
  error,
  locationFieldError,
  locationWarning,
  onLocationWarningChange,
}: TripPlannerLandingProps) {
  const showPlanError =
    error &&
    !(
      locationWarning &&
      locationFieldError?.field === "current_location"
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <AppLogo size={72} className="mb-3" />
          <h1 className={typography.pageTitle}>ELD Trip Planner</h1>
          <p className={`mt-2 ${typography.cardDescription}`}>
            Plan a route and generate FMCSA daily ELD log sheets.
          </p>
        </div>

        {locationWarning ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="size-4" />
            <AlertTitle>Location outside US</AlertTitle>
            <AlertDescription>{locationWarning}</AlertDescription>
          </Alert>
        ) : null}

        {showPlanError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="size-4" />
            <AlertTitle>{error.title}</AlertTitle>
            <AlertDescription>{error.description}</AlertDescription>
          </Alert>
        ) : null}

        <TripForm
          key={[
            defaultValues.current_location,
            defaultValues.pickup_location,
            defaultValues.dropoff_location,
            defaultValues.current_cycle_used,
          ].join("|")}
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          isLoading={isLoading}
          locationFieldError={locationFieldError}
          locationWarning={locationWarning}
          onLocationWarningChange={onLocationWarningChange}
        />

        <AssessmentAssumptions variant="brief" />
      </div>
    </div>
  );
}
