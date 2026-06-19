const DEFAULT_API_ASSUMPTIONS: Record<string, string | number | boolean> = {
  cycle_rule: "70 hrs / 8 days",
  adverse_conditions: false,
  fuel_interval_miles: 1000,
  pickup_minutes: 60,
  dropoff_minutes: 60,
};

/** Human-readable lines from API meta.assumptions for the assessment card. */
export function formatAssessmentAssumptions(
  assumptions: Record<string, string | number | boolean>,
): string[] {
  const fuelMiles = Number(assumptions.fuel_interval_miles ?? 1000);
  const pickupMin = Number(assumptions.pickup_minutes ?? 60);
  const dropoffMin = Number(assumptions.dropoff_minutes ?? 60);

  return [
    `Property-carrying driver, ${assumptions.cycle_rule ?? "70 hrs / 8 days"}`,
    assumptions.adverse_conditions
      ? "Adverse driving conditions applied"
      : "No adverse driving conditions",
    `Fuel stop at least every ${fuelMiles} miles`,
    `${pickupMin / 60} hour for pickup and ${dropoffMin / 60} hour for dropoff`,
    "11-hour driving limit, 14-hour window, 30-minute break, 10-hour rest",
  ];
}

export const DEFAULT_FULL_ASSUMPTIONS = formatAssessmentAssumptions(
  DEFAULT_API_ASSUMPTIONS,
);
