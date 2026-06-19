from rest_framework import serializers

from trip.models import TripPlan
from trip.serializers.log_sheet import DailyLogSheetSerializer
from trip.serializers.route import RouteLegSerializer, RouteStopSerializer


class TripPlanResponseSerializer(serializers.ModelSerializer):
    summary = serializers.SerializerMethodField()
    route = serializers.SerializerMethodField()
    instructions = serializers.JSONField(source="route_instructions")
    stops = RouteStopSerializer(many=True, read_only=True)
    log_sheets = DailyLogSheetSerializer(many=True, read_only=True)
    meta = serializers.SerializerMethodField()

    class Meta:
        model = TripPlan
        fields = [
            "id",
            "summary",
            "route",
            "instructions",
            "stops",
            "log_sheets",
            "meta",
        ]

    def get_summary(self, obj: TripPlan) -> dict:
        return {
            "current_location": obj.current_location,
            "pickup_location": obj.pickup_location,
            "dropoff_location": obj.dropoff_location,
            "total_miles": float(obj.total_miles or 0),
            "total_days": obj.total_days,
            "fuel_stops": obj.fuel_stops_count,
            "current_cycle_used": float(obj.current_cycle_used),
            "projected_cycle_used": float(obj.projected_cycle_used or 0),
            "cycle_available": float(obj.cycle_available or 0),
        }

    def get_route(self, obj: TripPlan) -> dict:
        return {
            "polyline": obj.route_polyline,
            "legs": RouteLegSerializer(obj.legs.all(), many=True).data,
        }

    def get_meta(self, obj: TripPlan) -> dict:
        return {
            "engine": obj.engine,
            "status": obj.status,
            "assumptions": obj.assumptions,
            "created_at": obj.created_at.isoformat(),
        }
