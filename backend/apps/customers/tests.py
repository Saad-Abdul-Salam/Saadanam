from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.customers.models import Customer, CustomerLedgerEntry


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


class CustomerTests(APITestCase):
    def setUp(self):
        self.user, self.shop = make_owner(self.client)

    def test_walkin_customer_created_once_and_reused(self):
        res1 = self.client.get(reverse('customer-walkin'))
        res2 = self.client.get(reverse('customer-walkin'))
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data['id'], res2.data['id'])
        self.assertTrue(res1.data['isWalkin'])
        self.assertEqual(Customer.objects.filter(is_walkin=True, shop=self.shop).count(), 1)

    def test_walkin_hidden_from_list(self):
        self.client.get(reverse('customer-walkin'))
        res = self.client.get(reverse('customer-list'))
        self.assertEqual(res.data['count'] if 'count' in res.data else len(res.data), 0)

    def test_adjust_balance_charge_and_payment(self):
        customer = Customer.objects.create(
            shop=self.shop, name='Ravi', phone='123', credit_limit=5000,
            created_by=self.user, updated_by=self.user,
        )
        res = self.client.post(reverse('customer-adjust-balance', args=[customer.id]), {
            'entry_type': 'charge', 'amount': 2000,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['outstanding'], '2000.00')

        res = self.client.post(reverse('customer-adjust-balance', args=[customer.id]), {
            'entry_type': 'payment', 'amount': 500,
        }, format='json')
        self.assertEqual(res.data['outstanding'], '1500.00')

        ledger = CustomerLedgerEntry.objects.filter(customer=customer).order_by('id')
        self.assertEqual(ledger.count(), 2)
        self.assertEqual(ledger[0].entry_type, 'charge')
        self.assertEqual(ledger[0].balance_after, Decimal('2000.00'))
        self.assertEqual(ledger[1].entry_type, 'payment')
        self.assertEqual(ledger[1].balance_after, Decimal('1500.00'))

    def test_payment_does_not_go_below_zero(self):
        customer = Customer.objects.create(
            shop=self.shop, name='Ravi', phone='123',
            created_by=self.user, updated_by=self.user,
        )
        res = self.client.post(reverse('customer-adjust-balance', args=[customer.id]), {
            'entry_type': 'payment', 'amount': 1000,
        }, format='json')
        self.assertEqual(res.data['outstanding'], '0.00')

    def test_invalid_entry_type_rejected(self):
        customer = Customer.objects.create(
            shop=self.shop, name='Ravi', phone='123',
            created_by=self.user, updated_by=self.user,
        )
        res = self.client.post(reverse('customer-adjust-balance', args=[customer.id]), {
            'entry_type': 'refund', 'amount': 10,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_cannot_edit_outstanding(self):
        customer = Customer.objects.create(
            shop=self.shop, name='Ravi', phone='123', outstanding=999,
            created_by=self.user, updated_by=self.user,
        )
        res = self.client.patch(reverse('customer-detail', args=[customer.id]), {
            'name': 'Ravi Kumar', 'outstanding': 1,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        customer.refresh_from_db()
        self.assertEqual(customer.name, 'Ravi Kumar')
        self.assertEqual(customer.outstanding, Decimal('999.00'))