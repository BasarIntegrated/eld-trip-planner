interface TripRouteLocations {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
}

function formatStop(location: string, short: boolean): string {
  return short ? location.split(",")[0].trim() : location.trim();
}

/** Full trip path: current → pickup → dropoff. */
export function formatTripRoute(
  locations: TripRouteLocations,
  options?: { short?: boolean },
): string {
  const short = options?.short ?? false;
  return [
    formatStop(locations.current_location, short),
    formatStop(locations.pickup_location, short),
    formatStop(locations.dropoff_location, short),
  ].join(" → ");
}
