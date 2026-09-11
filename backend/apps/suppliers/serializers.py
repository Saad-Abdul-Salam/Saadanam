from rest_framework import serializers
from .models import Supplier, SupplierLedgerEntry


class SupplierSerializer(serializers.ModelSerializer):
    gst = serializers.CharField(source='gst_number', required=False, allow_blank=True)

    class Meta:
        model = Supplier
        fields = ['id', 'name', 'phone', 'gst', 'outstanding']


class SupplierLedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierLedgerEntry
        fields = ['id', 'entry_type', 'amount', 'balance_after', 'created_at', 'created_by']