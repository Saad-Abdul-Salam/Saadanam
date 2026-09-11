from decimal import Decimal

from rest_framework import serializers
from .models import Purchase, PurchaseItem
from apps.products.models import Product


class PurchaseItemSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    productName = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = PurchaseItem
        fields = ['id', 'product', 'productName', 'qty', 'cost']


class PurchaseSerializer(serializers.ModelSerializer):
    items = PurchaseItemSerializer(many=True)
    supplierName = serializers.CharField(source='supplier.name', read_only=True)

    class Meta:
        model = Purchase
        fields = ['id', 'supplier', 'supplierName', 'date', 'items', 'total', 'status']
        read_only_fields = ['total', 'status']

    def validate(self, attrs):
        """Keep every purchase inside the caller's own shop (no cross-tenant refs)."""
        shop = self.context['request'].user.shop

        supplier = attrs.get('supplier')
        if supplier is not None and supplier.shop_id != shop.id:
            raise serializers.ValidationError({"supplier": "Supplier does not belong to your shop."})

        for item in attrs.get('items', []):
            product = item['product']
            if product.shop_id != shop.id:
                raise serializers.ValidationError(
                    {"items": f"Product \"{product.name}\" does not belong to your shop."}
                )

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        shop = self.context['request'].user.shop
        user = self.context['request'].user

        total = sum(Decimal(str(i['qty'])) * Decimal(str(i['cost'])) for i in items_data)

        purchase = Purchase.objects.create(
            shop=shop, total=total, created_by=user, updated_by=user, **validated_data
        )
        for item in items_data:
            PurchaseItem.objects.create(purchase=purchase, **item)

            # stock-in: increase product stock by qty purchased, and treat the
            # latest purchase price as the product's current cost (for profit reports)
            product = item['product']
            product.stock += item['qty']
            product.cost = item['cost']
            product.save()

        return purchase

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        user = self.context['request'].user

        instance.supplier = validated_data.get('supplier', instance.supplier)
        instance.date = validated_data.get('date', instance.date)

        if items_data is not None:
            # reverse old stock additions before replacing items
            for old_item in instance.items.all():
                old_item.product.stock = max(0, old_item.product.stock - old_item.qty)
                old_item.product.save()

            instance.items.all().delete()

            total = Decimal('0')
            for item in items_data:
                PurchaseItem.objects.create(purchase=instance, **item)
                product = item['product']
                product.stock += item['qty']
                product.cost = item['cost']
                product.save()
                total += Decimal(str(item['qty'])) * Decimal(str(item['cost']))

            instance.total = total

        instance.updated_by = user
        instance.save()
        return instance