from django.db import models
from apps.core.models import TenantModel


class Expense(TenantModel):
    CATEGORY_CHOICES = [
        ('Rent', 'Rent'),
        ('Salary', 'Salary'),
        ('Transport', 'Transport'),
        ('Electricity', 'Electricity'),
        ('Internet', 'Internet'),
        ('Miscellaneous', 'Miscellaneous'),
        ('Purchase', 'Purchase'),  # auto-created from Purchases app
    ]

    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    note = models.CharField(max_length=255, blank=True)

    # set only when this expense was auto-generated from a purchase;
    # lets the frontend show the lock icon and blocks independent deletion
    purchase = models.ForeignKey(
        'purchases.Purchase', on_delete=models.CASCADE, null=True, blank=True, related_name='expense_entries'
    )

    class Meta:
        ordering = ['-date', '-id']

    def __str__(self):
        return f"{self.category} - {self.amount}"