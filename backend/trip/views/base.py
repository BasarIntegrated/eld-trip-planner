from rest_framework.views import APIView


class PublicAPIView(APIView):
    """DRF view base for unauthenticated assessment endpoints."""

    authentication_classes = []
    permission_classes = []
