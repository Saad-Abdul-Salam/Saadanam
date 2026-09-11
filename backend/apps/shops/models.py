from django.db import models
from apps.accounts.models import User


class Shop(models.Model):
    TAX_MODE_INCLUSIVE = 'inclusive'
    TAX_MODE_EXCLUSIVE = 'exclusive'
    TAX_MODE_CHOICES = [
        (TAX_MODE_INCLUSIVE, 'Inclusive (tax already in price)'),
        (TAX_MODE_EXCLUSIVE, 'Exclusive (tax added on top)'),
    ]

    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_SUSPENDED = 'suspended'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_SUSPENDED, 'Suspended'),
    ]

    owner = models.OneToOneField(User, on_delete=models.CASCADE, related_name='shop')

    business_name = models.CharField(max_length=200)
    business_type = models.CharField(max_length=100)
    address = models.TextField()
    gst_number = models.CharField(max_length=30, blank=True)
    pan_number = models.CharField(max_length=20, blank=True)

    # tax settings decided at registration
    tax_mode = models.CharField(max_length=20, choices=TAX_MODE_CHOICES, default=TAX_MODE_INCLUSIVE)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_label = models.CharField(max_length=30, default='GST')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)

    logo = models.ImageField(upload_to='shop_logos/', null=True, blank=True)
    invoice_prefix = models.CharField(max_length=10, default='INV')
    currency = models.CharField(max_length=10, default='INR')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='shops_approved'
    )

    def __str__(self):
        return self.business_name