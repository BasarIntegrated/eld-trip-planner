from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from trip.exceptions import RoutingError
from trip.services.routing import RouteService
from trip.utils.geocode_validation import (
    geocode_not_found_error,
    is_acceptable_city_result,
    parse_city_state,
)

GREEN_BAY_NOMINATIM = [
    {
        "lat": "44.5126379",
        "lon": "-88.0125794",
        "class": "boundary",
        "type": "administrative",
        "addresstype": "city",
        "name": "Green Bay",
        "address": {
            "city": "Green Bay",
            "state": "Wisconsin",
            "country_code": "us",
            "ISO3166-2-lvl4": "US-WI",
        },
    }
]

CEBU_RESTAURANT_NOMINATIM = [
    {
        "lat": "40.6218894",
        "lon": "-74.0315305",
        "class": "amenity",
        "type": "restaurant",
        "addresstype": "amenity",
        "name": "Cebu",
        "address": {
            "amenity": "Cebu",
            "city": "New York",
            "state": "New York",
            "country_code": "us",
            "ISO3166-2-lvl4": "US-NY",
        },
    }
]


def mock_nominatim_response(payload: list[dict]) -> MagicMock:
    response = MagicMock()
    response.raise_for_status.return_value = None
    response.json.return_value = payload
    return response


class ParseCityStateTests(SimpleTestCase):
    def test_parses_valid_city_state(self):
        self.assertEqual(parse_city_state("Green Bay, WI"), ("Green Bay", "WI"))
        self.assertEqual(parse_city_state("  Fond du Lac, wi  "), ("Fond du Lac", "WI"))
        self.assertEqual(parse_city_state("Edwardsville, IL"), ("Edwardsville", "IL"))

    def test_rejects_cebu_city_without_state(self):
        with self.assertRaises(RoutingError) as ctx:
            parse_city_state("Cebu City")
        self.assertIn("Cebu City", str(ctx.exception))
        self.assertIn("City, ST", str(ctx.exception))

    def test_rejects_invalid_state_code(self):
        with self.assertRaises(RoutingError):
            parse_city_state("Chicago, XX")

    def test_rejects_three_letter_state(self):
        with self.assertRaises(RoutingError):
            parse_city_state("Chicago, WIS")

    def test_rejects_empty_city(self):
        with self.assertRaises(RoutingError):
            parse_city_state(", WI")

    def test_accepts_dc(self):
        self.assertEqual(parse_city_state("Washington, DC"), ("Washington", "DC"))


class AcceptableCityResultTests(SimpleTestCase):
    def test_accepts_administrative_city(self):
        item = GREEN_BAY_NOMINATIM[0]
        self.assertTrue(is_acceptable_city_result(item, "Green Bay", "WI"))

    def test_accepts_town_result(self):
        item = {
            "class": "boundary",
            "type": "administrative",
            "addresstype": "town",
            "name": "Fond du Lac",
            "address": {
                "town": "Fond du Lac",
                "country_code": "us",
                "ISO3166-2-lvl4": "US-WI",
            },
        }
        self.assertTrue(is_acceptable_city_result(item, "Fond du Lac", "WI"))

    def test_rejects_cebu_city_restaurant_match(self):
        item = CEBU_RESTAURANT_NOMINATIM[0]
        self.assertFalse(is_acceptable_city_result(item, "Cebu City", "NY"))

    def test_rejects_wrong_state(self):
        item = {
            "class": "boundary",
            "type": "administrative",
            "addresstype": "city",
            "name": "Chicago",
            "address": {
                "city": "Chicago",
                "country_code": "us",
                "ISO3166-2-lvl4": "US-IL",
            },
        }
        self.assertFalse(is_acceptable_city_result(item, "Chicago", "WI"))

    def test_rejects_fuzzy_hamlet_name(self):
        item = {
            "class": "place",
            "type": "hamlet",
            "addresstype": "hamlet",
            "name": "Little Chicago",
            "address": {
                "hamlet": "Little Chicago",
                "country_code": "us",
                "ISO3166-2-lvl4": "US-WI",
            },
        }
        self.assertFalse(is_acceptable_city_result(item, "Chicago", "WI"))

    def test_rejects_non_us_country(self):
        item = {
            "class": "boundary",
            "type": "administrative",
            "addresstype": "city",
            "name": "Cebu City",
            "address": {
                "city": "Cebu City",
                "country_code": "ph",
                "ISO3166-2-lvl4": "PH-CEB",
            },
        }
        self.assertFalse(is_acceptable_city_result(item, "Cebu City", "NY"))


class GeocodeNotFoundErrorTests(SimpleTestCase):
    def test_error_message_includes_query_and_format_hint(self):
        error = geocode_not_found_error("Cebu City, NY")
        self.assertIn('Could not find a US location for "Cebu City, NY"', str(error))
        self.assertIn("Green Bay, WI", str(error))


class RouteServiceGeocodeTests(SimpleTestCase):
    @patch("trip.services.routing.httpx.get")
    def test_geocode_returns_city_state_point_for_valid_match(self, mock_get):
        mock_get.return_value = mock_nominatim_response(GREEN_BAY_NOMINATIM)

        point = RouteService().geocode("Green Bay, WI")

        self.assertEqual(point.name, "Green Bay, WI")
        self.assertAlmostEqual(point.lat, 44.5126379)
        self.assertAlmostEqual(point.lng, -88.0125794)
        mock_get.assert_called_once()
        params = mock_get.call_args.kwargs["params"]
        self.assertEqual(params["city"], "Green Bay")
        self.assertEqual(params["state"], "WI")
        self.assertEqual(params["country"], "USA")

    @patch("trip.services.routing.httpx.get")
    def test_geocode_rejects_cebu_city_without_state_before_api_call(self, mock_get):
        with self.assertRaises(RoutingError) as ctx:
            RouteService().geocode("Cebu City")

        self.assertIn("Cebu City", str(ctx.exception))
        mock_get.assert_not_called()

    @patch("trip.services.routing.httpx.get")
    def test_geocode_rejects_cebu_city_ny_when_nominatim_returns_empty(self, mock_get):
        mock_get.return_value = mock_nominatim_response([])

        with self.assertRaises(RoutingError) as ctx:
            RouteService().geocode("Cebu City, NY")

        self.assertIn("Cebu City, NY", str(ctx.exception))
        mock_get.assert_called_once()

    @patch("trip.services.routing.httpx.get")
    def test_geocode_rejects_restaurant_result_for_cebu_city_ny(self, mock_get):
        mock_get.return_value = mock_nominatim_response(CEBU_RESTAURANT_NOMINATIM)

        with self.assertRaises(RoutingError) as ctx:
            RouteService().geocode("Cebu City, NY")

        self.assertIn("Cebu City, NY", str(ctx.exception))

    @patch("trip.services.routing.httpx.get")
    def test_geocode_rejects_chicago_wi_hamlet_fuzzy_match(self, mock_get):
        mock_get.return_value = mock_nominatim_response(
            [
                {
                    "lat": "45.0473188",
                    "lon": "-89.8446167",
                    "class": "place",
                    "type": "hamlet",
                    "addresstype": "hamlet",
                    "name": "Little Chicago",
                    "address": {
                        "hamlet": "Little Chicago",
                        "country_code": "us",
                        "ISO3166-2-lvl4": "US-WI",
                    },
                }
            ]
        )

        with self.assertRaises(RoutingError):
            RouteService().geocode("Chicago, WI")
