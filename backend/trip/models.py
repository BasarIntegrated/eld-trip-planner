import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from trip.constants import (
    DEFAULT_TRAILER_NUMBER,
    DEFAULT_TRUCK_NUMBER,
    DutyStatus,
    PlannerEngine,
    StopType,
    TripPlanStatus,
)


class TripPlan(models.Model):
    """Top-level trip request and computed plan summary."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_used = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        validators=[MinValueValidator(0), MaxValueValidator(70)],
    )

    total_miles = models.DecimalField(
        max_digits=8,
        decimal_places=1,
        null=True,
        blank=True,
    )
    total_days = models.PositiveSmallIntegerField(default=1)
    fuel_stops_count = models.PositiveSmallIntegerField(default=0)
    projected_cycle_used = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True,
    )
    cycle_available = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True,
    )

    route_polyline = models.JSONField(default=list, blank=True)
    route_instructions = models.JSONField(default=list, blank=True)
    assumptions = models.JSONField(default=dict, blank=True)

    engine = models.CharField(
        max_length=16,
        choices=PlannerEngine.choices,
        default=PlannerEngine.HOS,
    )
    status = models.CharField(
        max_length=16,
        choices=TripPlanStatus.choices,
        default=TripPlanStatus.COMPLETED,
    )
    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"{self.current_location} → {self.dropoff_location} ({self.id})"


class RouteLeg(models.Model):
    """Ordered segment of the overall route."""

    trip_plan = models.ForeignKey(
        TripPlan,
        on_delete=models.CASCADE,
        related_name="legs",
    )
    sequence = models.PositiveSmallIntegerField()
    from_location = models.CharField(max_length=255)
    to_location = models.CharField(max_length=255)
    miles = models.DecimalField(max_digits=8, decimal_places=1)

    class Meta:
        ordering = ["sequence"]
        constraints = [
            models.UniqueConstraint(
                fields=["trip_plan", "sequence"],
                name="uniq_route_leg_sequence",
            ),
        ]

    def __str__(self) -> str:
        return f"Leg {self.sequence}: {self.from_location} → {self.to_location}"


class RouteStop(models.Model):
    """Map-visible stop along the route (fuel, rest, pickup, etc.)."""

    trip_plan = models.ForeignKey(
        TripPlan,
        on_delete=models.CASCADE,
        related_name="stops",
    )
    sequence = models.PositiveSmallIntegerField()
    stop_type = models.CharField(max_length=16, choices=StopType.choices)
    label = models.CharField(max_length=128)
    location = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    occurred_at = models.DateTimeField()
    duration_minutes = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["sequence"]
        constraints = [
            models.UniqueConstraint(
                fields=["trip_plan", "sequence"],
                name="uniq_route_stop_sequence",
            ),
        ]
        indexes = [
            models.Index(fields=["trip_plan", "stop_type"]),
        ]

    def __str__(self) -> str:
        return f"{self.label} @ {self.location}"


class DailyLogSheet(models.Model):
    """One FMCSA daily log page (24-hour period)."""

    trip_plan = models.ForeignKey(
        TripPlan,
        on_delete=models.CASCADE,
        related_name="log_sheets",
    )
    day_number = models.PositiveSmallIntegerField()
    log_date = models.DateField()
    from_location = models.CharField(max_length=255)
    to_location = models.CharField(max_length=255)
    total_miles_driving = models.DecimalField(max_digits=8, decimal_places=1)

    truck_number = models.CharField(max_length=32, default=DEFAULT_TRUCK_NUMBER)
    trailer_number = models.CharField(max_length=32, default=DEFAULT_TRAILER_NUMBER)
    shipper = models.CharField(max_length=255, blank=True)
    commodity = models.CharField(max_length=255, blank=True)

    total_off_duty = models.CharField(max_length=8, default="0:00")
    total_sleeper = models.CharField(max_length=8, default="0:00")
    total_driving = models.CharField(max_length=8, default="0:00")
    total_on_duty = models.CharField(max_length=8, default="0:00")

    recap_on_duty_today = models.DecimalField(max_digits=5, decimal_places=1)
    recap_cycle_used = models.DecimalField(max_digits=5, decimal_places=1)
    recap_cycle_available = models.DecimalField(max_digits=5, decimal_places=1)

    class Meta:
        ordering = ["day_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["trip_plan", "log_date"],
                name="uniq_log_sheet_date",
            ),
            models.UniqueConstraint(
                fields=["trip_plan", "day_number"],
                name="uniq_log_sheet_day_number",
            ),
        ]

    def __str__(self) -> str:
        return f"Log {self.log_date} (day {self.day_number})"


class LogSegment(models.Model):
    """Single duty-status line on a daily log grid."""

    log_sheet = models.ForeignKey(
        DailyLogSheet,
        on_delete=models.CASCADE,
        related_name="segments",
    )
    sequence = models.PositiveSmallIntegerField()
    duty_status = models.CharField(max_length=16, choices=DutyStatus.choices)
    start_minute = models.PositiveSmallIntegerField(
        validators=[MaxValueValidator(24 * 60 - 1)],
    )
    end_minute = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(24 * 60)],
    )
    remark = models.CharField(max_length=512, blank=True)

    class Meta:
        ordering = ["sequence"]
        constraints = [
            models.UniqueConstraint(
                fields=["log_sheet", "sequence"],
                name="uniq_log_segment_sequence",
            ),
            models.CheckConstraint(
                check=models.Q(end_minute__gt=models.F("start_minute")),
                name="log_segment_end_after_start",
            ),
        ]
        indexes = [
            models.Index(fields=["log_sheet", "duty_status"]),
        ]

    def __str__(self) -> str:
        return f"{self.duty_status} [{self.start_minute}-{self.end_minute}]"
