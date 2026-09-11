from decimal import Decimal

from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Supplier, SupplierLedgerEntry
from .serializers import SupplierSerializer, SupplierLedgerEntrySerializer


class IsShopOwner(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'shop_owner'


class SupplierListCreateView(generics.ListCreateAPIView):
    serializer_class = SupplierSerializer
    permission_classes = [IsShopOwner]

    def get_queryset(self):
        return Supplier.objects.filter(shop=self.request.user.shop)

    def perform_create(self, serializer):
        serializer.save(
            shop=self.request.user.shop,
            created_by=self.request.user,
            updated_by=self.request.user,
        )


class SupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SupplierSerializer
    permission_classes = [IsShopOwner]

    def get_queryset(self):
        return Supplier.objects.filter(shop=self.request.user.shop)

    def update(self, request, *args, **kwargs):
        request.data.pop('outstanding', None)  # balance only changes via adjust-balance
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class AdjustSupplierBalanceView(APIView):
    permission_classes = [IsShopOwner]

    def post(self, request, supplier_id):
        try:
            supplier = Supplier.objects.get(id=supplier_id, shop=request.user.shop)
        except Supplier.DoesNotExist:
            return Response({"error": "Supplier not found."}, status=status.HTTP_404_NOT_FOUND)

        entry_type = request.data.get('entry_type')
        amount = request.data.get('amount')

        if entry_type not in ['payment', 'charge']:
            return Response({"error": "entry_type must be 'payment' or 'charge'."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = Decimal(str(amount))
        except Exception:
            return Response({"error": "Invalid amount."}, status=status.HTTP_400_BAD_REQUEST)

        if amount <= 0:
            return Response({"error": "Amount must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)

        if entry_type == 'payment':
            supplier.outstanding = max(Decimal('0'), supplier.outstanding - amount)
        else:
            supplier.outstanding = supplier.outstanding + amount

        supplier.save()

        SupplierLedgerEntry.objects.create(
            supplier=supplier,
            entry_type=entry_type,
            amount=amount,
            balance_after=supplier.outstanding,
            created_by=request.user,
        )

        return Response(SupplierSerializer(supplier).data)


class SupplierLedgerView(generics.ListAPIView):
    serializer_class = SupplierLedgerEntrySerializer
    permission_classes = [IsShopOwner]

    def get_queryset(self):
        return SupplierLedgerEntry.objects.filter(
            supplier_id=self.kwargs['supplier_id'],
            supplier__shop=self.request.user.shop
        )


class SupplierExportView(APIView):
    """CSV download of all suppliers."""
    permission_classes = [IsShopOwner]

    def get(self, request):
        queryset = Supplier.objects.filter(shop=request.user.shop).order_by('name')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="suppliers-export.csv"'
        response.write('\ufeff')
        response.write('Name,Phone,GST Number,Outstanding (Rs)\n')
        for s in queryset:
            response.write(f'"{s.name}","{s.phone}","{s.gst_number}",{s.outstanding}\n')
        return response