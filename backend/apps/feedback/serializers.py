from rest_framework import serializers
from .models import Ticket, TicketReply


class TicketReplySerializer(serializers.ModelSerializer):
    senderName = serializers.CharField(source='sender.full_name', read_only=True)
    senderRole = serializers.CharField(source='sender.role', read_only=True)

    class Meta:
        model = TicketReply
        fields = ['id', 'message', 'senderName', 'senderRole', 'created_at']


class TicketSerializer(serializers.ModelSerializer):
    date = serializers.SerializerMethodField()
    replies = TicketReplySerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = ['id', 'subject', 'message', 'status', 'date', 'replies']

    def get_date(self, obj):
        return obj.created_at.strftime('%Y-%m-%d')


class AdminTicketSerializer(serializers.ModelSerializer):
    """Used on the platform-admin Feedback Inbox — includes which shop it's from."""
    shop = serializers.CharField(source='shop.business_name', read_only=True)
    date = serializers.SerializerMethodField()
    replies = TicketReplySerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = ['id', 'shop', 'subject', 'message', 'status', 'date', 'replies']

    def get_date(self, obj):
        return obj.created_at.strftime('%Y-%m-%d')