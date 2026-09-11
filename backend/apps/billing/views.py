from datetime import timedelta

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Sale
from .serializers import SaleSerializer, SaleCreateSerializer
from apps.customers.models import Customer


class IsShopOwner(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'shop_owner'


class SaleListView(generics.ListAPIView):
    serializer_class = SaleSerializer
    permission_classes = [IsShopOwner]

    def get_queryset(self):
        return Sale.objects.filter(shop=self.request.user.shop).prefetch_related('items')


class SaleDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = SaleSerializer
    permission_classes = [IsShopOwner]

    def get_queryset(self):
        return Sale.objects.filter(shop=self.request.user.shop).prefetch_related('items')

    def perform_destroy(self, instance):
        # reverse stock for every item sold
        for item in instance.items.all():
            item.product.stock += item.qty
            item.product.save()

        # if this sale added to the customer's running balance (unpaid amount), reverse that too
        balance = instance.balance
        if balance > 0 and not instance.customer.is_walkin:
            from apps.customers.models import CustomerLedgerEntry
            customer = instance.customer
            customer.outstanding = max(0, customer.outstanding - balance)
            customer.save()
            CustomerLedgerEntry.objects.create(
                customer=customer,
                entry_type=CustomerLedgerEntry.ENTRY_PAYMENT,
                amount=balance,
                balance_after=customer.outstanding,
                created_by=self.request.user,
            )

        instance.delete()

class FinalizeSaleView(APIView):
    permission_classes = [IsShopOwner]

    def post(self, request):
        serializer = SaleCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        sale = serializer.save()
        return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)


class SaleExportView(APIView):
    """CSV download of every sale for the shop, optionally filtered by
    ?start=YYYY-MM-DD&end=YYYY-MM-DD."""
    permission_classes = [IsShopOwner]

    def get(self, request):
        queryset = Sale.objects.filter(shop=request.user.shop).prefetch_related('items')

        start = request.query_params.get('start')
        end = request.query_params.get('end')
        try:
            if start:
                queryset = queryset.filter(created_at__date__gte=timezone.datetime.strptime(start, '%Y-%m-%d').date())
            if end:
                queryset = queryset.filter(created_at__date__lte=timezone.datetime.strptime(end, '%Y-%m-%d').date())
        except ValueError:
            return Response({"error": "Invalid date. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        filename = 'sales-export' if not (start or end) else f'sales-export-{start}-to-{end}'
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
        response.write('\ufeff')
        response.write('Invoice No,Date,Customer,Phone,Payment,Subtotal (Rs),Discount (Rs),Tax (Rs),Total (Rs),Profit (Rs),Balance (Rs)\n')

        for sale in queryset.order_by('-created_at'):
            profit = sum((i.price - i.cost) * i.qty for i in sale.items.all()) - sale.discount
            response.write(
                f'{sale.invoice_no},{sale.created_at.strftime("%Y-%m-%d %H:%M")},'
                f'"{sale.customer.name}","{sale.customer.phone}",{sale.payment_method},'
                f'{sale.subtotal},{sale.discount},{sale.tax_amount},{sale.total},{profit},{sale.balance}\n'
            )

        return response