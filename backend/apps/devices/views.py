from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import DeviceSession
from .serializers import DeviceSessionSerializer, ShopDeviceSessionSerializer
from apps.accounts.models import User


class IsPlatformAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == User.ROLE_PLATFORM_ADMIN


class MyDevicesView(generics.ListAPIView):
    """Shop owner's own devices — 'My Devices' page."""
    serializer_class = DeviceSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DeviceSession.objects.filter(user=self.request.user, is_active=True)


class LogoutDeviceView(APIView):
    """Shop owner logging out one of their own other devices."""
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = DeviceSession.objects.get(id=session_id, user=request.user)
        except DeviceSession.DoesNotExist:
            return Response({"error": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

        session.is_active = False
        session.save()
        return Response({"message": "Device logged out."})


class AllShopDevicesView(generics.ListAPIView):
    """Platform admin view — every active session, across every shop."""
    serializer_class = ShopDeviceSessionSerializer
    permission_classes = [IsPlatformAdmin]

    def get_queryset(self):
        return DeviceSession.objects.filter(
            is_active=True, user__role=User.ROLE_SHOP_OWNER
        ).select_related('user', 'user__shop')


class ForceLogoutDeviceView(APIView):
    """Platform admin force-logging out any shop's device."""
    permission_classes = [IsPlatformAdmin]

    def post(self, request, session_id):
        try:
            session = DeviceSession.objects.get(id=session_id)
        except DeviceSession.DoesNotExist:
            return Response({"error": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

        session.is_active = False
        session.save()
        return Response({"message": "Device force-logged-out."})