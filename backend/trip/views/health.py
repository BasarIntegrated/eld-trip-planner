from django.db import connection
from django.db.utils import OperationalError
from rest_framework import status
from rest_framework.response import Response

from trip.views.base import PublicAPIView


class HealthView(PublicAPIView):
    def get(self, request):
        try:
            connection.ensure_connection()
        except OperationalError:
            return Response(
                {"status": "error", "database": "unavailable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({"status": "ok", "database": "ok"})
