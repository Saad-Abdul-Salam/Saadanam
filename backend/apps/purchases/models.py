from django.db import models
from apps.core.models import TenantModel


class Purchase(TenantModel):
    STATUS_RECEIVED = 'Received'
    STATUS_CHOICES = [
        (STATUS_RECEIVED, 'Received'),
    ]

    supplier = models.ForeignKey('suppliers.Supplier', on_delete=models.PROTECT, related_name='purchases')
    date = models.DateField()
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_RECEIVED)

    class Meta:
        ordering = ['-date', '-id']

    def __str__(self):
        return f"Purchase #{self.id} - {self.supplier.name}"


class PurchaseItem(models.Model):
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT, related_name='purchase_items')
    qty = models.DecimalField(max_digits=10, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def subtotal(self):
        return self.qty * self.cost