"""Tests for the shop-approval confirmation email (Resend, best-effort)."""

from unittest import mock

from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.accounts.tests import register_user
from apps.shops.models import Shop


class ApprovalEmailTests(APITestCase):
    def setUp(self):
        # first user = platform admin, second = unapproved shop owner
        register_user(self.client, 'admin@test.com', full_name='Platform Admin')
        register_user(self.client, 'owner@test.com', full_name='Shop Owner')
        self.shop = Shop.objects.get(owner__email='owner@test.com')
        self.approve_url = reverse('shop-approve', args=[self.shop.id])

    def _login_admin(self):
        res = self.client.post(reverse('login'), {
            'email': 'admin@test.com', 'password': 'password123',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

    @override_settings(FRONTEND_URL='https://saadanam.example.com')
    @mock.patch('apps.platform_admin.views.send_email', return_value={'id': 'test'})
    def test_approval_sends_confirmation_email(self, send):
        self._login_admin()
        res = self.client.post(self.approve_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        send.assert_called_once()
        to, subject, body = send.call_args.args
        self.assertEqual(to, 'owner@test.com')
        self.assertEqual(subject, 'Your Saadanam account has been approved')
        self.assertIn('Shop Owner', body)
        self.assertIn('https://saadanam.example.com/login', body)

    @mock.patch('apps.platform_admin.views.send_email', side_effect=Exception('Resend down'))
    def test_approval_succeeds_even_if_email_fails(self, _send):
        self._login_admin()
        res = self.client.post(self.approve_url)

        # approval itself must not be blocked by an email failure
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.shop.refresh_from_db()
        self.assertEqual(self.shop.status, Shop.STATUS_APPROVED)
        owner = User.objects.get(email='owner@test.com')
        self.assertTrue(owner.is_approved)

        # ...and the owner can actually log in now
        res = self.client.post(reverse('login'), {
            'email': 'owner@test.com', 'password': 'password123',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    @mock.patch('apps.platform_admin.views.send_email')
    def test_activate_does_not_send_approval_email(self, send):
        """Only the registration-approval endpoint emails the owner — the
        un-suspend path intentionally stays silent."""
        self._login_admin()
        res = self.client.post(reverse('shop-activate', args=[self.shop.id]))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        send.assert_not_called()
