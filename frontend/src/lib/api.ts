import type { TripPlanRequest, TripPlanResponse } from "@/lib/types";
import {
  formatTripPlanSchemaErrors,
  tripPlanResponseSchema,
} from "@/lib/trip-plan-response-schema";

import { API_BASE_URL, API_PATHS } from "./api-config";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function parseTripPlanResponse(data: unknown, status: number): TripPlanResponse {
  const parsed = tripPlanResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      `Trip plan response was invalid: ${formatTripPlanSchemaErrors(parsed.error)}`,
      status,
    );
  }
  return parsed.data as TripPlanResponse;
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return data.detail ?? JSON.stringify(data);
  } catch {
    return response.statusText || fallback;
  }
}

export async function planTrip(
  payload: TripPlanRequest,
  signal?: AbortSignal,
): Promise<TripPlanResponse> {
  const response = await fetch(`${API_BASE_URL}${API_PATHS.planTrip}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new ApiError(
      await readApiError(response, "Failed to plan trip."),
      response.status,
    );
  }

  return parseTripPlanResponse(await response.json(), response.status);
}

export async function updateTripPlan(
  tripId: string,
  payload: TripPlanRequest,
  signal?: AbortSignal,
): Promise<TripPlanResponse> {
  const response = await fetch(`${API_BASE_URL}${API_PATHS.tripDetail(tripId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new ApiError(
      await readApiError(response, "Failed to update trip."),
      response.status,
    );
  }

  return parseTripPlanResponse(await response.json(), response.status);
}

export async function getTripPlan(
  tripId: string,
  signal?: AbortSignal,
): Promise<TripPlanResponse> {
  const response = await fetch(`${API_BASE_URL}${API_PATHS.tripDetail(tripId)}`, {
    signal,
  });

  if (!response.ok) {
    throw new ApiError(
      await readApiError(response, "Failed to load trip."),
      response.status,
    );
  }

  return parseTripPlanResponse(await response.json(), response.status);
}

export function tripPlanRequestFromSummary(
  summary: TripPlanResponse["summary"],
): TripPlanRequest {
  return {
    current_location: summary.current_location,
    pickup_location: summary.pickup_location,
    dropoff_location: summary.dropoff_location,
    current_cycle_used: summary.current_cycle_used,
  };
}
