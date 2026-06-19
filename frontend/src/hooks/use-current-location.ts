"use client";

import { useCallback, useState } from "react";

import { NON_US_LOCATION_MESSAGE } from "@/lib/reverse-geocode";

type GeolocationStatus = "idle" | "locating" | "error";

export interface CurrentLocationResult {
  location: string;
  warning?: string;
}

export function useCurrentLocation() {
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const fetchCurrentLocation = useCallback(async (): Promise<CurrentLocationResult | null> => {
    setStatus("locating");
    setError(null);
    setWarning(null);

    if (!navigator.geolocation) {
      const message = "Your browser does not support location access.";
      setError(message);
      setStatus("error");
      return null;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 15_000,
          maximumAge: 60_000,
        });
      });

      const response = await fetch(
        `/api/reverse-geocode?lat=${position.coords.latitude}&lng=${position.coords.longitude}`,
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(data?.detail ?? "Could not resolve your location.");
      }

      const data = (await response.json()) as {
        location: string;
        isUs: boolean;
        warning?: string;
      };

      if (!data.isUs) {
        const nonUsWarning = data.warning ?? NON_US_LOCATION_MESSAGE;
        setWarning(nonUsWarning);
        setStatus("idle");
        return { location: data.location, warning: nonUsWarning };
      }

      setStatus("idle");
      return { location: data.location };
    } catch (err) {
      let message = "Could not get your location. Try entering City, ST manually.";

      if (err instanceof GeolocationPositionError) {
        if (err.code === err.PERMISSION_DENIED) {
          message = "Location permission denied. Allow access or enter City, ST manually.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = "Location unavailable. Enter City, ST manually.";
        } else if (err.code === err.TIMEOUT) {
          message = "Location request timed out. Try again or enter City, ST manually.";
        }
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }

      setError(message);
      setStatus("error");
      return null;
    }
  }, []);

  return {
    fetchCurrentLocation,
    isLocating: status === "locating",
    locationError: error,
    locationWarning: warning,
    clearLocationFeedback: () => {
      setError(null);
      setWarning(null);
      setStatus("idle");
    },
  };
}
