import { z } from "zod";

/**
 * Zod mirror of TripPlanResponse in types.ts — validates POST /api/trip/plan/ JSON.
 * Keep field requirements aligned with backend TripPlanResponseSerializer.
 */

/** Django Decimal fields may serialize as strings in JSON. */
const apiNumber = z.coerce.number();

const dutyStatusSchema = z.enum(["off_duty", "sleeper", "driving", "on_duty"]);
const stopTypeSchema = z.enum(["start", "pickup", "dropoff", "fuel", "rest"]);

const logSegmentSchema = z.object({
  status: dutyStatusSchema,
  start: z.string(),
  end: z.string(),
  remark: z.string(),
});

const logSheetSchema = z.object({
  date: z.string(),
  from_location: z.string(),
  to_location: z.string(),
  total_miles_driving: apiNumber,
  truck_number: z.string(),
  trailer_number: z.string(),
  carrier_name: z.string().optional(),
  main_office_address: z.string().optional(),
  home_terminal: z.string().optional(),
  shipping_document: z.string().optional(),
  shipper: z.string(),
  commodity: z.string(),
  segments: z.array(logSegmentSchema),
  totals: z.record(dutyStatusSchema, z.string()),
  recap: z.object({
    on_duty_today: apiNumber,
    cycle_used: apiNumber,
    cycle_available: apiNumber,
  }),
});

export const tripPlanResponseSchema = z.object({
  id: z.string().uuid(),
  summary: z.object({
    current_location: z.string(),
    pickup_location: z.string(),
    dropoff_location: z.string(),
    total_miles: apiNumber,
    total_days: apiNumber,
    fuel_stops: apiNumber,
    current_cycle_used: apiNumber,
    projected_cycle_used: apiNumber,
    cycle_available: apiNumber,
  }),
  route: z.object({
    polyline: z.array(z.tuple([apiNumber, apiNumber])),
    legs: z.array(
      z.object({
        from: z.string(),
        to: z.string(),
        miles: apiNumber,
      }),
    ),
  }),
  instructions: z.array(z.string()),
  stops: z.array(
    z.object({
      type: stopTypeSchema,
      label: z.string(),
      location: z.string(),
      lat: apiNumber,
      lng: apiNumber,
      time: z.string(),
      duration_minutes: apiNumber.nullable().optional(),
    }),
  ),
  log_sheets: z.array(logSheetSchema).min(1),
  meta: z.object({
    engine: z.string(),
    status: z.string(),
    created_at: z.string(),
    assumptions: z.record(z.string(), z.union([z.string(), apiNumber, z.boolean()])),
  }),
});

export function formatTripPlanSchemaErrors(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`)
    .join("; ");
}
