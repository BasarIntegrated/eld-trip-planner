import { tripFormLabels } from "@/lib/typography";

/** Field-specific location validation copy. */
export function locationRequiredMessage(fieldLabel: string) {
  return `Please enter ${fieldLabel.toLowerCase()}.`;
}

export function locationTooLongMessage(fieldLabel: string) {
  return `${fieldLabel} must be 255 characters or fewer.`;
}

/**
 * Client-side form validation copy.
 * Pattern: polite request + field name + format example or range.
 */
export const validationMessages = {
  cycleUsed: {
    invalid: `Please enter ${tripFormLabels.current_cycle_used.toLowerCase()} (0–70).`,
    min: "Must be at least 0 hours.",
    max: "Cannot exceed 70 hours.",
  },
} as const;

/** Server-side geocode / routing errors shown on fields or in alerts. */
export const serverErrorMessages = {
  locationNotFound: (fieldLabel: string) => `${fieldLabel} could not be found.`,
  locationNotFoundGeneric:
    "One or more locations could not be found. Check spelling and use City, ST format.",
  locationNotRecognizedTitle: "Location not recognized",
  locationNotRecognizedDescription:
    "Addresses are verified when you submit. Enter a real US city and two-letter state abbreviation.",
  routingFailedTitle: "Could not calculate route",
  routingFailedDescription:
    "Locations were found but driving directions could not be calculated. Try nearby major cities.",
  planFailedTitle: "Unable to plan trip",
} as const;
