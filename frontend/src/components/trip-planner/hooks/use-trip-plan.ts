"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  ApiError,
  getTripPlan,
  planTrip,
  tripPlanRequestFromSummary,
  updateTripPlan,
} from "@/lib/api";
import { formatPlanError, type LocationField } from "@/lib/location-errors";
import { TRIP_FORM_DEFAULTS } from "@/lib/trip-form-schema";
import type { TripPlanRequest, TripPlanResponse } from "@/lib/types";
import { syncTripShareUrl } from "@/lib/trip-url";

interface PlanError {
  title: string;
  description: string;
}

interface LocationFieldError {
  field: LocationField;
  message: string;
}

interface UseTripPlanOptions {
  initialTripId?: string;
}

export function useTripPlan({ initialTripId }: UseTripPlanOptions = {}) {
  const [plan, setPlan] = useState<TripPlanResponse | null>(null);
  const [error, setError] = useState<PlanError | null>(null);
  const [locationFieldError, setLocationFieldError] =
    useState<LocationFieldError | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(initialTripId));
  const [isLoadingTrip, setIsLoadingTrip] = useState(Boolean(initialTripId));
  const abortRef = useRef<AbortController | null>(null);
  const editingTripIdRef = useRef<string | null>(null);

  const [lastFormValues, setLastFormValues] =
    useState<TripPlanRequest>(TRIP_FORM_DEFAULTS);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!initialTripId) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoadingTrip(true);
    setIsLoading(true);
    setError(null);
    setPlan(null);

    getTripPlan(initialTripId, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        setPlan(response);
        setLastFormValues(tripPlanRequestFromSummary(response.summary));
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        const detail =
          err instanceof ApiError
            ? err.message
            : err instanceof Error && err.message
              ? err.message
              : "Something went wrong while loading the trip.";
        setError({
          title: err instanceof ApiError && err.status === 404 ? "Trip not found" : "Unable to load trip",
          description: detail,
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingTrip(false);
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [initialTripId]);

  const submitTrip = useCallback(
    async (values: TripPlanRequest) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);
      setLocationFieldError(null);

      try {
        const editingTripId = editingTripIdRef.current;
        const response = editingTripId
          ? await updateTripPlan(editingTripId, values, controller.signal)
          : await planTrip(values, controller.signal);
        if (controller.signal.aborted) return;
        editingTripIdRef.current = null;
        setLastFormValues(values);
        setPlan(response);
        syncTripShareUrl(response.id);
      } catch (err) {
        if (controller.signal.aborted) return;
        const detail =
          err instanceof ApiError
            ? err.message
            : err instanceof Error && err.message
              ? err.message
              : "Something went wrong while planning the trip.";
        const formatted = formatPlanError(detail, values);
        setError({ title: formatted.title, description: formatted.description });
        setLocationFieldError(formatted.fieldError);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  const resetPlan = useCallback(() => {
    abortRef.current?.abort();
    if (plan) {
      editingTripIdRef.current = plan.id;
      setLastFormValues(tripPlanRequestFromSummary(plan.summary));
    }
    setPlan(null);
    setError(null);
    setLocationFieldError(null);
    setIsLoading(false);
    setIsLoadingTrip(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [plan]);

  return {
    plan,
    error,
    locationFieldError,
    isLoading,
    isLoadingTrip,
    lastFormValues,
    submitTrip,
    resetPlan,
  };
}
