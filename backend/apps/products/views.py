import csv
import io
from decimal import Decimal, InvalidOperation

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Product, PriceHistory
from .serializers import ProductSerializer


class IsShopOwner(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'shop_owner'


class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsShopOwner]

    def get_queryset(self):
        return Product.objects.filter(shop=self.request.user.shop)

    def perform_create(self, serializer):
        serializer.save(
            shop=self.request.user.shop,
            created_by=self.request.user,
            updated_by=self.request.user,
        )


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsShopOwner]

    def get_queryset(self):
        return Product.objects.filter(shop=self.request.user.shop)

    def perform_update(self, serializer):
        old_price = serializer.instance.price
        product = serializer.save(updated_by=self.request.user)

        if 'price' in serializer.validated_data and product.price != old_price:
            PriceHistory.objects.create(
                product=product,
                old_price=old_price,
                new_price=product.price,
                changed_by=self.request.user,
            )


class QuickPriceUpdateView(APIView):
    """Used by the dashboard's Quick Price Update modal — just updates price, nothing else."""
    permission_classes = [IsShopOwner]

    def patch(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id, shop=request.user.shop)
        except Product.DoesNotExist:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        new_price = request.data.get('price')
        if new_price is None:
            return Response({"error": "price is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            new_price = Decimal(str(new_price))
        except (InvalidOperation, ValueError):
            return Response({"error": "price must be a valid number."}, status=status.HTTP_400_BAD_REQUEST)

        if new_price < 0:
            return Response({"error": "price cannot be negative."}, status=status.HTTP_400_BAD_REQUEST)

        old_price = product.price
        product.price = new_price
        product.updated_by = request.user
        product.save()

        PriceHistory.objects.create(
            product=product, old_price=old_price, new_price=new_price, changed_by=request.user
        )

        return Response(ProductSerializer(product).data)


class BulkImportProductsView(APIView):
    """Accepts a CSV with columns: name, price, stock, minStock, cost (cost optional)."""
    permission_classes = [IsShopOwner]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded = file.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(decoded))
        except Exception:
            return Response({"error": "Could not read file. Make sure it's a valid CSV."}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        errors = []

        for i, row in enumerate(reader, start=2):  # start=2 accounts for header row
            name = (row.get('name') or '').strip()
            price = row.get('price')
            stock = row.get('stock')
            min_stock = row.get('minStock')
            cost = row.get('cost')

            if not name or not price:
                errors.append(f"Row {i}: missing name or price, skipped.")
                continue

            try:
                # CSV cells arrive as strings; coerce to Decimal so the model
                # and serializer treat them as numbers (avoids str/int compare errors)
                product = Product.objects.create(
                    shop=request.user.shop,
                    name=name,
                    price=Decimal(str(price)),
                    cost=Decimal(str(cost)) if cost not in (None, '') else Decimal('0'),
                    stock=Decimal(str(stock)) if stock not in (None, '') else Decimal('0'),
                    min_stock=Decimal(str(min_stock)) if min_stock not in (None, '') else Decimal('0'),
                    created_by=request.user,
                    updated_by=request.user,
                )
                created.append(ProductSerializer(product).data)
            except Exception as e:
                errors.append(f"Row {i}: {str(e)}")

        return Response({"created": created, "errors": errors, "createdCount": len(created)})