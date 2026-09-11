from rest_framework import serializers
from .models import Product, PriceHistory


class ProductSerializer(serializers.ModelSerializer):
    minStock = serializers.DecimalField(source='min_stock', max_digits=10, decimal_places=2)
    lowStock = serializers.SerializerMethodField()
    margin = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'cost', 'margin', 'stock', 'minStock', 'lowStock', 'price_updated_at']

    def get_lowStock(self, obj):
        return obj.stock <= obj.min_stock

    def get_margin(self, obj):
        if obj.price <= 0:
            return 0
        return round(float((obj.price - obj.cost) / obj.price * 100), 2)


class PriceHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceHistory
        fields = ['id', 'old_price', 'new_price', 'changed_at', 'changed_by']