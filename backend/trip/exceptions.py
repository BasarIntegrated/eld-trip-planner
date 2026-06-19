class RoutingError(Exception):
    """Raised when geocoding or routing fails."""


class TripPlanNotFoundError(Exception):
    """Raised when a trip plan UUID does not exist."""
