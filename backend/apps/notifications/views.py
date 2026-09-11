from django.db.models import Q
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Notification, NotificationRead
from .serializers import NotificationSerializer, SentNotificationSerializer
from apps.accounts.models import User
from apps.shops.models import Shop


class IsPlatformAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == User.ROLE_PLATFORM_ADMIN


class IsShopOwner(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == User.ROLE_SHOP_OWNER


def _visible_notifications(user):
    """Notifications a shop owner can see: broadcasts (no target) + ones aimed at their shop."""
    return Notification.objects.filter(
        Q(target_shops=None) | Q(target_shops=user.shop)
    ).distinct()


class MyNotificationsView(generics.ListAPIView):
    """Shop owner's notification feed — broadcasts + targeted messages."""
    serializer_class = NotificationSerializer
    permission_classes = [IsShopOwner]

    def get_queryset(self):
        return _visible_notifications(self.request.user)

    def get_serializer_context(self):
        return {'request': self.request}

class UnreadNotificationCountView(APIView):
    permission_classes = [IsShopOwner]

    def get(self, request):
        visible = _visible_notifications(request.user)
        total = visible.count()
        read_count = NotificationRead.objects.filter(
            user=request.user, notification__in=visible
        ).count()
        return Response({"unread": max(0, total - read_count)})


class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsShopOwner]

    def post(self, request):
        unread_ids = _visible_notifications(request.user).exclude(
            reads__user=request.user
        ).values_list('id', flat=True)

        NotificationRead.objects.bulk_create([
            NotificationRead(notification_id=nid, user=request.user) for nid in unread_ids
        ], ignore_conflicts=True)

        return Response({"message": "All marked as read."})


class MarkNotificationReadView(APIView):
    permission_classes = [IsShopOwner]

    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id)
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        NotificationRead.objects.get_or_create(notification=notification, user=request.user)
        return Response({"message": "Marked as read."})


class SendNotificationView(generics.ListCreateAPIView):
    """Platform admin: view sent history + send a new one.

    POST accepts an optional `shop_ids` list. Empty/absent = broadcast to all
    shops; otherwise only the listed shops see it.
    """
    permission_classes = [IsPlatformAdmin]
    queryset = Notification.objects.all()

    def get_serializer_class(self):
        return SentNotificationSerializer

    def create(self, request, *args, **kwargs):
        shop_ids = request.data.get('shop_ids')

        if shop_ids:
            if isinstance(shop_ids, (int, str)):
                shop_ids = [shop_ids]
            if not isinstance(shop_ids, list) or not all(isinstance(i, (int, str)) for i in shop_ids):
                return Response(
                    {"error": "shop_ids must be a list of shop ids."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            valid = set(Shop.objects.filter(id__in=shop_ids).values_list('id', flat=True))
            invalid = [i for i in shop_ids if int(i) not in valid]
            if invalid:
                return Response(
                    {"error": f"Unknown shop ids: {invalid}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        notification = Notification.objects.create(
            type=request.data.get('type', 'announcement'),
            title=request.data.get('title', ''),
            message=request.data.get('message', ''),
            sent_by=request.user,
        )
        if shop_ids:
            notification.target_shops.set(Shop.objects.filter(id__in=shop_ids))

        return Response(
            SentNotificationSerializer(notification).data,
            status=status.HTTP_201_CREATED,
        )