"""Trip planning pipeline: route → HOS simulation → log sheets → storage."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from trip.domain.entities import TripRequest
from trip.domain.payload import TripPlanPayload
from trip.repositories.trip_plan import TripPlanRepository
from trip.services.hos import HOSSimulator
from trip.services.logs import LogSheetBuilder
from trip.services.routing import RouteService


class TripPlannerService:
    """Orchestrates routing, HOS simulation, log building, and persistence."""

    def __init__(
        self,
        route_service: RouteService | None = None,
        hos_simulator: HOSSimulator | None = None,
        log_builder: LogSheetBuilder | None = None,
        repository: TripPlanRepository | None = None,
    ) -> None:
        """Dependencies are optional for tests; production uses live defaults."""
        self.route_service = route_service or RouteService()
        self.hos_simulator = hos_simulator or HOSSimulator()
        self.log_builder = log_builder or LogSheetBuilder()
        self.repository = repository or TripPlanRepository()

    def create_plan(self, request: TripRequest) -> dict[str, Any]:
        """Run the full pipeline, save the plan, and return the API payload."""
        payload = self.build_payload(request)
        trip = self.repository.save(payload)
        return self.repository.serialize(trip)

    def update_plan(self, trip_id: UUID, request: TripRequest) -> dict[str, Any]:
        """Re-run the pipeline and replace the stored plan for an existing trip id."""
        payload = self.build_payload(request)
        trip = self.repository.update(trip_id, payload)
        return self.repository.serialize(trip)

    def build_payload(self, request: TripRequest) -> TripPlanPayload:
        """Geocode locations, build the route, simulate duty, and assemble logs."""
        current = self.route_service.geocode(request.current_location)
        pickup = self.route_service.geocode(request.pickup_location)
        dropoff = self.route_service.geocode(request.dropoff_location)
        route = self.route_service.build_trip_route(current, pickup, dropoff)
        simulation = self.hos_simulator.run(route, request.current_cycle_used)
        log_sheets = self.log_builder.build(simulation)
        return TripPlanPayload.from_planning(request, route, simulation, log_sheets)
