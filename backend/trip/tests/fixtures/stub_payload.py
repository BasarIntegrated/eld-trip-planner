"""Stub payload for unit tests."""

from __future__ import annotations

from typing import Any


def build_stub_trip_plan(
    *,
    current_location: str,
    pickup_location: str,
    dropoff_location: str,
    current_cycle_used: float,
) -> dict[str, Any]:
    on_duty_today = 10.5
    cycle_used = round(current_cycle_used + on_duty_today, 1)

    return {
        "summary": {
            "current_location": current_location,
            "pickup_location": pickup_location,
            "dropoff_location": dropoff_location,
            "total_miles": 472,
            "total_days": 1,
            "fuel_stops": 0,
            "current_cycle_used": current_cycle_used,
            "projected_cycle_used": cycle_used,
            "cycle_available": round(70 - cycle_used, 1),
        },
        "route": {
            "polyline": [
                [44.5133, -88.0133],
                [43.7730, -88.4470],
                [41.0793, -87.8612],
                [38.8114, -89.9531],
            ],
            "legs": [
                {"from": current_location, "to": pickup_location, "miles": 120},
                {"from": pickup_location, "to": dropoff_location, "miles": 352},
            ],
        },
        "instructions": [
            f"Begin trip at {current_location}.",
            "Complete 30-minute pre-trip inspection.",
        ],
        "stops": [
            {
                "type": "start",
                "label": "Trip start",
                "location": current_location,
                "lat": 44.5133,
                "lng": -88.0133,
                "time": "06:30",
            },
            {
                "type": "pickup",
                "label": "Pickup",
                "location": pickup_location,
                "lat": 43.7730,
                "lng": -88.4470,
                "time": "08:00",
                "duration_minutes": 60,
            },
        ],
        "log_sheets": [
            {
                "date": "2026-06-16",
                "from_location": current_location,
                "to_location": dropoff_location,
                "total_miles_driving": 472,
                "truck_number": "T-1042",
                "trailer_number": "TR-8831",
                "shipper": "Don's Paper Company",
                "commodity": "Paper products",
                "segments": [
                    {"status": "off_duty", "start": "00:00", "end": "06:30", "remark": ""},
                    {
                        "status": "on_duty",
                        "start": "06:30",
                        "end": "07:00",
                        "remark": f"{current_location} - Pre-trip / TI",
                    },
                    {
                        "status": "driving",
                        "start": "07:00",
                        "end": "08:00",
                        "remark": "Driving",
                    },
                ],
                "totals": {
                    "off_duty": "6:30",
                    "sleeper": "0:00",
                    "driving": "1:00",
                    "on_duty": "0:30",
                },
                "recap": {
                    "on_duty_today": on_duty_today,
                    "cycle_used": cycle_used,
                    "cycle_available": round(70 - cycle_used, 1),
                },
            }
        ],
        "meta": {"engine": "stub", "assumptions": {}},
    }
