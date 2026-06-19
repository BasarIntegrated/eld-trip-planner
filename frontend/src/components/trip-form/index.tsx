"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Route } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dashboardTheme } from "@/lib/dashboard-theme";
import type { LocationField } from "@/lib/location-errors";
import {
  LOCATION_INPUT_HINT,
  LOCATION_PLACEHOLDERS,
  TRIP_FORM_DEFAULTS,
  tripFormSchema,
  type TripFormSubmitValues,
  type TripFormValues,
} from "@/lib/trip-form-schema";
import { tripFormLabels, typography } from "@/lib/typography";
import { useCurrentLocation } from "@/hooks/use-current-location";

import { LocationFieldInput } from "./location-field-input";
import { LocationFormatHelp } from "./location-format-help";
import { UseMyLocationButton } from "./use-my-location-button";

interface TripFormProps {
  onSubmit: (values: TripFormSubmitValues) => Promise<void>;
  isLoading?: boolean;
  locationFieldError?: { field: LocationField; message: string } | null;
  defaultValues?: TripFormValues;
  locationWarning?: string | null;
  onLocationWarningChange?: (warning: string | null) => void;
}

const LOCATION_FIELDS = [
  {
    id: "current_location" as const,
    label: tripFormLabels.current_location,
    placeholder: LOCATION_PLACEHOLDERS.current_location,
  },
  {
    id: "pickup_location" as const,
    label: tripFormLabels.pickup_location,
    placeholder: LOCATION_PLACEHOLDERS.pickup_location,
  },
  {
    id: "dropoff_location" as const,
    label: tripFormLabels.dropoff_location,
    placeholder: LOCATION_PLACEHOLDERS.dropoff_location,
  },
];

export function TripForm({
  onSubmit,
  isLoading,
  locationFieldError,
  defaultValues = TRIP_FORM_DEFAULTS,
  locationWarning = null,
  onLocationWarningChange,
}: TripFormProps) {
  const {
    register,
    handleSubmit,
    setFocus,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const {
    fetchCurrentLocation,
    isLocating,
    locationError,
    locationWarning: geoWarning,
    clearLocationFeedback,
  } = useCurrentLocation();

  const activeLocationWarning = locationWarning ?? geoWarning;

  useEffect(() => {
    onLocationWarningChange?.(geoWarning);
  }, [geoWarning, onLocationWarningChange]);

  useEffect(() => {
    if (locationFieldError) {
      setFocus(locationFieldError.field);
    }
  }, [locationFieldError, setFocus]);

  const handleUseMyLocation = async () => {
    clearLocationFeedback();
    onLocationWarningChange?.(null);
    const result = await fetchCurrentLocation();
    if (result) {
      setValue("current_location", result.location, {
        shouldValidate: !result.warning,
        shouldDirty: true,
      });
      if (result.warning) {
        onLocationWarningChange?.(result.warning);
      }
      setFocus("current_location");
    }
  };

  const handleClearLocationWarning = () => {
    if (activeLocationWarning) {
      clearLocationFeedback();
      onLocationWarningChange?.(null);
    }
  };

  const suppressCurrentLocationErrors = Boolean(activeLocationWarning);

  return (
    <Card className={dashboardTheme.card}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${typography.cardTitle}`}>
          <Route className="size-5 text-brand" />
          Plan trip
          <LocationFormatHelp />
        </CardTitle>
        <CardDescription className={typography.cardDescription}>
          US locations in {LOCATION_INPUT_HINT}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {LOCATION_FIELDS.map(({ id, label, placeholder }) => {
            const isCurrentLocation = id === "current_location";

            return (
              <LocationFieldInput
                key={id}
                id={id}
                label={label}
                placeholder={placeholder}
                error={
                  isCurrentLocation && suppressCurrentLocationErrors
                    ? undefined
                    : errors[id]?.message
                }
                serverError={
                  isCurrentLocation && suppressCurrentLocationErrors
                    ? undefined
                    : locationFieldError?.field === id
                      ? locationFieldError.message
                      : undefined
                }
                register={register}
                onInputChange={
                  isCurrentLocation ? handleClearLocationWarning : undefined
                }
                labelAction={
                  isCurrentLocation ? (
                    <UseMyLocationButton
                      onClick={handleUseMyLocation}
                      isLocating={isLocating}
                      disabled={isLoading}
                    />
                  ) : undefined
                }
                geoError={
                  isCurrentLocation && !suppressCurrentLocationErrors
                    ? (locationError ?? undefined)
                    : undefined
                }
              />
            );
          })}

          <div className="space-y-2">
            <Label htmlFor="current_cycle_used">
              {tripFormLabels.current_cycle_used}
            </Label>
            <Input
              id="current_cycle_used"
              type="number"
              step="0.5"
              min={0}
              max={70}
              inputMode="decimal"
              placeholder="0–70"
              aria-invalid={errors.current_cycle_used ? true : undefined}
              aria-describedby={
                errors.current_cycle_used ? "current_cycle_used-error" : undefined
              }
              {...register("current_cycle_used", { valueAsNumber: true })}
            />
            <p className={typography.helperText}>
              Hours already used in the 70-hour / 8-day window (0–70).
            </p>
            {errors.current_cycle_used ? (
              <p
                id="current_cycle_used-error"
                className={typography.errorText}
                role="alert"
              >
                {errors.current_cycle_used.message}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-1 h-11 w-full rounded-xl bg-brand-gradient font-semibold tracking-tight text-white shadow-md hover:opacity-95"
            disabled={isLoading || Boolean(activeLocationWarning)}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {tripFormLabels.submitLoading}
              </>
            ) : (
              <>
                <Route className="size-4" />
                {tripFormLabels.submit}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
