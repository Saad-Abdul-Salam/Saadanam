from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.shops.models import Shop
from apps.products.models import Product
from apps.customers.models import Customer


def make_owner(client, email='owner@test.com', tax_mode='inclusive', tax_rate=5):
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
        'tax_mode': tax_mode,
        'tax_rate': tax_rate,
    }, format='json')
    user = User.objects.get(email=email)
    user.is_approved = True
    user.save()
    login = client.post(reverse('login'), {'email': email, 'password': 'password123'}, format='json')
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
    return user, user.shop


def add_product(shop, user, name='Item', price=100, cost=60, stock=50):
    return Product.objects.create(
        shop=shop, name=name, price=price, cost=cost, stock=stock,
        created_by=user, updated_by=user,
    )


def make_customer(shop, user, name='Walk-in Customer', is_walkin=True):
    return Customer.objects.create(
        shop=shop, name=name, phone='-', is_walkin=is_walkin,
        created_by=user, updated_by=user,
    )


def finalize_sale(client, customer, product, qty=2, discount=0, received=0, payment='cash'):
    return client.post(reverse('finalize-sale'), {
        'customer': customer.id,
        'items': [{'product': product.id, 'qty': qty}],
        'discount': discount,
        'payment_method': payment,
        'received_amount': received,
    }, format='json')


class InclusiveTaxTests(APITestCase):
    def setUp(self):
        self.user, self.shop = make_owner(self.client)
        self.product = add_product(self.shop, self.user, price=100, cost=60)
        self.customer = make_customer(self.shop, self.user)

    def test_inclusive_tax_math(self):
        # price includes 5% GST: subtotal = 200/1.05 = 190.48, tax = 9.52, total = 200
        res = finalize_sale(self.client, self.customer, self.product, qty=2)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['total'], '200.00')
        self.assertEqual(res.data['subtotal'], '190.48')
        self.assertEqual(res.data['tax_amount'], '9.52')

    def test_invoice_numbering_starts_at_inv_00001(self):
        res = finalize_sale(self.client, self.customer, self.product)
        self.assertEqual(res.data['invoice_no'], 'INV-00001')

    def test_stock_deducted_and_restored_on_delete(self):
        finalize_sale(self.client, self.customer, self.product, qty=2)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 48)

        from apps.billing.models import Sale
        sale_id = Sale.objects.get().id
        res = self.client.delete(reverse('sale-detail', args=[sale_id]))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 50)

    def test_profit_reflected_in_sale(self):
        res = finalize_sale(self.client, self.customer, self.product, qty=2, discount=10)
        # (100-60)*2 - 10 = 70
        self.assertEqual(res.data['profit'], 70.0)

    def test_sale_item_snapshots_cost(self):
        finalize_sale(self.client, self.customer, self.product, qty=1)
        from apps.billing.models import SaleItem
        item = SaleItem.objects.get()
        self.assertEqual(item.cost, Decimal('60.00'))


class ExclusiveTaxTests(APITestCase):
    def setUp(self):
        self.user, self.shop = make_owner(self.client, tax_mode='exclusive', tax_rate=5)
        self.product = add_product(self.shop, self.user, price=100, cost=60)
        self.customer = make_customer(self.shop, self.user)

    def test_exclusive_tax_math(self):
        # 5% GST added on top: subtotal 200, tax 10, total 210
        res = finalize_sale(self.client, self.customer, self.product, qty=2)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['total'], '210.00')
        self.assertEqual(res.data['subtotal'], '200.00')
        self.assertEqual(res.data['tax_amount'], '10.00')


class SaleValidationTests(APITestCase):
    def setUp(self):
        self.user, self.shop = make_owner(self.client)
        self.product = add_product(self.shop, self.user, stock=5)
        self.customer = make_customer(self.shop, self.user)

    def test_rejects_qty_above_stock(self):
        res = finalize_sale(self.client, self.customer, self.product, qty=10)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_duplicate_items_above_stock(self):
        res = self.client.post(reverse('finalize-sale'), {
            'customer': self.customer.id,
            'items': [{'product': self.product.id, 'qty': 3}, {'product': self.product.id, 'qty': 3}],
            'discount': 0,
            'payment_method': 'cash',
            'received_amount': 0,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_cart_rejected(self):
        res = self.client.post(reverse('finalize-sale'), {
            'customer': self.customer.id,
            'items': [],
            'discount': 0,
            'payment_method': 'cash',
            'received_amount': 0,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cross_shop_customer_rejected(self):
        other_user, other_shop = make_owner(self.client, email='other@test.com')
        other_customer = make_customer(other_shop, other_user, name='Other')
        res = finalize_sale(self.client, other_customer, self.product)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)