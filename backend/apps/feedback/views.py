from datetime import datetime, timezone as dt_timezone

from django.db.models import F, Q
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Ticket, TicketReply
from .serializers import TicketSerializer, AdminTicketSerializer, TicketReplySerializer
from apps.accounts.models import User

# Anything before this counts as "already seen" for a side that has never
# viewed the thread (null last_viewed_at).
EPOCH = datetime(2000, 1, 1, tzinfo=dt_timezone.utc)


def _unseen_tickets_for(user):
    """Tickets with a message the given user has not seen yet.

    - For a shop owner: their own tickets with an admin reply newer than
      their last view (their own ticket creation is never "new" to them).
    - For a platform admin: tickets that are brand new, or that have a
      shop-owner reply newer than the admin's last view.
    """
    if user.role == User.ROLE_PLATFORM_ADMIN:
        last_viewed = Coalesce(F('admin_last_viewed_at'), EPOCH)
        other_role = User.ROLE_SHOP_OWNER
        # A brand-new ticket is unseen to the admin until they open the inbox.
        return Ticket.objects.filter(
            Q(created_at__gt=last_viewed)
            | Q(
                replies__sender__role=other_role,
                replies__created_at__gt=last_viewed,
            )
        ).distinct()

    # Shop owner: only messages from the admin side count — a ticket they
    # created themselves is never "new" to them.
    last_viewed = Coalesce(F('shop_last_viewed_at'), EPOCH)
    return Ticket.objects.filter(
        shop=user.shop,
        replies__sender__role=User.ROLE_PLATFORM_ADMIN,
        replies__created_at__gt=last_viewed,
    ).distinct()


class IsPlatformAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == User.ROLE_PLATFORM_ADMIN


class IsShopOwner(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == User.ROLE_SHOP_OWNER


class MyTicketsView(generics.ListCreateAPIView):
    """Shop owner's Feedback & Support page."""
    serializer_class = TicketSerializer
    permission_classes = [IsShopOwner]

    def get_queryset(self):
        return Ticket.objects.filter(shop=self.request.user.shop)

    def list(self, request, *args, **kwargs):
        # Opening the Feedback page counts as viewing — clear the dot.
        response = super().list(request, *args, **kwargs)
        Ticket.objects.filter(shop=request.user.shop).update(
            shop_last_viewed_at=timezone.now()
        )
        return response

    def perform_create(self, serializer):
        serializer.save(
            shop=self.request.user.shop,
            created_by=self.request.user,
            updated_by=self.request.user,
        )


class AllTicketsView(generics.ListAPIView):
    """Platform admin Feedback Inbox — every shop's tickets."""
    serializer_class = AdminTicketSerializer
    permission_classes = [IsPlatformAdmin]
    queryset = Ticket.objects.all().prefetch_related('replies')

    def list(self, request, *args, **kwargs):
        # Opening the inbox counts as viewing — clear the dot.
        response = super().list(request, *args, **kwargs)
        Ticket.objects.all().update(admin_last_viewed_at=timezone.now())
        return response


class ReplyToTicketView(APIView):
    permission_classes = [IsAuthenticated]  # both admin replying and shop owner replying use this

    def post(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return Response({"error": "Ticket not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == User.ROLE_SHOP_OWNER and ticket.shop_id != request.user.shop_id:
            return Response({"error": "Not your ticket."}, status=status.HTTP_403_FORBIDDEN)

        message = request.data.get('message')
        if not message:
            return Response({"error": "message is required."}, status=status.HTTP_400_BAD_REQUEST)

        reply = TicketReply.objects.create(ticket=ticket, sender=request.user, message=message)

        # The person who just replied is obviously viewing the thread — mark their side seen.
        if request.user.role == User.ROLE_PLATFORM_ADMIN:
            ticket.admin_last_viewed_at = timezone.now()
        else:
            ticket.shop_last_viewed_at = timezone.now()
        ticket.save(update_fields=['admin_last_viewed_at', 'shop_last_viewed_at'])

        return Response(TicketReplySerializer(reply).data, status=status.HTTP_201_CREATED)


class UnseenTicketCountView(APIView):
    """Count of tickets with a message the current user hasn't seen yet.

    Used by the sidebar dot — it only lights up when a new message arrives,
    and clears once the user opens the feedback page.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = _unseen_tickets_for(request.user).count()
        return Response({"unseen": count})

class MarkTicketResolvedView(APIView):
    permission_classes = [IsPlatformAdmin]

    def post(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return Response({"error": "Ticket not found."}, status=status.HTTP_404_NOT_FOUND)

        ticket.status = Ticket.STATUS_RESOLVED
        ticket.save()
        return Response({"message": "Marked resolved."})