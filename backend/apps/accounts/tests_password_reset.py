"""Tests for the OTP-based password-reset flow (cache-backed, no DB model)."""

from unittest import mock

from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User
from . import otp as otp_module

from .tests import register_user

OTP_KEY = otp_module.OTP_CACHE_PREFIX + 'owner@test.com'
REQUEST_KEY = otp_module.REQUEST_LIMIT_PREFIX + 'owner@test.com'


def clear_reset_cache():
    cache.delete(OTP_KEY)
    cache.delete(REQUEST_KEY)
    cache.delete(otp_module.VERIFY_LIMIT_PREFIX + 'owner@test.com')


class PasswordResetFlowTests(APITestCase):
    def setUp(self):
        clear_reset_cache()
        register_user(self.client, 'admin@test.com')  # first user = platform admin
        register_user(self.client, 'owner@test.com')
        self.owner = User.objects.get(email='owner@test.com')

    def tearDown(self):
        clear_reset_cache()

    @mock.patch('apps.accounts.otp.send_email', return_value={'id': 'test'})
    def test_full_flow(self, _send):
        # 1. request OTP
        res = self.client.post(
            reverse('password-reset-request'), {'email': 'owner@test.com'}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        stored = cache.get(OTP_KEY)
        self.assertIsNotNone(stored)
        self.assertRegex(stored, r'^\d{6}$')

        # 2. verify — must NOT delete the OTP (user can still retype password)
        res = self.client.post(
            reverse('password-reset-verify'),
            {'email': 'owner@test.com', 'otp': stored},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(cache.get(OTP_KEY))

        # 3. confirm — password changes, OTP consumed
        res = self.client.post(
            reverse('password-reset-confirm'),
            {
                'email': 'owner@test.com',
                'otp': stored,
                'new_password': 'newpassword456',
                'confirm_password': 'newpassword456',
            },
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.owner.refresh_from_db()
        self.assertTrue(self.owner.check_password('newpassword456'))
        self.assertIsNone(cache.get(OTP_KEY))

    @mock.patch('apps.accounts.otp.send_email', return_value={'id': 'test'})
    def test_request_does_not_leak_registered_emails(self, _send):
        res_known = self.client.post(
            reverse('password-reset-request'), {'email': 'owner@test.com'}, format='json'
        )
        res_unknown = self.client.post(
            reverse('password-reset-request'), {'email': 'nobody@test.com'}, format='json'
        )
        self.assertEqual(res_known.status_code, res_unknown.status_code)
        self.assertEqual(res_known.data['message'], res_unknown.data['message'])
        # unknown email: no OTP ever stored
        self.assertIsNone(cache.get(otp_module.OTP_CACHE_PREFIX + 'nobody@test.com'))

    @mock.patch('apps.accounts.otp.send_email', return_value={'id': 'test'})
    def test_wrong_otp_fails_but_is_not_deleted(self, _send):
        self.client.post(reverse('password-reset-request'), {'email': 'owner@test.com'}, format='json')
        res = self.client.post(
            reverse('password-reset-verify'),
            {'email': 'owner@test.com', 'otp': '000001'},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIsNotNone(cache.get(OTP_KEY))

    @mock.patch('apps.accounts.otp.send_email', return_value={'id': 'test'})
    def test_confirm_password_mismatch_keeps_otp(self, _send):
        self.client.post(reverse('password-reset-request'), {'email': 'owner@test.com'}, format='json')
        stored = cache.get(OTP_KEY)
        res = self.client.post(
            reverse('password-reset-confirm'),
            {
                'email': 'owner@test.com',
                'otp': stored,
                'new_password': 'newpassword456',
                'confirm_password': 'different789',
            },
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.owner.refresh_from_db()
        self.assertTrue(self.owner.check_password('password123'))
        # OTP still valid so the user can retry without re-requesting
        self.assertIsNotNone(cache.get(OTP_KEY))

    @mock.patch('apps.accounts.otp.send_email', return_value={'id': 'test'})
    def test_verify_brute_force_limit(self, _send):
        self.client.post(reverse('password-reset-request'), {'email': 'owner@test.com'}, format='json')
        for _ in range(otp_module.MAX_VERIFY_ATTEMPTS):
            self.client.post(
                reverse('password-reset-verify'),
                {'email': 'owner@test.com', 'otp': '999999'},
                format='json',
            )
        # budget exhausted → OTP wiped, fresh request required
        self.assertIsNone(cache.get(OTP_KEY))
        res = self.client.post(
            reverse('password-reset-verify'),
            {'email': 'owner@test.com', 'otp': '123456'},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @mock.patch('apps.accounts.otp.send_email', return_value={'id': 'test'})
    def test_request_rate_limit(self, _send):
        for _ in range(otp_module.MAX_REQUESTS_PER_WINDOW):
            res = self.client.post(
                reverse('password-reset-request'), {'email': 'owner@test.com'}, format='json'
            )
            self.assertEqual(res.status_code, status.HTTP_200_OK)
        res = self.client.post(
            reverse('password-reset-request'), {'email': 'owner@test.com'}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    @mock.patch('apps.accounts.otp.send_email', side_effect=Exception('Resend down'))
    def test_email_failure_returns_error(self, _send):
        res = self.client.post(
            reverse('password-reset-request'), {'email': 'owner@test.com'}, format='json'
        )
        self.assertEqual(res.status_code, 502)
        self.assertIn('error', res.data)
        # failed send must not store an OTP
        self.assertIsNone(cache.get(OTP_KEY))
        self.assertIsNone(cache.get(REQUEST_KEY))
