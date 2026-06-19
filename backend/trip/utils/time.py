"""Time helpers for 15-minute log grid segments."""

from __future__ import annotations

MINUTES_PER_DAY = 24 * 60


def minutes_to_hhmm(minutes: int) -> str:
    if minutes >= MINUTES_PER_DAY:
        return "24:00"
    hours, mins = divmod(minutes, 60)
    return f"{hours:02d}:{mins:02d}"


def hhmm_to_minutes(value: str) -> int:
    if value == "24:00":
        return MINUTES_PER_DAY
    hours, minutes = value.split(":")
    return int(hours) * 60 + int(minutes)


def snap_to_quarter_hour(minutes: int) -> int:
    return round(minutes / 15) * 15


def minutes_to_duration(minutes: int) -> str:
    hours, mins = divmod(minutes, 60)
    return f"{hours}:{mins:02d}"


def duration_to_hours(value: str) -> float:
    hours, minutes = value.split(":")
    return int(hours) + int(minutes) / 60
