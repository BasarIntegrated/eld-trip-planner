"""Shared domain types for trip planning."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal

from trip.constants.hos import AVERAGE_SPEED_MPH

Phase = Literal["to_pickup", "to_dropoff", "done"]


@dataclass(frozen=True)
class TripRequest:
    current_location: str
    pickup_location: str
    dropoff_location: str
    current_cycle_used: float


@dataclass(frozen=True)
class GeoPoint:
    name: str
    lat: float
    lng: float


@dataclass(frozen=True)
class RouteSample:
    miles: float
    lat: float
    lng: float
    name: str


@dataclass(frozen=True)
class RouteLegResult:
    from_location: str
    to_location: str
    miles: float
    duration_hours: float


@dataclass(frozen=True)
class RouteResult:
    polyline: list[list[float]]
    legs: list[RouteLegResult]
    total_miles: float
    samples: list[RouteSample]
    pickup_miles: float
    dropoff_miles: float

    def _leg_at_miles(self, miles: float) -> RouteLegResult | None:
        cumulative = 0.0
        for leg in self.legs:
            if miles <= cumulative + leg.miles + 1e-6:
                return leg
            cumulative += leg.miles
        return self.legs[-1] if self.legs else None

    def cumulative_driving_minutes_at(self, miles: float) -> float:
        """OSRM-based cumulative drive minutes at a mile marker."""
        miles = max(0.0, min(miles, self.total_miles))
        cumulative_miles = 0.0
        cumulative_minutes = 0.0
        for leg in self.legs:
            leg_end = cumulative_miles + leg.miles
            if miles <= leg_end + 1e-6:
                if leg.miles <= 0:
                    return cumulative_minutes
                fraction = (miles - cumulative_miles) / leg.miles
                return cumulative_minutes + fraction * leg.duration_hours * 60.0
            cumulative_minutes += leg.duration_hours * 60.0
            cumulative_miles = leg_end
        return cumulative_minutes

    def driving_minutes_between(self, start_miles: float, end_miles: float) -> int:
        """Drive minutes between two mile markers (minimum one 15-minute grid block)."""
        if end_miles <= start_miles:
            return 15
        minutes = self.cumulative_driving_minutes_at(end_miles) - self.cumulative_driving_minutes_at(
            start_miles
        )
        return max(int(round(minutes)), 15)

    def effective_mph_at(self, miles: float) -> float:
        """Average speed for the OSRM leg containing ``miles``."""
        leg = self._leg_at_miles(miles)
        if leg and leg.duration_hours > 0 and leg.miles > 0:
            return leg.miles / leg.duration_hours
        return AVERAGE_SPEED_MPH

    def location_label_at(self, miles: float) -> str:
        """Nearest city or corridor label for a mile marker."""
        if not self.legs:
            return "Unknown"

        cumulative = 0.0
        for leg in self.legs:
            leg_end = cumulative + leg.miles
            if miles <= leg_end + 0.001:
                if leg.miles <= 0:
                    return leg.from_location
                position = (miles - cumulative) / leg.miles
                if position <= 0.4:
                    return leg.from_location
                if position >= 0.6:
                    return leg.to_location
                from_city = leg.from_location.split(",")[0].strip()
                to_city = leg.to_location.split(",")[0].strip()
                return f"{from_city}–{to_city} corridor"
            cumulative = leg_end

        return self.legs[-1].to_location

    def location_at(self, miles: float) -> tuple[str, float, float]:
        if not self.samples:
            return "Unknown", 0.0, 0.0

        previous = self.samples[0]
        for sample in self.samples[1:]:
            if miles <= sample.miles:
                if sample.miles == previous.miles:
                    return sample.name, sample.lat, sample.lng
                ratio = (miles - previous.miles) / (sample.miles - previous.miles)
                lat = previous.lat + (sample.lat - previous.lat) * ratio
                lng = previous.lng + (sample.lng - previous.lng) * ratio
                return self.location_label_at(miles), lat, lng
            previous = sample

        last = self.samples[-1]
        return last.name, last.lat, last.lng

    def milestone_at(self, miles: float) -> RouteSample:
        for sample in self.samples:
            if sample.miles >= miles:
                return sample
        return self.samples[-1]


@dataclass
class TripEvent:
    status: str
    started_at: datetime
    ended_at: datetime
    location: str
    remark: str
    lat: float
    lng: float
    miles: float = 0.0


@dataclass
class StopRecord:
    stop_type: str
    label: str
    location: str
    lat: float
    lng: float
    occurred_at: datetime
    duration_minutes: int | None = None


@dataclass
class SimulationResult:
    route: RouteResult
    current_cycle_used: float
    now: datetime
    miles_completed: float = 0.0
    miles_since_fuel: float = 0.0
    driving_minutes: int = 0
    driving_minutes_since_break: int = 0
    cycle_on_duty_total: float = 0.0
    window_started_at: datetime | None = None
    phase: Phase = "to_pickup"
    pickup_done: bool = False
    dropoff_done: bool = False
    events: list[TripEvent] = field(default_factory=list)
    stops: list[StopRecord] = field(default_factory=list)
    instructions: list[str] = field(default_factory=list)
    fuel_stop_count: int = 0

    @property
    def current_location(self) -> tuple[str, float, float]:
        return self.route.location_at(self.miles_completed)
