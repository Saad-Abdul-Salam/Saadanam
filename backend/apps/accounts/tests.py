from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse

from .models import User
from apps.shops.models import Shop


def register_user(client, email, password='password123', **extra):
    payload = {
        'email': email,
        'password': password,
        'full_name': extra.pop('full_name', 'Test User'),
        'phone': extra.pop('phone', '9876543210'),
        'business_name': extra.pop('business_name', 'Test Shop'),
        'address': extra.pop('address', 'Test Address'),
        'tax_mode': extra.pop('tax_mode', 'inclusive'),
        'tax_rate': extra.pop('tax_rate', 5),
    }
    payload.update(extra)
    return client.post(reverse('register'), payload, format='json')


class RegistrationTests(APITestCase):
    def test_first_user_becomes_platform_admin(self):
        res = register_user(self.client, 'admin@test.com')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='admin@test.com')
        self.assertEqual(user.role, User.ROLE_PLATFORM_ADMIN)
        self.assertTrue(user.is_approved)
        self.assertIn('Platform Admin', res.data['message'])

    def test_second_user_becomes_unapproved_shop_owner_with_shop(self):
        register_user(self.client, 'admin@test.com')
        res = register_user(self.client, 'owner@test.com')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='owner@test.com')
        self.assertEqual(user.role, User.ROLE_SHOP_OWNER)
        self.assertFalse(user.is_approved)
        self.assertTrue(Shop.objects.filter(owner=user).exists())
        self.assertIn('Awaiting approval', res.data['message'])


class LoginGatingTests(APITestCase):
    def setUp(self):
        register_user(self.client, 'admin@test.com')
        register_user(self.client, 'owner@test.com')

    def test_unapproved_owner_cannot_login(self):
        res = self.client.post(reverse('login'), {
            'email': 'owner@test.com', 'password': 'password123',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_approved_owner_can_login(self):
        owner = User.objects.get(email='owner@test.com')
        owner.is_approved = True
        owner.save()
        res = self.client.post(reverse('login'), {
            'email': 'owner@test.com', 'password': 'password123',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('user', res.data)


class ProfileAndPasswordTests(APITestCase):
    def setUp(self):
        register_user(self.client, 'admin@test.com')
        owner = User.objects.get(email='admin@test.com')
        owner.is_approved = True
        owner.save()
        login = self.client.post(reverse('login'), {
            'email': 'admin@test.com', 'password': 'password123',
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

    def test_update_profile(self):
        res = self.client.patch(reverse('me'), {'full_name': 'New Name', 'phone': '1112223333'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['full_name'], 'New Name')
        user = User.objects.get(email='admin@test.com')
        self.assertEqual(user.phone, '1112223333')

    def test_update_profile_cannot_change_role(self):
        res = self.client.patch(reverse('me'), {'role': 'shop_owner'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.get(email='admin@test.com').role, User.ROLE_PLATFORM_ADMIN)

    def test_change_password_success(self):
        res = self.client.post(reverse('change-password'), {
            'old_password': 'password123', 'new_password': 'newpassword456',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        user = User.objects.get(email='admin@test.com')
        self.assertTrue(user.check_password('newpassword456'))

    def test_change_password_wrong_current(self):
        res = self.client.post(reverse('change-password'), {
            'old_password': 'wrong', 'new_password': 'newpassword456',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_too_short(self):
        res = self.client.post(reverse('change-password'), {
            'old_password': 'password123', 'new_password': 'short',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)