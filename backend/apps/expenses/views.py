from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Expense
from .serializers import ExpenseSerializer


class IsShopOwner(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'shop_owner'


class ExpenseListCreateView(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [IsShopOwner]

    def get_queryset(self):
        return Expense.objects.filter(shop=self.request.user.shop)

    def perform_create(self, serializer):
        serializer.save(
            shop=self.request.user.shop,
            created_by=self.request.user,
            updated_by=self.request.user,
        )


class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [IsShopOwner]

    def get_queryset(self):
        return Expense.objects.filter(shop=self.request.user.shop)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.purchase_id:
            return Response(
                {"error": "This expense is linked to a purchase. Delete or edit it from the Purchases page instead."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)