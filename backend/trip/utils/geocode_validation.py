from __future__ import annotations

import re

from trip.exceptions import RoutingError

CITY_ST_PATTERN = re.compile(r"^(.+?),\s*([A-Za-z]{2})$")

US_STATE_CODES = frozenset(
    {
        "AL",
        "AK",
        "AZ",
        "AR",
        "CA",
        "CO",
        "CT",
        "DE",
        "DC",
        "FL",
        "GA",
        "HI",
        "ID",
        "IL",
        "IN",
        "IA",
        "KS",
        "KY",
        "LA",
        "ME",
        "MD",
        "MA",
        "MI",
        "MN",
        "MS",
        "MO",
        "MT",
        "NE",
        "NV",
        "NH",
        "NJ",
        "NM",
        "NY",
        "NC",
        "ND",
        "OH",
        "OK",
        "OR",
        "PA",
        "RI",
        "SC",
        "SD",
        "TN",
        "TX",
        "UT",
        "VT",
        "VA",
        "WA",
        "WV",
        "WI",
        "WY",
    }
)

ACCEPTABLE_PLACE_TYPES = frozenset({"city", "town", "village", "municipality"})


def geocode_not_found_error(query: str) -> RoutingError:
    return RoutingError(
        f'Could not find a US location for "{query}". '
        "Use City, ST format (e.g. Green Bay, WI)."
    )


def parse_city_state(query: str) -> tuple[str, str]:
    """Parse and validate ``City, ST`` input."""
    trimmed = query.strip()
    match = CITY_ST_PATTERN.match(trimmed)
    if not match:
        raise geocode_not_found_error(query)

    city = match.group(1).strip()
    state = match.group(2).upper()

    if not city:
        raise geocode_not_found_error(query)
    if state not in US_STATE_CODES:
        raise geocode_not_found_error(query)

    return city, state


def _normalize_name(value: str) -> str:
    return " ".join(value.strip().lower().split())


def _resolved_state_code(address: dict[str, str]) -> str | None:
    iso = address.get("ISO3166-2-lvl4")
    if iso and "-" in iso:
        return iso.split("-", 1)[1].upper()
    return None


def _resolved_city_names(item: dict) -> set[str]:
    address = item.get("address") or {}
    names = {
        item.get("name"),
        address.get("city"),
        address.get("town"),
        address.get("village"),
        address.get("municipality"),
    }
    return {_normalize_name(name) for name in names if name}


def is_acceptable_city_result(item: dict, city: str, state: str) -> bool:
    """True when Nominatim returned a US city/town that matches the query."""
    address = item.get("address") or {}
    if address.get("country_code", "").lower() != "us":
        return False

    place_class = item.get("class")
    if place_class in {"amenity", "highway", "shop", "tourism"}:
        return False

    addresstype = item.get("addresstype")
    place_type = item.get("type")
    if addresstype not in ACCEPTABLE_PLACE_TYPES and not (
        place_class == "place" and place_type in ACCEPTABLE_PLACE_TYPES
    ):
        return False

    resolved_state = _resolved_state_code(address)
    if resolved_state != state.upper():
        return False

    input_city = _normalize_name(city)
    if input_city not in _resolved_city_names(item):
        return False

    return True
