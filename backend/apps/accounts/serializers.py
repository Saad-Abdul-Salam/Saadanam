from rest_framework import serializers
from .models import User
from apps.shops.models import Shop


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    # shop fields — optional, only required for shop_owner registrations
    business_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    business_type = serializers.CharField(write_only=True, required=False, allow_blank=True)
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    gst_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    pan_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    tax_mode = serializers.ChoiceField(
        choices=Shop.TAX_MODE_CHOICES, write_only=True, required=False, default=Shop.TAX_MODE_INCLUSIVE
    )
    tax_rate = serializers.DecimalField(
        max_digits=5, decimal_places=2, write_only=True, required=False, default=0
    )
    tax_label = serializers.CharField(write_only=True, required=False, default='GST')

    class Meta:
        model = User
        fields = [
            'id', 'email', 'password', 'full_name', 'phone',
            'business_name', 'business_type', 'address', 'gst_number', 'pan_number',
            'tax_mode', 'tax_rate', 'tax_label',
        ]

    def create(self, validated_data):
        shop_fields = {
            'business_name': validated_data.pop('business_name', ''),
            'business_type': validated_data.pop('business_type', ''),
            'address': validated_data.pop('address', ''),
            'gst_number': validated_data.pop('gst_number', ''),
            'pan_number': validated_data.pop('pan_number', ''),
            'tax_mode': validated_data.pop('tax_mode', Shop.TAX_MODE_INCLUSIVE),
            'tax_rate': validated_data.pop('tax_rate', 0),
            'tax_label': validated_data.pop('tax_label', 'GST'),
        }

        user = User.objects.create_user(**validated_data)

        # Platform admin doesn't get a shop; only shop_owner does
        if user.role == User.ROLE_SHOP_OWNER:
            Shop.objects.create(owner=user, **shop_fields)

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'phone', 'role', 'is_approved', 'created_at']