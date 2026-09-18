import logging

from django.conf import settings
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.utils import timezone

from apps.core.emails import send_email
from apps.shops.models import Shop
from apps.shops.serializers import ShopSerializer
from apps.accounts.models import User

logger = logging.getLogger(__name__)

APPROVED_SUBJECT = 'Your Saadanam account has been approved'


class IsPlatformAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.ROLE_PLATFORM_ADMIN
        )


class ShopListView(generics.ListAPIView):
    """All shops — platform admin only."""
    serializer_class = ShopSerializer
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    queryset = Shop.objects.all().order_by(
        'status', '-created_at'
    )


class PendingShopsView(generics.ListAPIView):
    serializer_class = ShopSerializer
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    queryset = Shop.objects.filter(status=Shop.STATUS_PENDING).order_by('-created_at')


class ApproveShopView(APIView):
    permission_classes = [IsAuthenticated, IsPlatformAdmin]

    def post(self, request, shop_id):
        try:
            shop = Shop.objects.get(id=shop_id)
        except Shop.DoesNotExist:
            return Response({"error": "Shop not found."}, status=status.HTTP_404_NOT_FOUND)

        shop.status = Shop.STATUS_APPROVED
        shop.approved_at = timezone.now()
        shop.approved_by = request.user
        shop.save()

        shop.owner.is_approved = True
        shop.owner.save()

        self._send_approval_email(shop)

        return Response({"message": f"{shop.business_name} approved."})

    @staticmethod
    def _send_approval_email(shop):
        """Best-effort confirmation email — approval must succeed even if
        sending fails (email delivery is not guaranteed), so failures are
        logged and swallowed."""
        login_url = settings.FRONTEND_URL.rstrip('/') + '/login'
        body = (
            f'Hi {shop.owner.full_name}, your Saadanam shop owner account has '
            f'been approved. You can now log in and start managing your shop: '
            f'{login_url}'
        )
        try:
            send_email(shop.owner.email, APPROVED_SUBJECT, body)
        except Exception:  # noqa: BLE001 — network/HTTP/auth errors all count
            logger.exception(
                'Failed to send approval email for shop id=%s (owner=%s)',
                shop.id, shop.owner.email,
            )


class RejectShopView(APIView):
    permission_classes = [IsAuthenticated, IsPlatformAdmin]

    def post(self, request, shop_id):
        try:
            shop = Shop.objects.get(id=shop_id)
        except Shop.DoesNotExist:
            return Response({"error": "Shop not found."}, status=status.HTTP_404_NOT_FOUND)

        shop.status = Shop.STATUS_REJECTED
        shop.save()

        return Response({"message": f"{shop.business_name} rejected."})


class SuspendShopView(APIView):
    permission_classes = [IsAuthenticated, IsPlatformAdmin]

    def post(self, request, shop_id):
        try:
            shop = Shop.objects.get(id=shop_id)
        except Shop.DoesNotExist:
            return Response({"error": "Shop not found."}, status=status.HTTP_404_NOT_FOUND)

        shop.status = Shop.STATUS_SUSPENDED
        shop.save()

        shop.owner.is_approved = False
        shop.owner.save()

        return Response({"message": f"{shop.business_name} suspended."})


class ActivateShopView(APIView):
    permission_classes = [IsAuthenticated, IsPlatformAdmin]

    def post(self, request, shop_id):
        try:
            shop = Shop.objects.get(id=shop_id)
        except Shop.DoesNotExist:
            return Response({"error": "Shop not found."}, status=status.HTTP_404_NOT_FOUND)

        shop.status = Shop.STATUS_APPROVED
        shop.save()

        shop.owner.is_approved = True
        shop.owner.save()

        return Response({"message": f"{shop.business_name} activated."})


class PlatformDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsPlatformAdmin]

    def get(self, request):
        return Response({
            "total_shops": Shop.objects.count(),
            "active_shops": Shop.objects.filter(status=Shop.STATUS_APPROVED).count(),
            "pending_approvals": Shop.objects.filter(status=Shop.STATUS_PENDING).count(),
            "suspended_shops": Shop.objects.filter(status=Shop.STATUS_SUSPENDED).count(),
        })