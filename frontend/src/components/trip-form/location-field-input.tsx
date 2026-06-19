import type { ReactNode } from "react";
import type { UseFormRegister } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LocationField } from "@/lib/location-errors";
import type { TripFormValues } from "@/lib/trip-form-schema";
import { typography } from "@/lib/typography";

interface LocationFieldInputProps {
  id: LocationField;
  label: string;
  placeholder: string;
  error?: string;
  serverError?: string;
  register: UseFormRegister<TripFormValues>;
  labelAction?: ReactNode;
  geoError?: string;
  onInputChange?: () => void;
}

export function LocationFieldInput({
  id,
  label,
  placeholder,
  error,
  serverError,
  register,
  labelAction,
  geoError,
  onInputChange,
}: LocationFieldInputProps) {
  const showError = serverError ?? error;
  const describedBy = [showError && `${id}-error`, geoError && `${id}-geo-error`]
    .filter(Boolean)
    .join(" ");

  const { onChange, ...fieldProps } = register(id);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {labelAction}
      </div>
      <Input
        id={id}
        placeholder={placeholder}
        autoComplete="address-level2"
        aria-invalid={showError || geoError ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...fieldProps}
        onChange={(event) => {
          onChange(event);
          onInputChange?.();
        }}
      />
      {showError ? (
        <p id={`${id}-error`} className={typography.errorText} role="alert">
          {showError}
        </p>
      ) : null}
      {geoError ? (
        <p id={`${id}-geo-error`} className={typography.errorText} role="alert">
          {geoError}
        </p>
      ) : null}
    </div>
  );
}
