from decimal import Decimal

from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models.deletion import ProtectedError

from .models import Customer, CustomerLedgerEntry
from .serializers import CustomerSerializer, CustomerLedgerEntrySerializer

WALKIN_NAME = 'Walk-in Customer'


class IsShopOwner(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'shop_owner'


class CustomerListCreateView(generics.ListCreateAPIView):
    """Never returns the Walk-in Customer — that one is only ever fetched via WalkinCustomerView."""
    serializer_class = CustomerSerializer
    permission_classes = [IsShopOwner]

    def get_queryset(self):
        return Customer.objects.filter(shop=self.request.user.shop, is_walkin=False)

    def perform_create(self, serializer):
        serializer.save(
            shop=self.request.user.shop,
            created_by=self.request.user,
            updated_by=self.request.user,
        )


class WalkinCustomerView(APIView):
    """Powers the Billing page's default customer — created once per shop, reused every time."""
    permission_classes = [IsShopOwner]

    def get(self, request):
        customer, _ = Customer.objects.get_or_create(
            shop=request.user.shop,
            is_walkin=True,
            defaults={'name': WALKIN_NAME, 'phone': '-', 'created_by': request.user, 'updated_by': request.user}
        )
        return Response(CustomerSerializer(customer).data)


class CustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Update here covers name/phone/address/creditLimit — NOT outstanding (use adjust-balance for that)."""
    serializer_class = CustomerSerializer
    permission_classes = [IsShopOwner]

    def get_queryset(self):
        return Customer.objects.filter(shop=self.request.user.shop, is_walkin=False)

    def update(self, request, *args, **kwargs):
        request.data.pop('outstanding', None)
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"error": "This customer has past sales on record and can't be deleted."},
                status=status.HTTP_400_BAD_REQUEST
            )


class AdjustBalanceView(APIView):
    """Powers the 'They Paid' / 'They Owe More' buttons."""
    permission_classes = [IsShopOwner]

    def post(self, request, customer_id):
        try:
            customer = Customer.objects.get(id=customer_id, shop=request.user.shop)
        except Customer.DoesNotExist:
            return Response({"error": "Customer not found."}, status=status.HTTP_404_NOT_FOUND)

        entry_type = request.data.get('entry_type')  # 'payment' or 'charge'
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
            customer.outstanding = max(Decimal('0'), customer.outstanding - amount)
        else:
            customer.outstanding = customer.outstanding + amount

        customer.save()

        CustomerLedgerEntry.objects.create(
            customer=customer,
            entry_type=entry_type,
            amount=amount,
            balance_after=customer.outstanding,
            created_by=request.user,
        )

        return Response(CustomerSerializer(customer).data)


class CustomerLedgerView(generics.ListAPIView):
    serializer_class = CustomerLedgerEntrySerializer
    permission_classes = [IsShopOwner]

    def get_queryset(self):
        return CustomerLedgerEntry.objects.filter(
            customer_id=self.kwargs['customer_id'],
            customer__shop=self.request.user.shop
        )


class CustomerExportView(APIView):
    """CSV download of all customers (excludes the Walk-in Customer)."""
    permission_classes = [IsShopOwner]

    def get(self, request):
        queryset = Customer.objects.filter(shop=request.user.shop, is_walkin=False).order_by('name')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="customers-export.csv"'
        response.write('\ufeff')
        response.write('Name,Phone,Address,Credit Limit (Rs),Outstanding (Rs)\n')
        for c in queryset:
            response.write(f'"{c.name}","{c.phone}","{c.address}",{c.credit_limit},{c.outstanding}\n')
        return response