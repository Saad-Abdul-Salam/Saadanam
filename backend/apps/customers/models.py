from django.db import models
from apps.core.models import TenantModel


class Customer(TenantModel):
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    credit_limit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    outstanding = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_walkin = models.BooleanField(default=False)  # hidden from the Customers page, used as default in Billing

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class CustomerLedgerEntry(models.Model):
    ENTRY_PAYMENT = 'payment'      # they paid, reduces outstanding
    ENTRY_CHARGE = 'charge'        # they owe more, increases outstanding
    ENTRY_CHOICES = [
        (ENTRY_PAYMENT, 'Payment Received'),
        (ENTRY_CHARGE, 'Charge Added'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='ledger')
    entry_type = models.CharField(max_length=10, choices=ENTRY_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    balance_after = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-created_at']