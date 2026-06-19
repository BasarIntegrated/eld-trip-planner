from django.contrib import admin
from django.db.models import Count

from trip.models import DailyLogSheet, LogSegment, RouteLeg, RouteStop, TripPlan


class RouteLegInline(admin.TabularInline):
    model = RouteLeg
    extra = 0
    ordering = ["sequence"]


class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 0
    ordering = ["sequence"]


class LogSegmentInline(admin.TabularInline):
    model = LogSegment
    extra = 0
    ordering = ["sequence"]


class DailyLogSheetInline(admin.StackedInline):
    model = DailyLogSheet
    extra = 0
    show_change_link = True
    ordering = ["day_number"]


@admin.register(TripPlan)
class TripPlanAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "current_location",
        "dropoff_location",
        "total_miles",
        "total_days",
        "engine",
        "status",
        "created_at",
    ]
    list_filter = ["status", "engine", "created_at"]
    search_fields = [
        "id",
        "current_location",
        "pickup_location",
        "dropoff_location",
    ]
    readonly_fields = ["id", "created_at", "updated_at"]
    inlines = [RouteLegInline, RouteStopInline, DailyLogSheetInline]

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .annotate(
                _leg_count=Count("legs", distinct=True),
                _stop_count=Count("stops", distinct=True),
                _sheet_count=Count("log_sheets", distinct=True),
            )
        )


@admin.register(DailyLogSheet)
class DailyLogSheetAdmin(admin.ModelAdmin):
    list_display = [
        "log_date",
        "trip_plan",
        "day_number",
        "from_location",
        "to_location",
        "total_miles_driving",
    ]
    list_filter = ["log_date"]
    search_fields = ["from_location", "to_location", "trip_plan__id"]
    inlines = [LogSegmentInline]


@admin.register(LogSegment)
class LogSegmentAdmin(admin.ModelAdmin):
    list_display = ["log_sheet", "sequence", "duty_status", "start_minute", "end_minute"]
    list_filter = ["duty_status"]


@admin.register(RouteStop)
class RouteStopAdmin(admin.ModelAdmin):
    list_display = ["trip_plan", "sequence", "stop_type", "label", "location", "occurred_at"]
    list_filter = ["stop_type"]


@admin.register(RouteLeg)
class RouteLegAdmin(admin.ModelAdmin):
    list_display = ["trip_plan", "sequence", "from_location", "to_location", "miles"]
