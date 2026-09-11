from rest_framework import serializers
from .models import Shop


class ShopRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = [
            'business_name', 'business_type', 'address',
            'gst_number', 'pan_number',
            'tax_mode', 'tax_rate', 'tax_label',
        ]


class ShopSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    owner_phone = serializers.CharField(source='owner.phone', read_only=True)
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = [
            'id', 'business_name', 'business_type', 'address',
            'gst_number', 'pan_number', 'tax_mode', 'tax_rate', 'tax_label',
            'status', 'invoice_prefix', 'currency', 'logo', 'logo_url',
            'created_at', 'approved_at',
            'owner_name', 'owner_email', 'owner_phone',
        ]

    def get_logo_url(self, obj):
        if not obj.logo:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.logo.url)
        return obj.logo.url