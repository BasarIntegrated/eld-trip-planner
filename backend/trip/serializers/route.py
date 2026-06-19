from rest_framework import serializers

from trip.models import RouteLeg, RouteStop


class RouteStopSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source="stop_type")
    lat = serializers.DecimalField(
        source="latitude",
        max_digits=9,
        decimal_places=6,
        coerce_to_string=False,
    )
    lng = serializers.DecimalField(
        source="longitude",
        max_digits=9,
        decimal_places=6,
        coerce_to_string=False,
    )
    time = serializers.SerializerMethodField()

    class Meta:
        model = RouteStop
        fields = [
            "type",
            "label",
            "location",
            "lat",
            "lng",
            "time",
            "duration_minutes",
        ]

    def get_time(self, obj: RouteStop) -> str:
        return obj.occurred_at.isoformat()


class RouteLegSerializer(serializers.ModelSerializer):
    from_field = serializers.CharField(source="from_location")
    to = serializers.CharField(source="to_location")

    class Meta:
        model = RouteLeg
        fields = ["from_field", "to", "miles"]

    def to_representation(self, instance: RouteLeg) -> dict:
        data = super().to_representation(instance)
        return {
            "from": data["from_field"],
            "to": data["to"],
            "miles": float(data["miles"]),
        }
