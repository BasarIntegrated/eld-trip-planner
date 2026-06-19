"""HTTP endpoints for creating and retrieving trip plans."""

from rest_framework import status
from rest_framework.response import Response

from trip.domain.entities import TripRequest
from trip.exceptions import RoutingError, TripPlanNotFoundError
from trip.repositories.trip_plan import TripPlanRepository
from trip.serializers import TripPlanRequestSerializer
from trip.services.planner import TripPlannerService
from trip.views.base import PublicAPIView


class TripPlanView(PublicAPIView):
    """POST /trips — geocode, route, simulate HOS, and persist a new plan."""

    def post(self, request):
        serializer = TripPlanRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        trip_request = TripRequest(**serializer.validated_data)

        try:
            payload = TripPlannerService().create_plan(trip_request)
        except RoutingError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(payload, status=status.HTTP_201_CREATED)


class TripPlanDetailView(PublicAPIView):
    """GET /trips/<id> — return a previously saved plan by UUID."""

    def get(self, request, trip_id):
        try:
            payload = TripPlanRepository().get_serialized(trip_id)
        except TripPlanNotFoundError:
            return Response(
                {"detail": "Trip not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(payload)

    def put(self, request, trip_id):
        serializer = TripPlanRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        trip_request = TripRequest(**serializer.validated_data)

        try:
            payload = TripPlannerService().update_plan(trip_id, trip_request)
        except TripPlanNotFoundError:
            return Response(
                {"detail": "Trip not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except RoutingError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(payload, status=status.HTTP_200_OK)
