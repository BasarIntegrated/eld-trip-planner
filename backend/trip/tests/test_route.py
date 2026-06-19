from django.test import SimpleTestCase

from trip.domain.entities import RouteLegResult, RouteResult, RouteSample


class RouteResultTests(SimpleTestCase):
    def setUp(self):
        self.route = RouteResult(
            polyline=[[44.5, -88.0], [43.8, -88.4], [38.8, -90.2]],
            legs=[
                RouteLegResult("Green Bay, WI", "Fond du Lac, WI", 76.0, 1.4),
                RouteLegResult("Fond du Lac, WI", "Edwardsville, IL", 404.0, 7.3),
            ],
            total_miles=480.0,
            samples=[
                RouteSample(0, 44.5, -88.0, "Green Bay, WI"),
                RouteSample(76, 43.8, -88.4, "Fond du Lac, WI"),
                RouteSample(480, 38.8, -90.2, "Edwardsville, IL"),
            ],
            pickup_miles=76.0,
            dropoff_miles=480.0,
        )

    def test_location_label_at_start_of_leg(self):
        self.assertEqual(self.route.location_label_at(10), "Green Bay, WI")

    def test_location_label_at_end_of_leg(self):
        self.assertEqual(self.route.location_label_at(450), "Edwardsville, IL")

    def test_location_label_at_corridor_uses_city_names(self):
        label = self.route.location_label_at(240)
        self.assertIn("corridor", label)
        self.assertNotIn("En route", label)

    def test_driving_minutes_follow_osrm_leg_durations(self):
        first_leg_minutes = self.route.driving_minutes_between(0, 76)
        self.assertEqual(first_leg_minutes, 84)

        second_leg_minutes = self.route.driving_minutes_between(76, 480)
        self.assertEqual(second_leg_minutes, 438)

    def test_effective_mph_matches_leg_average(self):
        self.assertAlmostEqual(self.route.effective_mph_at(40), 76 / 1.4, places=1)
        self.assertAlmostEqual(self.route.effective_mph_at(200), 404 / 7.3, places=1)
