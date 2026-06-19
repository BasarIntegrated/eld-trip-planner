from __future__ import annotations

from typing import Any
from uuid import UUID

from django.db import transaction

from trip.constants import (
    DEFAULT_TRAILER_NUMBER,
    DEFAULT_TRUCK_NUMBER,
    TripPlanStatus,
)
from trip.domain.payload import TripPlanPayload
from trip.exceptions import TripPlanNotFoundError
from trip.models import DailyLogSheet, LogSegment, RouteLeg, RouteStop, TripPlan
from trip.serializers import TripPlanResponseSerializer
from trip.utils.datetime import parse_stop_datetime
from trip.utils.time import hhmm_to_minutes


class TripPlanRepository:
    """Persists and serializes trip plans."""

    PREFETCH_RELATED = (
        "legs",
        "stops",
        "log_sheets__segments",
    )

    def save(self, payload: TripPlanPayload) -> TripPlan:
        data = payload.as_dict()
        summary = data["summary"]
        route = data["route"]
        meta = data.get("meta", {})

        with transaction.atomic():
            trip = TripPlan.objects.create(
                current_location=summary["current_location"],
                pickup_location=summary["pickup_location"],
                dropoff_location=summary["dropoff_location"],
                current_cycle_used=summary["current_cycle_used"],
                total_miles=summary["total_miles"],
                total_days=summary["total_days"],
                fuel_stops_count=summary["fuel_stops"],
                projected_cycle_used=summary["projected_cycle_used"],
                cycle_available=summary["cycle_available"],
                route_polyline=route["polyline"],
                route_instructions=data.get("instructions", []),
                assumptions=meta.get("assumptions", {}),
                engine=meta.get("engine", "hos"),
                status=TripPlanStatus.COMPLETED,
            )
            self._create_legs(trip, route["legs"])
            self._create_stops(trip, data["stops"])
            self._create_log_sheets(trip, data["log_sheets"])

        return trip

    def update(self, trip_id: UUID, payload: TripPlanPayload) -> TripPlan:
        """Replace computed trip data on an existing plan, keeping the same id."""
        trip = self.get_by_id(trip_id)
        data = payload.as_dict()
        summary = data["summary"]
        route = data["route"]
        meta = data.get("meta", {})

        with transaction.atomic():
            trip.current_location = summary["current_location"]
            trip.pickup_location = summary["pickup_location"]
            trip.dropoff_location = summary["dropoff_location"]
            trip.current_cycle_used = summary["current_cycle_used"]
            trip.total_miles = summary["total_miles"]
            trip.total_days = summary["total_days"]
            trip.fuel_stops_count = summary["fuel_stops"]
            trip.projected_cycle_used = summary["projected_cycle_used"]
            trip.cycle_available = summary["cycle_available"]
            trip.route_polyline = route["polyline"]
            trip.route_instructions = data.get("instructions", [])
            trip.assumptions = meta.get("assumptions", {})
            trip.engine = meta.get("engine", "hos")
            trip.status = TripPlanStatus.COMPLETED
            trip.save()

            trip.legs.all().delete()
            trip.stops.all().delete()
            trip.log_sheets.all().delete()

            self._create_legs(trip, route["legs"])
            self._create_stops(trip, data["stops"])
            self._create_log_sheets(trip, data["log_sheets"])

        return trip

    def get_by_id(self, trip_id: UUID) -> TripPlan:
        try:
            return TripPlan.objects.prefetch_related(*self.PREFETCH_RELATED).get(
                pk=trip_id,
            )
        except TripPlan.DoesNotExist as exc:
            raise TripPlanNotFoundError(str(trip_id)) from exc

    def serialize(self, trip: TripPlan) -> dict[str, Any]:
        return TripPlanResponseSerializer(self.get_by_id(trip.pk)).data

    def get_serialized(self, trip_id: UUID) -> dict[str, Any]:
        trip = self.get_by_id(trip_id)
        return TripPlanResponseSerializer(trip).data

    def _create_legs(self, trip: TripPlan, legs: list[dict[str, Any]]) -> None:
        RouteLeg.objects.bulk_create(
            [
                RouteLeg(
                    trip_plan=trip,
                    sequence=index + 1,
                    from_location=leg["from"],
                    to_location=leg["to"],
                    miles=leg["miles"],
                )
                for index, leg in enumerate(legs)
            ]
        )

    def _create_stops(self, trip: TripPlan, stops: list[dict[str, Any]]) -> None:
        RouteStop.objects.bulk_create(
            [
                RouteStop(
                    trip_plan=trip,
                    sequence=index + 1,
                    stop_type=stop["type"],
                    label=stop["label"],
                    location=stop["location"],
                    latitude=stop["lat"],
                    longitude=stop["lng"],
                    occurred_at=parse_stop_datetime(stop["time"]),
                    duration_minutes=stop.get("duration_minutes"),
                )
                for index, stop in enumerate(stops)
            ]
        )

    def _create_log_sheets(self, trip: TripPlan, sheets: list[dict[str, Any]]) -> None:
        for sheet_index, sheet in enumerate(sheets):
            log_sheet = DailyLogSheet.objects.create(
                trip_plan=trip,
                day_number=sheet_index + 1,
                log_date=sheet["date"],
                from_location=sheet["from_location"],
                to_location=sheet["to_location"],
                total_miles_driving=sheet["total_miles_driving"],
                truck_number=sheet.get("truck_number", DEFAULT_TRUCK_NUMBER),
                trailer_number=sheet.get("trailer_number", DEFAULT_TRAILER_NUMBER),
                shipper=sheet.get("shipper", ""),
                commodity=sheet.get("commodity", ""),
                total_off_duty=sheet["totals"]["off_duty"],
                total_sleeper=sheet["totals"]["sleeper"],
                total_driving=sheet["totals"]["driving"],
                total_on_duty=sheet["totals"]["on_duty"],
                recap_on_duty_today=sheet["recap"]["on_duty_today"],
                recap_cycle_used=sheet["recap"]["cycle_used"],
                recap_cycle_available=sheet["recap"]["cycle_available"],
            )
            LogSegment.objects.bulk_create(
                [
                    LogSegment(
                        log_sheet=log_sheet,
                        sequence=index + 1,
                        duty_status=segment["status"],
                        start_minute=hhmm_to_minutes(segment["start"]),
                        end_minute=hhmm_to_minutes(segment["end"]),
                        remark=segment.get("remark", ""),
                    )
                    for index, segment in enumerate(sheet["segments"])
                ]
            )
