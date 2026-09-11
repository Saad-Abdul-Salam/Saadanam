from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.expenses.models import Expense


def make_owner(client, email='owner@test.com'):
    # first-ever user becomes Platform Admin, so seed one before registering the owner
    if not User.objects.exists():
        client.post(reverse('register'), {
            'email': 'platform@admin.com', 'password': 'password123', 'full_name': 'Platform Admin',
        }, format='json')
    client.post(reverse('register'), {
        'email': email,
        'password': 'password123',
        'full_name': 'Owner',
        'phone': '9876543210',
        'business_name': 'Test Shop',
        'address': 'Addr',
    }, format='json')
    user = User.objects.get(email=email)
    user.is_approved = True
    user.save()
    login = client.post(reverse('login'), {'email': email, 'password': 'password123'}, format='json')
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
    return user, user.shop


def create_purchase(client, supplier, product, qty=10, cost=40):
    return client.post(reverse('purchase-list'), {
        'supplier': supplier.id,
        'date': '2026-09-01',
        'items': [{'product': product.id, 'qty': qty, 'cost': cost}],
    }, format='json')


class PurchaseTests(APITestCase):
    def setUp(self):
        self.user, self.shop = make_owner(self.client)
        self.product = Product.objects.create(
            shop=self.shop, name='Item', price=80, cost=30, stock=5,
            created_by=self.user, updated_by=self.user,
        )
        self.supplier = Supplier.objects.create(
            shop=self.shop, name='Vendor', phone='123',
            created_by=self.user, updated_by=self.user,
        )

    def test_purchase_adds_stock_updates_cost_and_creates_expense(self):
        res = create_purchase(self.client, self.supplier, self.product, qty=10, cost=40)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['total'], '400.00')

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 15)
        self.assertEqual(self.product.cost, Decimal('40.00'))

        expense = Expense.objects.get(shop=self.shop, purchase__isnull=False)
        self.assertEqual(expense.category, 'Purchase')
        self.assertEqual(expense.amount, Decimal('400.00'))

    def test_deleting_purchase_reverses_stock_and_removes_expense(self):
        create_purchase(self.client, self.supplier, self.product, qty=10, cost=40)
        purchase_id = self.shop.purchases.get().id
        res = self.client.delete(reverse('purchase-detail', args=[purchase_id]))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)
        self.assertEqual(Expense.objects.filter(purchase__isnull=False).count(), 0)

    def test_purchase_linked_expense_cannot_be_deleted_directly(self):
        create_purchase(self.client, self.supplier, self.product, qty=5, cost=40)
        expense = Expense.objects.get(shop=self.shop, purchase__isnull=False)
        res = self.client.delete(reverse('expense-detail', args=[expense.id]))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)