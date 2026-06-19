import { z } from "zod";

import {
  locationRequiredMessage,
  locationTooLongMessage,
  validationMessages,
} from "@/lib/form-validation";
import type { TripPlanRequest } from "@/lib/types";
import { tripFormLabels } from "@/lib/typography";
import { isValidUsStateCode } from "@/lib/us-states";

/** Per-field placeholder examples shown when inputs are empty. */
export const LOCATION_PLACEHOLDERS = {
  current_location: "Green Bay, WI",
  pickup_location: "Fond du Lac, WI",
  dropoff_location: "Edwardsville, IL",
} as const;

/** US location fields must be ``City, ST`` (two-letter state). */
export const CITY_ST_PATTERN = /^.+,\s*[A-Za-z]{2}$/;

export const cityStateFormatMessage =
  "Use City, ST format (e.g. Green Bay, WI).";

export const invalidUsStateMessage =
  "Enter a valid US city and two-letter state abbreviation.";

function parseStateCode(value: string): string | null {
  const match = value.trim().match(CITY_ST_PATTERN);
  if (!match) return null;
  const state = value.split(",").pop()?.trim();
  return state ? state.toUpperCase() : null;
}

function locationField(fieldLabel: string) {
  return z
    .string()
    .trim()
    .min(2, locationRequiredMessage(fieldLabel))
    .max(255, locationTooLongMessage(fieldLabel))
    .regex(CITY_ST_PATTERN, cityStateFormatMessage)
    .refine((value) => {
      const state = parseStateCode(value);
      return state ? isValidUsStateCode(state) : false;
    }, invalidUsStateMessage);
}

const cycleUsedField = z
  .number({ message: validationMessages.cycleUsed.invalid })
  .refine((value) => Number.isFinite(value), {
    message: validationMessages.cycleUsed.invalid,
  })
  .min(0, validationMessages.cycleUsed.min)
  .max(70, validationMessages.cycleUsed.max);

export const tripFormSchema = z.object({
  current_location: locationField(tripFormLabels.current_location),
  pickup_location: locationField(tripFormLabels.pickup_location),
  dropoff_location: locationField(tripFormLabels.dropoff_location),
  current_cycle_used: cycleUsedField,
});

export type TripFormValues = z.infer<typeof tripFormSchema>;

export const TRIP_FORM_DEFAULTS: TripFormValues = {
  current_location: "",
  pickup_location: "",
  dropoff_location: "",
  current_cycle_used: 0,
};

export const LOCATION_INPUT_HINT = "City, ST format";

/** Satisfies TripPlanRequest — form values map 1:1 to API payload. */
export type TripFormSubmitValues = TripPlanRequest;
