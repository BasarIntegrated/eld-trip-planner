from __future__ import annotations

from datetime import date, datetime, time, timedelta

from django.utils import timezone
from django.utils.dateparse import parse_datetime

from trip.utils.trip_timezone import TRIP_TZ, trip_local_date, trip_local_midnight


def aware_datetime(value: datetime) -> datetime:
    if timezone.is_naive(value):
        return value.replace(tzinfo=TRIP_TZ)
    return value


def day_start(log_date: date) -> datetime:
    return trip_local_midnight(log_date)


def day_end(log_date: date) -> datetime:
    return day_start(log_date) + timedelta(days=1)


def minutes_into_day(value: datetime, log_date: date) -> int:
    local = value.astimezone(TRIP_TZ)
    start = day_start(log_date)
    minutes = int((local - start).total_seconds() / 60)
    return min(max(minutes, 0), 24 * 60)


def parse_stop_datetime(value: str) -> datetime:
    parsed = parse_datetime(value)
    if parsed is not None:
        return aware_datetime(parsed)

    if ":" in value and len(value) <= 5:
        hours, minutes = value.split(":")
        return datetime.combine(
            trip_local_date(),
            time(hour=int(hours), minute=int(minutes)),
            tzinfo=TRIP_TZ,
        )

    raise ValueError(f"Invalid stop datetime: {value}")
