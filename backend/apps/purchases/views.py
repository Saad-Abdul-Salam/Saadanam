from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Purchase
from .serializers import PurchaseSerializer
from apps.expenses.models import Expense


class IsShopOwner(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'shop_owner'


class PurchaseListCreateView(generics.ListCreateAPIView):
    serializer_class = PurchaseSerializer
    permission_classes = [IsShopOwner]

    def get_queryset(self):
        return Purchase.objects.filter(shop=self.request.user.shop).prefetch_related('items')

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        purchase = serializer.save()
        Expense.objects.create(
            shop=purchase.shop,
            category='Purchase',
            amount=purchase.total,
            date=purchase.date,
            note=f"Purchase from {purchase.supplier.name}",
            purchase=purchase,
            created_by=self.request.user,
            updated_by=self.request.user,
        )


class PurchaseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PurchaseSerializer
    permission_classes = [IsShopOwner]

    def get_queryset(self):
        return Purchase.objects.filter(shop=self.request.user.shop).prefetch_related('items')

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_update(self, serializer):
        purchase = serializer.save()
        # keep the linked expense in sync
        Expense.objects.filter(purchase=purchase).update(
            amount=purchase.total,
            date=purchase.date,
            note=f"Purchase from {purchase.supplier.name}",
        )

    def perform_destroy(self, instance):
        # reverse stock additions before deleting
        for item in instance.items.all():
            item.product.stock = max(0, item.product.stock - item.qty)
            item.product.save()

        Expense.objects.filter(purchase=instance).delete()
        instance.delete()