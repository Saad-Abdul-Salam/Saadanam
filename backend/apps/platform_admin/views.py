from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.utils import timezone

from apps.shops.models import Shop
from apps.shops.serializers import ShopSerializer
from apps.accounts.models import User


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

        return Response({"message": f"{shop.business_name} approved."})


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