CYCLE_LIMIT_HOURS = 70
FUEL_INTERVAL_MILES = 1000
PICKUP_MINUTES = 60
DROPOFF_MINUTES = 60

CARRIER_NAME = "Spotter Freight Co."
MAIN_OFFICE_ADDRESS = "200 Transport Way, Green Bay, WI 54301"

DEFAULT_TRUCK_NUMBER = "T-1042"
DEFAULT_TRAILER_NUMBER = "TR-8831"
DEFAULT_SHIPPER = "Spotter Freight Co."
DEFAULT_COMMODITY = "General freight"

ASSESSMENT_ASSUMPTIONS = {
    "driver_type": "property-carrying",
    "cycle_rule": "70 hours / 8 days",
    "fuel_interval_miles": FUEL_INTERVAL_MILES,
    "pickup_minutes": PICKUP_MINUTES,
    "dropoff_minutes": DROPOFF_MINUTES,
    "adverse_conditions": False,
}
