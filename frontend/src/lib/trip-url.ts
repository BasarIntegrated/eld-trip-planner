export function buildTripSharePath(tripId: string): string {
  return `/trips/${tripId}`;
}

/** Update the address bar to the shareable trip URL without a Next.js navigation. */
export function syncTripShareUrl(tripId: string): void {
  if (typeof window === "undefined") return;
  const path = buildTripSharePath(tripId);
  if (window.location.pathname === path) return;
  window.history.replaceState(null, "", path);
}

export function buildTripShareUrl(tripId: string): string {
  if (typeof window === "undefined") {
    return buildTripSharePath(tripId);
  }
  return `${window.location.origin}${buildTripSharePath(tripId)}`;
}
