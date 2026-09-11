from decimal import Decimal
from rest_framework import serializers
from .models import Sale, SaleItem
from apps.products.models import Product
from apps.customers.models import Customer

class SaleItemInputSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    qty = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))


class SaleItemSerializer(serializers.ModelSerializer):
    productName = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = SaleItem
        fields = ['id', 'product', 'productName', 'qty', 'price', 'cost', 'subtotal']


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    customerName = serializers.CharField(source='customer.name', read_only=True)
    customerPhone = serializers.CharField(source='customer.phone', read_only=True)
    customerAddress = serializers.CharField(source='customer.address', read_only=True)
    isWalkin = serializers.BooleanField(source='customer.is_walkin', read_only=True)
    profit = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = [
            'id', 'invoice_no', 'customer', 'customerName', 'customerPhone', 'customerAddress', 'isWalkin',
            'items', 'subtotal', 'discount', 'tax_amount', 'total', 'profit',
            'payment_method', 'received_amount', 'balance', 'created_at',
        ]
        read_only_fields = ['invoice_no', 'subtotal', 'tax_amount', 'total', 'balance']

    def get_profit(self, obj):
        margin = sum(
            (item.price - item.cost) * item.qty for item in obj.items.all()
        )
        return round(float(margin - obj.discount), 2)

class SaleCreateSerializer(serializers.Serializer):
    """What the Billing/POS page actually submits."""
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all())
    items = SaleItemInputSerializer(many=True)
    discount = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = serializers.ChoiceField(choices=Sale.PAYMENT_CHOICES)
    received_amount = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)

    def validate_customer(self, customer):
        request = self.context['request']
        if customer.shop_id != request.user.shop.id:
            raise serializers.ValidationError("Customer does not belong to your shop.")
        return customer

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Cart is empty.")

        shop = self.context['request'].user.shop

        # combine duplicate product entries first, then check against real stock
        combined = {}
        for item in items:
            product = item['product']
            if product.shop_id != shop.id:
                raise serializers.ValidationError(
                    f"Product \"{product.name}\" does not belong to your shop."
                )
            combined[product.id] = combined.get(product.id, 0) + item['qty']

        errors = []
        for item in items:
            product = item['product']
            requested = combined[product.id]
            if requested > product.stock:
                errors.append(
                    f"Only {product.stock} of \"{product.name}\" in stock (requested {requested})."
                )

        if errors:
            raise serializers.ValidationError(errors)

        return items

    def create(self, validated_data):
        request = self.context['request']
        shop = request.user.shop
        items_data = validated_data['items']

        raw_total = Decimal('0')
        for item in items_data:
            raw_total += item['product'].price * item['qty']

        discount = validated_data['discount']
        after_discount = max(Decimal('0'), raw_total - discount)

        if shop.tax_mode == 'inclusive':
            grand_total = after_discount
            subtotal = grand_total / (1 + shop.tax_rate / 100)
            tax_amount = grand_total - subtotal
        else:
            subtotal = after_discount
            tax_amount = subtotal * (shop.tax_rate / 100)
            grand_total = subtotal + tax_amount

        received = validated_data['received_amount']
        balance = grand_total - received

        last_sale = Sale.objects.filter(shop=shop).order_by('-id').first()
        next_number = (last_sale.id + 1) if last_sale else 1
        invoice_no = f"{shop.invoice_prefix}-{next_number:05d}"

        sale = Sale.objects.create(
            shop=shop,
            invoice_no=invoice_no,
            customer=validated_data['customer'],
            subtotal=round(subtotal, 2),
            discount=discount,
            tax_amount=round(tax_amount, 2),
            total=round(grand_total, 2),
            payment_method=validated_data['payment_method'],
            received_amount=received,
            balance=round(balance, 2),
            created_by=request.user,
            updated_by=request.user,
        )

        for item in items_data:
            product = item['product']
            SaleItem.objects.create(
                sale=sale, product=product, qty=item['qty'],
                price=product.price, cost=product.cost,
            )
            product.stock = max(0, product.stock - item['qty'])
            product.save()

        return sale