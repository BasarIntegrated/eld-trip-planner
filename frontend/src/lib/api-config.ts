export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const API_PATHS = {
  health: "/api/health/",
  planTrip: "/api/trip/plan/",
  tripDetail: (id: string) => `/api/trip/${id}/`,
} as const;
