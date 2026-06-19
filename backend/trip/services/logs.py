"""Build FMCSA daily log sheets (15-minute grid) from HOS simulation events."""

from __future__ import annotations

from collections import defaultdict
from datetime import date
from typing import Any

from trip.domain.entities import SimulationResult, TripEvent
from trip.constants import (
    CARRIER_NAME,
    CYCLE_LIMIT_HOURS,
    DEFAULT_COMMODITY,
    DEFAULT_SHIPPER,
    DEFAULT_TRAILER_NUMBER,
    DEFAULT_TRUCK_NUMBER,
    MAIN_OFFICE_ADDRESS,
)
from trip.utils.datetime import day_end, day_start, minutes_into_day
from trip.utils.time import (
    MINUTES_PER_DAY,
    duration_to_hours,
    hhmm_to_minutes,
    minutes_to_duration,
    minutes_to_hhmm,
    snap_to_quarter_hour,
)


class LogSheetBuilder:
    """Builds FMCSA daily log sheets from HOS simulation events."""

    def build(self, simulation: SimulationResult) -> list[dict[str, Any]]:
        """Return one log sheet per calendar day touched by the trip."""
        events_by_day = self._split_events_by_day(simulation.events)
        sheets: list[dict[str, Any]] = []
        cumulative_on_duty = simulation.current_cycle_used

        for sheet_index, log_date in enumerate(sorted(events_by_day)):
            day_events = events_by_day[log_date]
            segments = self._events_to_segments(day_events, log_date)
            totals = self._calculate_totals(segments)
            on_duty_today = duration_to_hours(totals["driving"]) + duration_to_hours(
                totals["on_duty"]
            )
            cumulative_on_duty += on_duty_today
            driving_miles = round(
                sum(event.miles for event in day_events if event.status == "driving"),
                1,
            )

            sheets.append(
                {
                    "date": log_date.isoformat(),
                    "from_location": day_events[0].location,
                    "to_location": day_events[-1].location,
                    "total_miles_driving": driving_miles,
                    "truck_number": DEFAULT_TRUCK_NUMBER,
                    "trailer_number": DEFAULT_TRAILER_NUMBER,
                    "carrier_name": CARRIER_NAME,
                    "main_office_address": MAIN_OFFICE_ADDRESS,
                    "home_terminal": simulation.route.samples[0].name,
                    "shipping_document": f"S{log_date.strftime('%Y%m%d')}-{sheet_index + 1:02d}",
                    "shipper": DEFAULT_SHIPPER,
                    "commodity": DEFAULT_COMMODITY,
                    "segments": segments,
                    "totals": totals,
                    "recap": {
                        "on_duty_today": round(on_duty_today, 1),
                        "cycle_used": round(cumulative_on_duty, 1),
                        "cycle_available": round(CYCLE_LIMIT_HOURS - cumulative_on_duty, 1),
                    },
                }
            )

        return sheets

    def _split_events_by_day(self, events: list[TripEvent]) -> dict[date, list[TripEvent]]:
        """Slice events that cross midnight into per-day TripEvent copies."""
        grouped: dict[date, list[TripEvent]] = defaultdict(list)

        for event in events:
            day_cursor = event.started_at.date()
            while day_cursor <= event.ended_at.date():
                start = day_start(day_cursor)
                end = day_end(day_cursor)
                segment_start = max(event.started_at, start)
                segment_end = min(event.ended_at, end)
                if segment_end > segment_start:
                    grouped[day_cursor].append(
                        TripEvent(
                            status=event.status,
                            started_at=segment_start,
                            ended_at=segment_end,
                            location=event.location,
                            remark=event.remark,
                            lat=event.lat,
                            lng=event.lng,
                            miles=event.miles if day_cursor == event.started_at.date() else 0.0,
                        )
                    )
                day_cursor = day_cursor.fromordinal(day_cursor.toordinal() + 1)

        for day in grouped:
            grouped[day].sort(key=lambda event: event.started_at)
        return grouped

    def _events_to_segments(
        self,
        day_events: list[TripEvent],
        log_date: date,
    ) -> list[dict[str, str]]:
        """Convert timed events into HH:MM duty segments for the 24-hour grid."""
        start = day_start(log_date)
        end = day_end(log_date)
        segments: list[dict[str, str]] = []
        cursor = start

        for event in day_events:
            if event.started_at > cursor:
                segments.extend(self._off_duty_gap(cursor, event.started_at, log_date))
            segments.append(
                {
                    "status": event.status,
                    "start": minutes_to_hhmm(minutes_into_day(event.started_at, log_date)),
                    "end": minutes_to_hhmm(minutes_into_day(event.ended_at, log_date)),
                    "remark": event.remark,
                }
            )
            cursor = event.ended_at

        if cursor < end:
            segments.extend(self._off_duty_gap(cursor, end, log_date))

        segments = self._normalize_segments(segments)
        segments = self._merge_adjacent(segments)
        return self._balance_segments_to_full_day(segments)

    def _off_duty_gap(self, start, end, log_date: date) -> list[dict[str, str]]:
        """Fill idle time between events with off-duty segments."""
        if end <= start:
            return []
        return [
            {
                "status": "off_duty",
                "start": minutes_to_hhmm(minutes_into_day(start, log_date)),
                "end": minutes_to_hhmm(minutes_into_day(end, log_date)),
                "remark": "",
            }
        ]

    def _normalize_segments(self, segments: list[dict[str, str]]) -> list[dict[str, str]]:
        """Snap segment boundaries to the nearest 15-minute ELD grid line."""
        normalized: list[dict[str, str]] = []
        for segment in segments:
            start_minute = snap_to_quarter_hour(hhmm_to_minutes(segment["start"]))
            end_minute = snap_to_quarter_hour(hhmm_to_minutes(segment["end"]))
            if end_minute <= start_minute:
                if segment["remark"]:
                    end_minute = min(start_minute + 15, MINUTES_PER_DAY)
                else:
                    continue
            normalized.append(
                {
                    "status": segment["status"],
                    "start": minutes_to_hhmm(start_minute),
                    "end": minutes_to_hhmm(end_minute),
                    "remark": segment["remark"],
                }
            )
        return normalized

    def _merge_adjacent(self, segments: list[dict[str, str]]) -> list[dict[str, str]]:
        """Combine back-to-back segments with the same status (and remark)."""
        if not segments:
            return segments

        merged = [segments[0].copy()]
        for segment in segments[1:]:
            previous = merged[-1]
            same_status = segment["status"] == previous["status"]
            adjacent = segment["start"] == previous["end"]
            different_activity = (
                previous.get("remark")
                and segment.get("remark")
                and previous["remark"] != segment["remark"]
            )
            if same_status and adjacent and not different_activity:
                previous["end"] = segment["end"]
                if segment["remark"] and segment["remark"] not in previous["remark"]:
                    previous["remark"] = (
                        f"{previous['remark']}; {segment['remark']}"
                        if previous["remark"]
                        else segment["remark"]
                    )
            else:
                merged.append(segment.copy())
        return merged

    def _balance_segments_to_full_day(self, segments: list[dict[str, str]]) -> list[dict[str, str]]:
        """Pad or trim filler off-duty time so the grid spans exactly 24 hours."""
        if not segments:
            return segments

        total = sum(
            hhmm_to_minutes(segment["end"]) - hhmm_to_minutes(segment["start"])
            for segment in segments
        )
        delta = MINUTES_PER_DAY - total
        if delta == 0:
            return segments

        if delta > 0:
            last = segments[-1]
            last_end = hhmm_to_minutes(last["end"])
            if last_end < MINUTES_PER_DAY:
                segments.append(
                    {
                        "status": "off_duty",
                        "start": minutes_to_hhmm(last_end),
                        "end": "24:00",
                        "remark": "",
                    }
                )
            return segments

        # Trim trailing filler off-duty when snapping pushed the grid over 24 hours.
        for index in range(len(segments) - 1, -1, -1):
            segment = segments[index]
            if segment["remark"]:
                continue
            duration = hhmm_to_minutes(segment["end"]) - hhmm_to_minutes(segment["start"])
            if duration <= 0:
                continue
            trim = min(duration, -delta)
            new_end = hhmm_to_minutes(segment["end"]) - trim
            if new_end > hhmm_to_minutes(segment["start"]):
                segment["end"] = minutes_to_hhmm(new_end)
                delta += trim
                if delta == 0:
                    break
        return segments

    def _calculate_totals(self, segments: list[dict[str, str]]) -> dict[str, str]:
        """Sum minutes per duty status and format as HH:MM durations."""
        totals = {"off_duty": 0, "sleeper": 0, "driving": 0, "on_duty": 0}
        for segment in segments:
            duration = hhmm_to_minutes(segment["end"]) - hhmm_to_minutes(segment["start"])
            totals[segment["status"]] += duration
        return {key: minutes_to_duration(value) for key, value in totals.items()}
