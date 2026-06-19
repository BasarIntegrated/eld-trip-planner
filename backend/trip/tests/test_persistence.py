import uuid

from django.test import TestCase

from trip.domain.payload import TripPlanPayload
from trip.exceptions import TripPlanNotFoundError
from trip.models import DailyLogSheet, LogSegment, RouteLeg, RouteStop, TripPlan
from trip.repositories.trip_plan import TripPlanRepository
from trip.serializers import TripPlanResponseSerializer
from trip.tests.fixtures.stub_payload import build_stub_trip_plan


class TripPersistenceTests(TestCase):
    def setUp(self):
        self.repository = TripPlanRepository()

    def test_save_creates_related_records(self):
        payload = TripPlanPayload(**build_stub_trip_plan(
            current_location="Green Bay, WI",
            pickup_location="Fond du Lac, WI",
            dropoff_location="Edwardsville, IL",
            current_cycle_used=32,
        ))

        trip = self.repository.save(payload)

        self.assertEqual(TripPlan.objects.count(), 1)
        self.assertEqual(RouteLeg.objects.filter(trip_plan=trip).count(), 2)
        self.assertEqual(RouteStop.objects.filter(trip_plan=trip).count(), 2)
        self.assertEqual(DailyLogSheet.objects.filter(trip_plan=trip).count(), 1)
        self.assertEqual(
            LogSegment.objects.filter(log_sheet__trip_plan=trip).count(),
            len(payload.log_sheets[0]["segments"]),
        )

    def test_serialize_matches_api_contract(self):
        payload = TripPlanPayload(**build_stub_trip_plan(
            current_location="Green Bay, WI",
            pickup_location="Fond du Lac, WI",
            dropoff_location="Edwardsville, IL",
            current_cycle_used=32,
        ))
        trip = self.repository.save(payload)
        response = self.repository.serialize(trip)

        self.assertIn("id", response)
        self.assertEqual(response["summary"]["total_miles"], 472)
        self.assertEqual(len(response["log_sheets"]), 1)
        self.assertEqual(response["log_sheets"][0]["segments"][0]["start"], "00:00")

        serializer = TripPlanResponseSerializer(trip)
        self.assertEqual(serializer.data["summary"], response["summary"])

    def test_get_by_id_raises_when_missing(self):
        with self.assertRaises(TripPlanNotFoundError):
            self.repository.get_by_id(uuid.uuid4())

    def test_update_replaces_related_records_and_keeps_id(self):
        payload = TripPlanPayload(**build_stub_trip_plan(
            current_location="Green Bay, WI",
            pickup_location="Fond du Lac, WI",
            dropoff_location="Edwardsville, IL",
            current_cycle_used=32,
        ))
        trip = self.repository.save(payload)
        trip_id = trip.id

        updated_payload = TripPlanPayload(**build_stub_trip_plan(
            current_location="Chicago, IL",
            pickup_location="Milwaukee, WI",
            dropoff_location="Indianapolis, IN",
            current_cycle_used=10,
        ))
        updated = self.repository.update(trip_id, updated_payload)

        self.assertEqual(updated.id, trip_id)
        self.assertEqual(TripPlan.objects.count(), 1)
        self.assertEqual(updated.current_location, "Chicago, IL")
        self.assertEqual(RouteLeg.objects.filter(trip_plan=updated).count(), 2)
        self.assertEqual(DailyLogSheet.objects.filter(trip_plan=updated).count(), 1)
