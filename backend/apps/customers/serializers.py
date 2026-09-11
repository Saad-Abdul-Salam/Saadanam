from rest_framework import serializers
from .models import Customer, CustomerLedgerEntry


class CustomerSerializer(serializers.ModelSerializer):
    creditLimit = serializers.DecimalField(source='credit_limit', max_digits=10, decimal_places=2)
    isWalkin = serializers.BooleanField(source='is_walkin', read_only=True)

    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'address', 'creditLimit', 'outstanding', 'isWalkin']


class CustomerLedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerLedgerEntry
        fields = ['id', 'entry_type', 'amount', 'balance_after', 'created_at', 'created_by']