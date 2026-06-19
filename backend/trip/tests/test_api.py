from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


class HealthAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_returns_ok_with_database(self):
        response = self.client.get(reverse("health"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["status"], "ok")
        self.assertEqual(response.json()["database"], "ok")


class TripPlanAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("trip-plan")

    def test_plan_rejects_invalid_payload(self):
        response = self.client.post(
            self.url,
            {
                "current_location": "Green Bay",
                "pickup_location": "Fond du Lac, WI",
                "dropoff_location": "Edwardsville, IL",
                "current_cycle_used": 32,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("trip.views.trip.TripPlannerService.create_plan")
    def test_plan_returns_created_payload(self, mock_create_plan):
        mock_create_plan.return_value = {
            "id": "00000000-0000-0000-0000-000000000001",
            "summary": {
                "current_location": "Green Bay, WI",
                "pickup_location": "Fond du Lac, WI",
                "dropoff_location": "Edwardsville, IL",
                "total_miles": 100.0,
                "total_days": 1,
                "fuel_stops": 0,
                "current_cycle_used": 32.0,
                "projected_cycle_used": 40.0,
                "cycle_available": 30.0,
            },
            "route": {"polyline": [], "legs": []},
            "instructions": [],
            "stops": [],
            "log_sheets": [],
            "meta": {"engine": "hos", "status": "completed"},
        }

        response = self.client.post(
            self.url,
            {
                "current_location": "Green Bay, WI",
                "pickup_location": "Fond du Lac, WI",
                "dropoff_location": "Edwardsville, IL",
                "current_cycle_used": 32,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["id"], mock_create_plan.return_value["id"])
        mock_create_plan.assert_called_once()

    @patch("trip.views.trip.TripPlannerService.create_plan")
    def test_plan_maps_routing_error_to_400(self, mock_create_plan):
        from trip.exceptions import RoutingError

        mock_create_plan.side_effect = RoutingError("Dropoff location could not be found.")

        response = self.client.post(
            self.url,
            {
                "current_location": "Green Bay, WI",
                "pickup_location": "Fond du Lac, WI",
                "dropoff_location": "Edwardsville, IL",
                "current_cycle_used": 32,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Dropoff", response.json()["detail"])


class TripPlanUpdateAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.trip_id = "00000000-0000-0000-0000-000000000001"
        self.url = reverse("trip-detail", kwargs={"trip_id": self.trip_id})

    @patch("trip.views.trip.TripPlannerService.update_plan")
    def test_update_returns_payload(self, mock_update_plan):
        mock_update_plan.return_value = {
            "id": self.trip_id,
            "summary": {
                "current_location": "Green Bay, WI",
                "pickup_location": "Fond du Lac, WI",
                "dropoff_location": "Edwardsville, IL",
                "total_miles": 100.0,
                "total_days": 1,
                "fuel_stops": 0,
                "current_cycle_used": 32.0,
                "projected_cycle_used": 40.0,
                "cycle_available": 30.0,
            },
            "route": {"polyline": [], "legs": []},
            "instructions": [],
            "stops": [],
            "log_sheets": [],
            "meta": {"engine": "hos", "status": "completed"},
        }

        response = self.client.put(
            self.url,
            {
                "current_location": "Green Bay, WI",
                "pickup_location": "Fond du Lac, WI",
                "dropoff_location": "Edwardsville, IL",
                "current_cycle_used": 32,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["id"], self.trip_id)
        mock_update_plan.assert_called_once()
