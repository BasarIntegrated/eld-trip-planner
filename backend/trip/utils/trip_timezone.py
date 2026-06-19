"""Timezone for trip simulation and log-sheet day boundaries."""

from __future__ import annotations

from datetime import date, datetime, time
from zoneinfo import ZoneInfo

# US Central — aligns with typical Midwest OTR routes in the assessment demo.
TRIP_LOCAL_TIMEZONE = "America/Chicago"
TRIP_TZ = ZoneInfo(TRIP_LOCAL_TIMEZONE)


def trip_local_date() -> date:
    return datetime.now(TRIP_TZ).date()


def trip_local_datetime(day: date, hour: int, minute: int = 0) -> datetime:
    return datetime.combine(day, time(hour, minute), tzinfo=TRIP_TZ)


def trip_local_midnight(day: date) -> datetime:
    return datetime.combine(day, time.min, tzinfo=TRIP_TZ)
