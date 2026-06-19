from rest_framework import serializers

from trip.constants import CARRIER_NAME, MAIN_OFFICE_ADDRESS
from trip.models import DailyLogSheet, LogSegment
from trip.utils.time import minutes_to_hhmm


class LogSegmentSerializer(serializers.ModelSerializer):
    start = serializers.SerializerMethodField()
    end = serializers.SerializerMethodField()
    status = serializers.CharField(source="duty_status")

    class Meta:
        model = LogSegment
        fields = ["status", "start", "end", "remark"]

    def get_start(self, obj: LogSegment) -> str:
        return minutes_to_hhmm(obj.start_minute)

    def get_end(self, obj: LogSegment) -> str:
        return minutes_to_hhmm(obj.end_minute)


class DailyLogSheetSerializer(serializers.ModelSerializer):
    date = serializers.DateField(source="log_date")
    total_miles_driving = serializers.SerializerMethodField()
    segments = LogSegmentSerializer(many=True, read_only=True)
    totals = serializers.SerializerMethodField()
    recap = serializers.SerializerMethodField()
    carrier_name = serializers.SerializerMethodField()
    main_office_address = serializers.SerializerMethodField()
    home_terminal = serializers.SerializerMethodField()
    shipping_document = serializers.SerializerMethodField()

    class Meta:
        model = DailyLogSheet
        fields = [
            "date",
            "from_location",
            "to_location",
            "total_miles_driving",
            "truck_number",
            "trailer_number",
            "carrier_name",
            "main_office_address",
            "home_terminal",
            "shipping_document",
            "shipper",
            "commodity",
            "segments",
            "totals",
            "recap",
        ]

    def get_total_miles_driving(self, obj: DailyLogSheet) -> float:
        return float(obj.total_miles_driving)

    def get_carrier_name(self, obj: DailyLogSheet) -> str:
        return CARRIER_NAME

    def get_main_office_address(self, obj: DailyLogSheet) -> str:
        return MAIN_OFFICE_ADDRESS

    def get_home_terminal(self, obj: DailyLogSheet) -> str:
        return obj.trip_plan.current_location

    def get_shipping_document(self, obj: DailyLogSheet) -> str:
        return f"S{obj.log_date.strftime('%Y%m%d')}-{obj.day_number:02d}"

    def get_totals(self, obj: DailyLogSheet) -> dict[str, str]:
        return {
            "off_duty": obj.total_off_duty,
            "sleeper": obj.total_sleeper,
            "driving": obj.total_driving,
            "on_duty": obj.total_on_duty,
        }

    def get_recap(self, obj: DailyLogSheet) -> dict[str, float]:
        return {
            "on_duty_today": float(obj.recap_on_duty_today),
            "cycle_used": float(obj.recap_cycle_used),
            "cycle_available": float(obj.recap_cycle_available),
        }
