import { serverErrorMessages } from "@/lib/form-validation";
import type { TripPlanRequest } from "@/lib/types";
import { tripFormLabels } from "@/lib/typography";

export type LocationField = keyof Pick<
  TripPlanRequest,
  "current_location" | "pickup_location" | "dropoff_location"
>;

const FIELD_LABELS: Record<LocationField, string> = {
  current_location: tripFormLabels.current_location,
  pickup_location: tripFormLabels.pickup_location,
  dropoff_location: tripFormLabels.dropoff_location,
};

/** Match backend RoutingError after geocode failure. */
const GEOCODE_PATTERN =
  /Could not find a US location for "([^"]+)"/i;

export function parseGeocodeError(
  detail: string,
  values: TripPlanRequest,
): { field: LocationField; message: string } | null {
  const match = detail.match(GEOCODE_PATTERN);
  if (!match) {
    return null;
  }

  const failedQuery = match[1].trim().toLowerCase();
  const fields: LocationField[] = [
    "dropoff_location",
    "pickup_location",
    "current_location",
  ];

  for (const field of fields) {
    if (values[field].trim().toLowerCase() === failedQuery) {
      return {
        field,
        message: serverErrorMessages.locationNotFound(FIELD_LABELS[field]),
      };
    }
  }

  return {
    field: "current_location",
    message: serverErrorMessages.locationNotFoundGeneric,
  };
}

export function formatPlanError(
  detail: string,
  values: TripPlanRequest,
): { title: string; description: string; fieldError: ReturnType<typeof parseGeocodeError> } {
  const fieldError = parseGeocodeError(detail, values);

  if (fieldError) {
    return {
      title: serverErrorMessages.locationNotRecognizedTitle,
      description: serverErrorMessages.locationNotRecognizedDescription,
      fieldError,
    };
  }

  if (detail.toLowerCase().includes("routing service")) {
    return {
      title: serverErrorMessages.routingFailedTitle,
      description: serverErrorMessages.routingFailedDescription,
      fieldError: null,
    };
  }

  return {
    title: serverErrorMessages.planFailedTitle,
    description: detail,
    fieldError: null,
  };
}
