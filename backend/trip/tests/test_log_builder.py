from datetime import date, datetime, time, timedelta

from django.test import SimpleTestCase

from trip.domain.entities import RouteLegResult, RouteResult, RouteSample, SimulationResult, TripEvent
from trip.services.hos import HOSSimulator
from trip.services.logs import LogSheetBuilder
from trip.tests.test_hos import make_route
from trip.utils.time import hhmm_to_minutes
from trip.utils.trip_timezone import trip_local_datetime


class LogBuilderTests(SimpleTestCase):
    def test_builds_multiple_daily_log_sheets(self):
        start = trip_local_datetime(date(2026, 6, 17), 6, 30)
        day_two = start + timedelta(days=1)

        route = RouteResult(
            polyline=[[41.0, -87.0], [39.0, -90.0]],
            legs=[
                RouteLegResult("Chicago, IL", "St. Louis, MO", 300, 5.5),
                RouteLegResult("St. Louis, MO", "Dallas, TX", 500, 8.0),
            ],
            total_miles=800,
            samples=[
                RouteSample(0, 41.0, -87.0, "Chicago, IL"),
                RouteSample(300, 38.6, -90.2, "St. Louis, MO"),
                RouteSample(800, 32.8, -96.8, "Dallas, TX"),
            ],
            pickup_miles=300,
            dropoff_miles=800,
        )

        simulation = SimulationResult(route=route, current_cycle_used=20, now=start)
        simulation.events = [
            TripEvent("on_duty", start, start + timedelta(hours=1), "Chicago, IL", "Pre-trip", 41.0, -87.0),
            TripEvent(
                "driving",
                start + timedelta(hours=1),
                day_two + timedelta(hours=2),
                "En route",
                "Driving",
                39.0,
                -90.0,
                miles=500,
            ),
            TripEvent(
                "on_duty",
                day_two + timedelta(hours=2),
                day_two + timedelta(hours=3),
                "Dallas, TX",
                "Dropoff",
                32.8,
                -96.8,
            ),
        ]

        sheets = LogSheetBuilder().build(simulation)
        self.assertEqual(len(sheets), 2)
        self.assertEqual(sheets[1]["date"], day_two.date().isoformat())

    def test_demo_route_preserves_on_duty_activities_and_24_hour_grid(self):
        simulation = HOSSimulator().run(make_route(total_miles=478.9, pickup_miles=75.0), 0)
        sheet = LogSheetBuilder().build(simulation)[0]
        totals = sheet["totals"]

        self.assertEqual(totals["on_duty"], "3:00")
        self.assertEqual(
            sum(hhmm_to_minutes(totals[key]) for key in totals),
            24 * 60,
        )

        on_duty_remarks = [
            segment["remark"]
            for segment in sheet["segments"]
            if segment["status"] == "on_duty" and segment["remark"]
        ]
        self.assertIn("Pre-trip inspection", on_duty_remarks[0])
        self.assertTrue(any("Pickup" in remark for remark in on_duty_remarks))
        self.assertTrue(any("Dropoff" in remark for remark in on_duty_remarks))
        self.assertTrue(any("Post-trip" in remark for remark in on_duty_remarks))

    def test_summary_cycle_matches_last_log_sheet_recap(self):
        simulation = HOSSimulator().run(make_route(total_miles=478.9, pickup_miles=75.0), 0)
        sheets = LogSheetBuilder().build(simulation)
        from trip.domain.payload import TripPlanPayload
        from trip.domain.entities import TripRequest

        payload = TripPlanPayload.from_planning(
            TripRequest("Green Bay, WI", "Fond du Lac, WI", "Edwardsville, IL", 0),
            simulation.route,
            simulation,
            sheets,
        )
        self.assertEqual(
            payload.summary["projected_cycle_used"],
            sheets[-1]["recap"]["cycle_used"],
        )
