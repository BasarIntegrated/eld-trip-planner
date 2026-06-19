"""API payload assembly."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any

from trip.domain.entities import RouteResult, SimulationResult, TripRequest
from trip.constants import ASSESSMENT_ASSUMPTIONS, CYCLE_LIMIT_HOURS


@dataclass
class TripPlanPayload:
    summary: dict[str, Any]
    route: dict[str, Any]
    instructions: list[str] = field(default_factory=list)
    stops: list[dict[str, Any]] = field(default_factory=list)
    log_sheets: list[dict[str, Any]] = field(default_factory=list)
    meta: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_planning(
        cls,
        request: TripRequest,
        route: RouteResult,
        simulation: SimulationResult,
        log_sheets: list[dict[str, Any]],
    ) -> TripPlanPayload:
        projected_cycle_used = round(simulation.cycle_on_duty_total, 1)
        if log_sheets:
            projected_cycle_used = log_sheets[-1]["recap"]["cycle_used"]

        return cls(
            summary={
                "current_location": request.current_location,
                "pickup_location": request.pickup_location,
                "dropoff_location": request.dropoff_location,
                "total_miles": route.total_miles,
                "total_days": len(log_sheets),
                "fuel_stops": simulation.fuel_stop_count,
                "current_cycle_used": request.current_cycle_used,
                "projected_cycle_used": projected_cycle_used,
                "cycle_available": round(CYCLE_LIMIT_HOURS - projected_cycle_used, 1),
            },
            route={
                "polyline": route.polyline,
                "legs": [
                    {
                        "from": leg.from_location,
                        "to": leg.to_location,
                        "miles": leg.miles,
                    }
                    for leg in route.legs
                ],
            },
            instructions=simulation.instructions,
            stops=[
                {
                    "type": stop.stop_type,
                    "label": stop.label,
                    "location": stop.location,
                    "lat": stop.lat,
                    "lng": stop.lng,
                    "time": stop.occurred_at.isoformat(),
                    "duration_minutes": stop.duration_minutes,
                }
                for stop in simulation.stops
            ],
            log_sheets=log_sheets,
            meta={
                "engine": "hos",
                "assumptions": ASSESSMENT_ASSUMPTIONS,
            },
        )
