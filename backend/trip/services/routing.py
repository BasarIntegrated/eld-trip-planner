"""Geocoding (Nominatim) and driving routes (OSRM) for trip planning."""

from __future__ import annotations

import logging

import httpx

from trip.constants.routing import (
    GEOCODE_TIMEOUT_SECONDS,
    NOMINATIM_URL,
    OSRM_BASE_URL,
    ROUTE_TIMEOUT_SECONDS,
    ROUTING_USER_AGENT,
)
from trip.domain.entities import GeoPoint, RouteLegResult, RouteResult, RouteSample
from trip.exceptions import RoutingError
from trip.utils.geocode_validation import (
    geocode_not_found_error,
    is_acceptable_city_result,
    parse_city_state,
)


logger = logging.getLogger(__name__)


class RouteService:
    """Resolves city/state strings to coordinates and multi-stop driving routes."""

    def geocode(self, query: str) -> GeoPoint:
        """Look up a US city via Nominatim; raises RoutingError when not found."""
        city, state = parse_city_state(query)
        try:
            response = httpx.get(
                NOMINATIM_URL,
                params={
                    "city": city,
                    "state": state,
                    "country": "USA",
                    "format": "json",
                    "limit": 1,
                    "addressdetails": 1,
                },
                headers={"User-Agent": ROUTING_USER_AGENT},
                timeout=GEOCODE_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            logger.warning("Geocoding request failed for %r: %s", query, exc)
            raise RoutingError(
                "Location lookup is temporarily unavailable. Please try again."
            ) from exc

        results = response.json()
        if not results:
            raise geocode_not_found_error(query)

        item = results[0]
        if not is_acceptable_city_result(item, city, state):
            raise geocode_not_found_error(query)

        return GeoPoint(
            name=f"{city}, {state}",
            lat=float(item["lat"]),
            lng=float(item["lon"]),
        )

    def build_trip_route(
        self,
        current: GeoPoint,
        pickup: GeoPoint,
        dropoff: GeoPoint,
    ) -> RouteResult:
        """Route current → pickup → dropoff via OSRM; returns polyline, legs, and samples."""
        waypoints = [current, pickup, dropoff]
        coordinate_path = ";".join(f"{point.lng},{point.lat}" for point in waypoints)
        url = f"{OSRM_BASE_URL}/{coordinate_path}"

        try:
            response = httpx.get(
                url,
                params={"overview": "full", "geometries": "geojson", "steps": "false"},
                timeout=ROUTE_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            logger.warning("Routing request failed: %s", exc)
            raise RoutingError(
                "Routing service is temporarily unavailable. Please try again."
            ) from exc

        payload = response.json()
        if payload.get("code") != "Ok" or not payload.get("routes"):
            raise RoutingError("Routing service could not calculate the trip route.")

        osrm_route = payload["routes"][0]
        # OSRM returns [lng, lat]; flip to [lat, lng] for map display.
        polyline = [[lat, lng] for lng, lat in osrm_route["geometry"]["coordinates"]]
        legs = self._parse_legs(osrm_route["legs"], waypoints)
        pickup_miles = legs[0].miles if legs else 0.0
        dropoff_miles = sum(leg.miles for leg in legs)
        total_miles = round(osrm_route["distance"] * 0.000621371, 1)
        # Build samples in a second pass so location_label_at can use leg metadata.
        partial_route = RouteResult(
            polyline=polyline,
            legs=legs,
            total_miles=total_miles,
            samples=[],
            pickup_miles=pickup_miles,
            dropoff_miles=dropoff_miles,
        )
        samples = self._build_samples(polyline, legs, waypoints, partial_route)

        return RouteResult(
            polyline=polyline,
            legs=legs,
            total_miles=total_miles,
            samples=samples,
            pickup_miles=pickup_miles,
            dropoff_miles=dropoff_miles,
        )

    def _parse_legs(
        self,
        osrm_legs: list[dict],
        waypoints: list[GeoPoint],
    ) -> list[RouteLegResult]:
        """Map each OSRM leg to miles, duration, and named endpoints."""
        legs: list[RouteLegResult] = []
        for index, osrm_leg in enumerate(osrm_legs):
            legs.append(
                RouteLegResult(
                    from_location=waypoints[index].name,
                    to_location=waypoints[index + 1].name,
                    miles=round(osrm_leg["distance"] * 0.000621371, 1),
                    duration_hours=round(osrm_leg["duration"] / 3600, 2),
                )
            )
        return legs

    def _build_samples(
        self,
        polyline: list[list[float]],
        legs: list[RouteLegResult],
        waypoints: list[GeoPoint],
        route: RouteResult,
    ) -> list[RouteSample]:
        """Mile markers at waypoints plus 25/50/75% points for HOS interpolation."""
        if not polyline:
            return []

        samples = [
            RouteSample(0.0, polyline[0][0], polyline[0][1], waypoints[0].name),
        ]
        cumulative = 0.0
        for leg_index, leg in enumerate(legs):
            cumulative += leg.miles
            destination = waypoints[leg_index + 1]
            samples.append(
                RouteSample(
                    miles=round(cumulative, 1),
                    lat=destination.lat,
                    lng=destination.lng,
                    name=destination.name,
                )
            )

        # Mid-route samples help interpolate position between named cities.
        if len(polyline) > 2:
            total_miles = samples[-1].miles
            for fraction in (0.25, 0.5, 0.75):
                point_index = min(int(len(polyline) * fraction), len(polyline) - 1)
                lat, lng = polyline[point_index]
                mile_marker = round(total_miles * fraction, 1)
                samples.append(
                    RouteSample(
                        miles=mile_marker,
                        lat=lat,
                        lng=lng,
                        name=route.location_label_at(mile_marker),
                    )
                )

        samples.sort(key=lambda sample: sample.miles)
        return samples
