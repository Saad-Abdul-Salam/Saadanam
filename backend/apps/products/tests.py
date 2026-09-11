import io
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.products.models import Product, PriceHistory


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


class ProductTests(APITestCase):
    def setUp(self):
        self.user, self.shop = make_owner(self.client)

    def test_create_product_with_cost(self):
        res = self.client.post(reverse('product-list'), {
            'name': 'Rice (1kg)', 'price': 80, 'cost': 60, 'stock': 10, 'minStock': 2,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        product = Product.objects.get()
        self.assertEqual(product.cost, Decimal('60.00'))
        self.assertEqual(res.data['margin'], 25.0)  # (80-60)/80

    def test_quick_price_update_logs_history(self):
        product = Product.objects.create(
            shop=self.shop, name='Item', price=100, stock=10,
            created_by=self.user, updated_by=self.user,
        )
        res = self.client.patch(reverse('product-quick-price', args=[product.id]), {'price': 120}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        product.refresh_from_db()
        self.assertEqual(product.price, Decimal('120.00'))
        history = PriceHistory.objects.get(product=product)
        self.assertEqual(history.old_price, Decimal('100.00'))
        self.assertEqual(history.new_price, Decimal('120.00'))

    def test_price_history_on_update(self):
        product = Product.objects.create(
            shop=self.shop, name='Item', price=100, stock=10,
            created_by=self.user, updated_by=self.user,
        )
        self.client.patch(reverse('product-detail', args=[product.id]), {'price': 90}, format='json')
        history = PriceHistory.objects.get(product=product)
        self.assertEqual(history.old_price, Decimal('100.00'))
        self.assertEqual(history.new_price, Decimal('90.00'))

    def test_products_scoped_to_shop(self):
        Product.objects.create(shop=self.shop, name='Mine', price=1, created_by=self.user, updated_by=self.user)
        other_user, other_shop = make_owner(self.client, email='other@test.com')
        Product.objects.create(shop=other_shop, name='Theirs', price=2, created_by=other_user, updated_by=other_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self._login_again(self.user.email)}")
        res = self.client.get(reverse('product-list'))
        names = [p['name'] for p in (res.data['results'] if 'results' in res.data else res.data)]
        self.assertIn('Mine', names)
        self.assertNotIn('Theirs', names)

    def _login_again(self, email):
        res = self.client.post(reverse('login'), {'email': email, 'password': 'password123'}, format='json')
        return res.data['access']

    def test_bulk_import_with_cost(self):
        csv_content = 'name,price,stock,minStock,cost\nTomato,32,50,10,25\nOnion,28,40,10,22\n'
        uploaded = SimpleUploadedFile('products.csv', csv_content.encode('utf-8'), content_type='text/csv')
        res = self.client.post(reverse('product-bulk-import'), {
            'file': uploaded,
        }, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['createdCount'], 2)
        tomato = Product.objects.get(name='Tomato')
        self.assertEqual(tomato.cost, Decimal('25.00'))