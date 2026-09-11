from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    time = serializers.SerializerMethodField()
    read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'time', 'read', 'created_at']

    def get_time(self, obj):
        return obj.created_at.strftime('%b %d, %Y')

    def get_read(self, obj):
        user = self.context['request'].user
        return obj.reads.filter(user=user).exists()


class SentNotificationSerializer(serializers.ModelSerializer):
    sentTo = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'sentTo', 'date']

    def get_sentTo(self, obj):
        shops = obj.target_shops.all()
        if not shops:
            return 'All shops'
        names = [s.business_name for s in shops]
        if len(names) <= 3:
            return ', '.join(names)
        return f"{', '.join(names[:3])} +{len(names) - 3} more"

    def get_date(self, obj):
        return obj.created_at.strftime('%Y-%m-%d')