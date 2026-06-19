from django.db import models


class DutyStatus(models.TextChoices):
    OFF_DUTY = "off_duty", "Off Duty"
    SLEEPER = "sleeper", "Sleeper Berth"
    DRIVING = "driving", "Driving"
    ON_DUTY = "on_duty", "On Duty (not driving)"


class StopType(models.TextChoices):
    START = "start", "Trip start"
    PICKUP = "pickup", "Pickup"
    DROPOFF = "dropoff", "Dropoff"
    FUEL = "fuel", "Fuel"
    REST = "rest", "Rest"


class PlannerEngine(models.TextChoices):
    STUB = "stub", "Stub"
    HOS = "hos", "HOS"


class TripPlanStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"
