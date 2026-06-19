"""Unit tests for the FMCSA HOS trip simulator."""

from __future__ import annotations

from datetime import date, datetime, timedelta

from django.test import SimpleTestCase

from trip.constants import DROPOFF_MINUTES, FUEL_INTERVAL_MILES, PICKUP_MINUTES
from trip.constants.hos import (
    AVERAGE_SPEED_MPH,
    BREAK_AFTER_DRIVING_MINUTES,
    BREAK_MINUTES,
    FUEL_MINUTES,
    MAX_DRIVING_MINUTES,
    MAX_WINDOW_MINUTES,
    POST_TRIP_MINUTES,
    PRE_TRIP_MINUTES,
    REST_MINUTES,
    TRIP_START_HOUR,
    TRIP_START_MINUTE,
)
from trip.domain.entities import RouteLegResult, RouteResult, RouteSample, SimulationResult
from trip.services.hos import HOSSimulator
from trip.utils.trip_timezone import trip_local_datetime


def make_route(
    *,
    total_miles: float,
    pickup_miles: float,
    origin: str = "Green Bay, WI",
    pickup: str = "Fond du Lac, WI",
    dropoff: str = "Edwardsville, IL",
) -> RouteResult:
    """Minimal route fixture with samples at origin, pickup, and dropoff."""
    leg_to_pickup = pickup_miles
    leg_to_dropoff = total_miles - pickup_miles
    return RouteResult(
        polyline=[[44.5, -88.0], [43.8, -88.4], [38.8, -90.2]],
        legs=[
            RouteLegResult(origin, pickup, leg_to_pickup, leg_to_pickup / AVERAGE_SPEED_MPH),
            RouteLegResult(pickup, dropoff, leg_to_dropoff, leg_to_dropoff / AVERAGE_SPEED_MPH),
        ],
        total_miles=total_miles,
        samples=[
            RouteSample(0, 44.5, -88.0, origin),
            RouteSample(pickup_miles, 43.8, -88.4, pickup),
            RouteSample(total_miles, 38.8, -90.2, dropoff),
        ],
        pickup_miles=pickup_miles,
        dropoff_miles=total_miles,
    )


def driving_minutes(result: SimulationResult) -> int:
    return sum(
        int((event.ended_at - event.started_at).total_seconds() / 60)
        for event in result.events
        if event.status == "driving"
    )


def on_duty_minutes(result: SimulationResult) -> int:
    return sum(
        int((event.ended_at - event.started_at).total_seconds() / 60)
        for event in result.events
        if event.status == "on_duty"
    )


def stop_labels(result: SimulationResult) -> list[str]:
    return [stop.label for stop in result.stops]


def stop_types(result: SimulationResult) -> list[str]:
    return [stop.stop_type for stop in result.stops]


class HOSThresholdTests(SimpleTestCase):
    """Direct checks for HOS limit helpers (11-hour, 14-hour, 8-hour, 1,000-mile)."""

    def setUp(self):
        self.simulator = HOSSimulator()
        self.route = make_route(total_miles=100, pickup_miles=40)
        self.state = SimulationResult(
            route=self.route,
            current_cycle_used=0,
            now=trip_local_datetime(date(2026, 6, 16), 6, 30),
        )

    def test_must_rest_at_eleven_hour_driving_limit(self):
        self.state.driving_minutes = MAX_DRIVING_MINUTES
        self.assertTrue(self.simulator._must_rest(self.state))

    def test_must_rest_at_fourteen_hour_on_duty_window(self):
        self.state.window_started_at = self.state.now
        self.state.now = self.state.window_started_at + timedelta(minutes=MAX_WINDOW_MINUTES)
        self.assertTrue(self.simulator._must_rest(self.state))

    def test_no_rest_required_under_driving_and_window_limits(self):
        self.state.driving_minutes = MAX_DRIVING_MINUTES - 1
        self.state.window_started_at = self.state.now
        self.state.now = self.state.window_started_at + timedelta(minutes=MAX_WINDOW_MINUTES - 1)
        self.assertFalse(self.simulator._must_rest(self.state))

    def test_needs_break_after_eight_hours_driving_since_last_break(self):
        self.state.driving_minutes_since_break = BREAK_AFTER_DRIVING_MINUTES
        self.assertTrue(self.simulator._needs_break(self.state))

    def test_needs_fuel_at_one_thousand_mile_interval(self):
        self.state.miles_since_fuel = FUEL_INTERVAL_MILES
        self.assertTrue(self.simulator._needs_fuel(self.state))

    def test_miles_until_break_scales_with_remaining_drive_time(self):
        self.state.driving_minutes_since_break = BREAK_AFTER_DRIVING_MINUTES - 60
        miles_left = self.simulator._miles_until_break(self.state)
        self.assertAlmostEqual(miles_left, AVERAGE_SPEED_MPH, delta=0.2)


class HOSSimulatorShortTripTests(SimpleTestCase):
    """Trips that finish within a single duty window (no mid-trip 10-hour rest)."""

    def setUp(self):
        self.fixed_start = trip_local_datetime(
            date(2026, 6, 16), TRIP_START_HOUR, TRIP_START_MINUTE
        )

    def _run(self, total_miles: float, pickup_miles: float, cycle_used: float = 32) -> SimulationResult:
        simulator = HOSSimulator()
        simulator._default_start_time = lambda: self.fixed_start  # type: ignore[method-assign]
        return simulator.run(
            make_route(total_miles=total_miles, pickup_miles=pickup_miles),
            cycle_used,
        )

    def test_completes_with_start_pickup_dropoff_and_final_rest_stops(self):
        result = self._run(total_miles=50, pickup_miles=15)

        self.assertEqual(stop_types(result), ["start", "pickup", "dropoff", "rest"])
        self.assertNotIn("30-minute break", stop_labels(result))
        self.assertEqual(result.fuel_stop_count, 0)

    def test_cycle_hours_include_assessment_on_duty_and_driving_time(self):
        cycle_used = 32.0
        result = self._run(total_miles=50, pickup_miles=15, cycle_used=cycle_used)
        drive_minutes = driving_minutes(result)
        expected_on_duty = PRE_TRIP_MINUTES + PICKUP_MINUTES + DROPOFF_MINUTES + POST_TRIP_MINUTES

        self.assertEqual(on_duty_minutes(result), expected_on_duty)
        self.assertAlmostEqual(
            result.cycle_on_duty_total,
            cycle_used + (expected_on_duty + drive_minutes) / 60,
            places=1,
        )

    def test_pre_trip_and_post_trip_inspections_are_on_duty(self):
        result = self._run(total_miles=50, pickup_miles=15)
        remarks = [event.remark for event in result.events if event.status == "on_duty"]

        self.assertTrue(any("Pre-trip inspection" in remark for remark in remarks))
        self.assertTrue(any("Post-trip inspection" in remark for remark in remarks))

    def test_events_form_continuous_timeline(self):
        result = self._run(total_miles=50, pickup_miles=15)

        self.assertEqual(result.events[0].started_at, self.fixed_start)
        for previous, current in zip(result.events, result.events[1:], strict=False):
            self.assertEqual(previous.ended_at, current.started_at)

    def test_driving_minutes_match_route_distance_at_average_speed(self):
        result = self._run(total_miles=50, pickup_miles=15)
        expected = round((50 / AVERAGE_SPEED_MPH) * 60)

        self.assertAlmostEqual(driving_minutes(result), expected, delta=2)

    def test_pickup_stop_occurs_before_dropoff_stop(self):
        result = self._run(total_miles=50, pickup_miles=15)
        pickup_at = next(stop.occurred_at for stop in result.stops if stop.stop_type == "pickup")
        dropoff_at = next(stop.occurred_at for stop in result.stops if stop.stop_type == "dropoff")

        self.assertLess(pickup_at, dropoff_at)


class HOSSimulatorComplianceTests(SimpleTestCase):
    """Trips that trigger FMCSA assessment rules: 30-minute break, 10-hour rest, fuel."""

    def setUp(self):
        self.simulator = HOSSimulator()

    def test_long_leg_inserts_thirty_minute_break_before_dropoff(self):
        # Leg 2 is 490 mi (~8.9 h driving) — exceeds 8-hour break threshold.
        result = self.simulator.run(make_route(total_miles=500, pickup_miles=10), current_cycle_used=0)

        self.assertIn("30-minute break", stop_labels(result))
        break_events = [
            event
            for event in result.events
            if event.status == "off_duty" and "30-minute rest break" in event.remark
        ]
        self.assertEqual(len(break_events), 1)
        self.assertEqual(
            int((break_events[0].ended_at - break_events[0].started_at).total_seconds() / 60),
            BREAK_MINUTES,
        )

    def test_very_long_leg_inserts_ten_hour_rest_before_dropoff(self):
        # Leg 2 is 610 mi — exceeds 11-hour driving limit; requires mid-trip rest.
        result = self.simulator.run(make_route(total_miles=620, pickup_miles=10), current_cycle_used=0)

        sleeper_events = [event for event in result.events if event.status == "sleeper"]
        self.assertGreaterEqual(len(sleeper_events), 2)
        mid_rest = sleeper_events[0]
        self.assertEqual(
            int((mid_rest.ended_at - mid_rest.started_at).total_seconds() / 60),
            REST_MINUTES - 90,
        )
        self.assertIn("dropoff", stop_types(result))

    def test_trip_over_one_thousand_miles_records_fuel_stop(self):
        result = self.simulator.run(make_route(total_miles=1100, pickup_miles=50), current_cycle_used=0)

        self.assertGreaterEqual(result.fuel_stop_count, 1)
        self.assertIn("fuel", stop_types(result))
        fuel_events = [event for event in result.events if "Fuel stop" in event.remark]
        self.assertEqual(len(fuel_events), 1)
        self.assertEqual(
            int((fuel_events[0].ended_at - fuel_events[0].started_at).total_seconds() / 60),
            FUEL_MINUTES,
        )

    def test_assessment_scale_trip_green_bay_to_edwardsville_completes(self):
        # ~480 mi total with pickup near midpoint — matches demo-scale assessment route.
        result = self.simulator.run(make_route(total_miles=480, pickup_miles=240), current_cycle_used=32)

        self.assertIn("pickup", stop_types(result))
        self.assertIn("dropoff", stop_types(result))
        self.assertIn("30-minute break", stop_labels(result))
        self.assertEqual(result.fuel_stop_count, 0)
        self.assertGreater(driving_minutes(result), BREAK_AFTER_DRIVING_MINUTES)


class HOSSimulatorInstructionTests(SimpleTestCase):
    def test_instructions_cover_trip_start_pickup_and_required_breaks(self):
        result = HOSSimulator().run(make_route(total_miles=500, pickup_miles=10), current_cycle_used=0)

        joined = " ".join(result.instructions)
        self.assertIn("Begin trip at Green Bay, WI", joined)
        self.assertIn("pre-trip inspection", joined.lower())
        self.assertIn("pickup", joined.lower())
        self.assertIn("30-minute rest break", joined)
