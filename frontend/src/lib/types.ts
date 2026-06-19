/**
 * API types for POST /api/trip/plan/
 *
 * Every field is returned by the backend and consumed by the trip results UI.
 * Runtime validation: trip-plan-response-schema.ts (must stay in sync).
 */

export type DutyStatus = "off_duty" | "sleeper" | "driving" | "on_duty";

export type StopType = "start" | "pickup" | "dropoff" | "fuel" | "rest";

/** Request body for POST /api/trip/plan/ */
export interface TripPlanRequest {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  /** Hours already used in the 70-hour / 8-day cycle (0–70). */
  current_cycle_used: number;
}

/** One OSRM route segment (current→pickup or pickup→dropoff). Used in trip overview. */
export interface RouteLeg {
  from: string;
  to: string;
  miles: number;
}

/** Map marker + stops tab row (start, pickup, fuel, rest, dropoff). */
export interface RouteStop {
  type: StopType;
  label: string;
  location: string;
  lat: number;
  lng: number;
  /** ISO datetime when the stop occurs. */
  time: string;
  /** Omitted or null for point-in-time stops (e.g. trip start). */
  duration_minutes?: number | null;
}

/** One line on the 24-hour log grid. */
export interface LogSegment {
  status: DutyStatus;
  /** HH:MM on the log grid. */
  start: string;
  end: string;
  remark: string;
}

/** One filled daily ELD log sheet. Used by LogSheetTabs and child log components. */
export interface LogSheet {
  date: string;
  from_location: string;
  to_location: string;
  total_miles_driving: number;
  truck_number: string;
  trailer_number: string;
  carrier_name?: string;
  main_office_address?: string;
  home_terminal?: string;
  shipping_document?: string;
  shipper: string;
  commodity: string;
  segments: LogSegment[];
  totals: Record<DutyStatus, string>;
  recap: {
    on_duty_today: number;
    cycle_used: number;
    cycle_available: number;
  };
}

/** Trip summary stats — trip overview card, input details, map aria-label. */
export interface TripPlanSummary {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  total_miles: number;
  /** Number of daily log sheets (= trip days). */
  total_days: number;
  fuel_stops: number;
  current_cycle_used: number;
  projected_cycle_used: number;
  /** Hours remaining in the 70-hour / 8-day cycle after this trip. */
  cycle_available: number;
}

/** Route geometry from OSRM. */
export interface TripPlanRoute {
  /** [lat, lng] points — draws the route line on the Leaflet map. */
  polyline: [number, number][];
  /** Leg mileage breakdown — shown in trip overview. */
  legs: RouteLeg[];
}

/** Full plan returned after POST /api/trip/plan/ (201). */
export interface TripPlanResponse {
  /** Persisted trip id — map remount key. */
  id: string;
  summary: TripPlanSummary;
  route: TripPlanRoute;
  /** Step-by-step driver instructions tab. */
  instructions: string[];
  stops: RouteStop[];
  log_sheets: LogSheet[];
  /** Planner engine id and audit fields — status badge, footer, and assumptions card. */
  meta: {
    engine: string;
    status: string;
    created_at: string;
    /** FMCSA rules applied — assessment assumptions card in main content. */
    assumptions: Record<string, string | number | boolean>;
  };
}
