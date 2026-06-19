"""FMCSA hours-of-service simulation for a multi-stop truck route."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, time, timedelta

from trip.domain.entities import (
    Phase,
    RouteResult,
    SimulationResult,
    StopRecord,
    TripEvent,
)

from trip.constants import DROPOFF_MINUTES, FUEL_INTERVAL_MILES, PICKUP_MINUTES
from trip.constants.hos import (
    BREAK_AFTER_DRIVING_MINUTES,
    BREAK_MINUTES,
    FUEL_MINUTES,
    MAX_DRIVING_MINUTES,
    MAX_WINDOW_MINUTES,
    OFF_DUTY_BEFORE_SLEEPER,
    POST_TRIP_MINUTES,
    PRE_TRIP_MINUTES,
    REST_MINUTES,
    TRIP_START_HOUR,
    TRIP_START_MINUTE,
)
from trip.utils.trip_timezone import TRIP_TZ, trip_local_date


@dataclass(frozen=True)
class Activity:
    """One timed on-duty or stop action (minutes, remark, optional map stop)."""
    minutes: int
    remark: str
    stop_type: str | None = None
    stop_label: str | None = None
    instruction: str | None = None


class HOSSimulator:
    """Simulates FMCSA-compliant trip timelines."""

    def run(self, route: RouteResult, current_cycle_used: float) -> SimulationResult:
        """Walk the route in phases (pickup leg → dropoff leg) and emit duty events."""
        start = self._default_start_time()
        state = SimulationResult(
            route=route,
            current_cycle_used=current_cycle_used,
            now=start,
            cycle_on_duty_total=current_cycle_used,
        )

        origin = route.samples[0]
        self._record_stop(state, "start", "Trip start", origin.name, origin.lat, origin.lng, start)
        state.instructions.append(f"Begin trip at {origin.name}.")
        self._apply_on_duty(
            state,
            Activity(PRE_TRIP_MINUTES, f"{origin.name} - Pre-trip inspection"),
        )
        state.instructions.append("Complete 30-minute pre-trip inspection.")

        while state.phase != "done":
            if state.phase == "to_pickup":
                self._drive_toward(state, route.pickup_miles)
                if state.miles_completed >= route.pickup_miles and not state.pickup_done:
                    self._perform_pickup(state)
            elif state.phase == "to_dropoff":
                self._drive_toward(state, route.dropoff_miles)
                if state.miles_completed >= route.dropoff_miles and not state.dropoff_done:
                    self._perform_dropoff(state)

        return state

    def _default_start_time(self) -> datetime:
        """Default trip start: today at 6:30 AM US Central."""
        return datetime.combine(
            trip_local_date(),
            time(hour=TRIP_START_HOUR, minute=TRIP_START_MINUTE),
            tzinfo=TRIP_TZ,
        )

    def _drive_toward(self, state: SimulationResult, target_miles: float) -> None:
        """Advance mile-by-mile, pausing for rest, break, or fuel when limits hit."""
        while state.miles_completed < target_miles - 0.01:
            if self._must_rest(state):
                self._apply_rest(state)
                continue
            if self._needs_break(state):
                self._apply_break(state)
                continue
            if self._needs_fuel(state):
                self._apply_fuel(state)
                continue

            # Drive only until the next HOS limit or waypoint — whichever is closest.
            chunk_miles = min(
                target_miles - state.miles_completed,
                self._miles_until_fuel(state),
                self._miles_until_break(state),
                self._miles_until_driving_limit(state),
                self._miles_until_window_limit(state),
            )
            chunk_miles = max(chunk_miles, 0.1)  # avoid a zero-length driving loop
            end_miles = min(state.miles_completed + chunk_miles, target_miles)
            chunk_minutes = state.route.driving_minutes_between(
                state.miles_completed,
                end_miles,
            )

            location, lat, lng = state.route.location_at(end_miles)
            self._apply_driving(
                state,
                minutes=chunk_minutes,
                miles=end_miles - state.miles_completed,
                location=location,
                lat=lat,
                lng=lng,
            )
            state.miles_completed = end_miles

    def _perform_pickup(self, state: SimulationResult) -> None:
        """Record 1-hour on-duty pickup stop, then switch to the dropoff leg."""
        sample = state.route.milestone_at(state.route.pickup_miles)
        activity = Activity(
            PICKUP_MINUTES,
            f"{sample.name} - Pickup (1 hour)",
            stop_type="pickup",
            stop_label="Pickup",
            instruction=f"Arrive at pickup in {sample.name}; load for 1 hour.",
        )
        self._apply_on_duty(state, activity, sample.name, sample.lat, sample.lng)
        state.pickup_done = True
        state.phase = "to_dropoff"

    def _perform_dropoff(self, state: SimulationResult) -> None:
        """Record 1-hour dropoff, post-trip inspection, 10-hour rest, and end the trip."""
        sample = state.route.milestone_at(state.route.dropoff_miles)
        self._apply_on_duty(
            state,
            Activity(
                DROPOFF_MINUTES,
                f"{sample.name} - Dropoff (1 hour)",
                stop_type="dropoff",
                stop_label="Dropoff",
                instruction=f"Arrive at dropoff in {sample.name}; unload for 1 hour.",
            ),
            sample.name,
            sample.lat,
            sample.lng,
        )
        self._apply_on_duty(
            state,
            Activity(POST_TRIP_MINUTES, f"{sample.name} - Post-trip inspection"),
            sample.name,
            sample.lat,
            sample.lng,
        )
        state.instructions.append("Complete post-trip inspection and begin 10-hour rest.")
        self._apply_rest(state)
        state.dropoff_done = True
        state.phase = "done"

    def _apply_driving(
        self,
        state: SimulationResult,
        *,
        minutes: int,
        miles: float,
        location: str,
        lat: float,
        lng: float,
    ) -> None:
        """Add a driving segment and update cycle, break, and fuel counters."""
        self._append_event(state, "driving", minutes, location, "Driving", lat, lng, miles)
        state.driving_minutes += minutes
        state.driving_minutes_since_break += minutes
        state.cycle_on_duty_total += minutes / 60
        state.miles_since_fuel += miles

    def _apply_on_duty(
        self,
        state: SimulationResult,
        activity: Activity,
        location: str | None = None,
        lat: float | None = None,
        lng: float | None = None,
    ) -> None:
        """Add an on-duty segment; starts the 14-hour window on first on-duty work."""
        if location is None:
            location, lat, lng = state.current_location
        if state.window_started_at is None:
            state.window_started_at = state.now

        self._append_event(state, "on_duty", activity.minutes, location, activity.remark, lat, lng)
        state.cycle_on_duty_total += activity.minutes / 60
        self._maybe_record_stop(state, activity, location, lat, lng, activity.minutes)
        if activity.instruction:
            state.instructions.append(activity.instruction)

    def _apply_break(self, state: SimulationResult) -> None:
        """Insert required 30-minute off-duty break after 8 hours of driving."""
        location, lat, lng = state.current_location
        activity = Activity(
            BREAK_MINUTES,
            f"{location} - 30-minute rest break",
            stop_type="rest",
            stop_label="30-minute break",
            instruction=f"Take required 30-minute rest break near {location}.",
        )
        self._append_event(state, "off_duty", activity.minutes, location, activity.remark, lat, lng)
        self._maybe_record_stop(state, activity, location, lat, lng, activity.minutes)
        state.instructions.append(activity.instruction or "")
        state.driving_minutes_since_break = 0

    def _apply_fuel(self, state: SimulationResult) -> None:
        """Insert on-duty fuel stop when miles since last fuel reach 1,000."""
        location, lat, lng = state.current_location
        activity = Activity(
            FUEL_MINUTES,
            f"{location} - Fuel stop",
            stop_type="fuel",
            stop_label="Fuel stop",
            instruction=f"Fuel stop near {location} (required every 1,000 miles).",
        )
        self._apply_on_duty(state, activity, location, lat, lng)
        state.miles_since_fuel = 0.0
        state.fuel_stop_count += 1

    def _apply_rest(self, state: SimulationResult) -> None:
        """Insert 10-hour rest (off duty then sleeper) and reset driving/window clocks."""
        location, lat, lng = state.current_location
        self._append_event(
            state,
            "off_duty",
            OFF_DUTY_BEFORE_SLEEPER,
            location,
            f"{location} - Off duty",
            lat,
            lng,
        )
        self._append_event(
            state,
            "sleeper",
            REST_MINUTES - OFF_DUTY_BEFORE_SLEEPER,
            location,
            f"{location} - 10-hour rest (sleeper berth)",
            lat,
            lng,
        )
        self._record_stop(
            state,
            "rest",
            "10-hour rest",
            location,
            lat,
            lng,
            state.now - timedelta(minutes=REST_MINUTES),
            REST_MINUTES,
        )
        state.instructions.append(f"Take 10-hour off-duty/sleeper rest near {location}.")
        state.driving_minutes = 0
        state.driving_minutes_since_break = 0
        state.window_started_at = None

    def _append_event(
        self,
        state: SimulationResult,
        status: str,
        minutes: int,
        location: str,
        remark: str,
        lat: float,
        lng: float,
        miles: float = 0.0,
    ) -> None:
        """Append one duty event and advance the simulation clock."""
        ended_at = state.now + timedelta(minutes=minutes)
        state.events.append(
            TripEvent(
                status=status,
                started_at=state.now,
                ended_at=ended_at,
                location=location,
                remark=remark,
                lat=lat,
                lng=lng,
                miles=miles,
            )
        )
        state.now = ended_at

    def _record_stop(
        self,
        state: SimulationResult,
        stop_type: str,
        label: str,
        location: str,
        lat: float,
        lng: float,
        occurred_at: datetime,
        duration_minutes: int | None = None,
    ) -> None:
        """Add a map-visible stop (start, pickup, fuel, rest, etc.)."""
        state.stops.append(
            StopRecord(
                stop_type=stop_type,
                label=label,
                location=location,
                lat=lat,
                lng=lng,
                occurred_at=occurred_at,
                duration_minutes=duration_minutes,
            )
        )

    def _maybe_record_stop(
        self,
        state: SimulationResult,
        activity: Activity,
        location: str,
        lat: float,
        lng: float,
        duration_minutes: int,
    ) -> None:
        """Record a stop when the activity has a stop_type (pickup, fuel, rest, …)."""
        if not activity.stop_type:
            return
        self._record_stop(
            state,
            activity.stop_type,
            activity.stop_label or activity.stop_type.title(),
            location,
            lat,
            lng,
            state.now - timedelta(minutes=duration_minutes),
            duration_minutes,
        )

    def _must_rest(self, state: SimulationResult) -> bool:
        """True when 11-hour driving or 14-hour on-duty window is exhausted."""
        if state.driving_minutes >= MAX_DRIVING_MINUTES:
            return True
        if state.window_started_at and state.now >= state.window_started_at + timedelta(
            minutes=MAX_WINDOW_MINUTES
        ):
            return True
        return False

    def _needs_break(self, state: SimulationResult) -> bool:
        """True after 8 cumulative hours of driving without a 30-minute break."""
        return state.driving_minutes_since_break >= BREAK_AFTER_DRIVING_MINUTES

    def _needs_fuel(self, state: SimulationResult) -> bool:
        """True when miles since last fuel meet the 1,000-mile assessment interval."""
        return state.miles_since_fuel >= FUEL_INTERVAL_MILES

    def _miles_until_fuel(self, state: SimulationResult) -> float:
        """Miles left before the next required fuel stop."""
        return max(FUEL_INTERVAL_MILES - state.miles_since_fuel, 0.1)

    def _mph_at(self, state: SimulationResult) -> float:
        """Current leg speed from OSRM, used to convert minute limits to miles."""
        return state.route.effective_mph_at(state.miles_completed)

    def _miles_until_break(self, state: SimulationResult) -> float:
        """Miles left before the next required 30-minute break."""
        remaining = BREAK_AFTER_DRIVING_MINUTES - state.driving_minutes_since_break
        mph = self._mph_at(state)
        return max((remaining / 60) * mph, 0.1)

    def _miles_until_driving_limit(self, state: SimulationResult) -> float:
        """Miles left before hitting the 11-hour driving limit."""
        remaining = MAX_DRIVING_MINUTES - state.driving_minutes
        mph = self._mph_at(state)
        return max((remaining / 60) * mph, 0.1)

    def _miles_until_window_limit(self, state: SimulationResult) -> float:
        """Miles left before the 14-hour on-duty window ends."""
        if not state.window_started_at:
            return float("inf")
        remaining = MAX_WINDOW_MINUTES - int(
            (state.now - state.window_started_at).total_seconds() / 60
        )
        mph = self._mph_at(state)
        return max((remaining / 60) * mph, 0.1)
