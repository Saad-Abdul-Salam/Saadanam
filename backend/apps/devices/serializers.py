from rest_framework import serializers
from .models import DeviceSession


class DeviceSessionSerializer(serializers.ModelSerializer):
    device = serializers.CharField(source='device_label')
    ip = serializers.CharField(source='ip_address')
    lastActive = serializers.DateTimeField(source='last_active')

    class Meta:
        model = DeviceSession
        fields = ['id', 'device', 'ip', 'lastActive', 'is_active']


class ShopDeviceSessionSerializer(serializers.ModelSerializer):
    """Used on the platform-admin Shop Devices page — includes which shop this belongs to."""
    device = serializers.CharField(source='device_label')
    ip = serializers.CharField(source='ip_address')
    lastActive = serializers.DateTimeField(source='last_active')
    shopName = serializers.SerializerMethodField()

    class Meta:
        model = DeviceSession
        fields = ['id', 'shopName', 'device', 'ip', 'lastActive', 'is_active']

    def get_shopName(self, obj):
        shop = getattr(obj.user, 'shop', None)
        return shop.business_name if shop else obj.user.full_name