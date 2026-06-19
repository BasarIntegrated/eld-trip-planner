from django.urls import path

from trip.views import HealthView, TripPlanDetailView, TripPlanView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("trip/plan/", TripPlanView.as_view(), name="trip-plan"),
    path("trip/<uuid:trip_id>/", TripPlanDetailView.as_view(), name="trip-detail"),
]
