from django.db import models
from apps.core.models import TenantModel


class Supplier(TenantModel):
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    gst_number = models.CharField(max_length=30, blank=True)
    outstanding = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # what we owe them

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class SupplierLedgerEntry(models.Model):
    ENTRY_PAYMENT = 'payment'   # we paid them, reduces outstanding
    ENTRY_CHARGE = 'charge'     # we bought more on credit, increases outstanding
    ENTRY_CHOICES = [
        (ENTRY_PAYMENT, 'Payment Made'),
        (ENTRY_CHARGE, 'Charge Added'),
    ]

    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='ledger')
    entry_type = models.CharField(max_length=10, choices=ENTRY_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    balance_after = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-created_at']