from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.notifications.models import Notification, NotificationRead


def make_owner(client, email='owner@test.com', business='Test Shop'):
    client.post(reverse('register'), {
        'email': email,
        'password': 'password123',
        'full_name': 'Owner',
        'phone': '9876543210',
        'business_name': business,
        'address': 'Addr',
    }, format='json')
    user = User.objects.get(email=email)
    user.is_approved = True
    user.save()
    login = client.post(reverse('login'), {'email': email, 'password': 'password123'}, format='json')
    return login.data['access'], user, user.shop


def make_admin(client):
    client.post(reverse('register'), {
        'email': 'admin@test.com',
        'password': 'password123',
        'full_name': 'Admin',
    }, format='json')
    login = client.post(reverse('login'), {'email': 'admin@test.com', 'password': 'password123'}, format='json')
    return login.data['access']


class NotificationTests(APITestCase):
    def setUp(self):
        self.admin_token = make_admin(self.client)
        self.token1, self.user1, self.shop1 = make_owner(self.client, email='shop1@test.com', business='Shop One')
        self.token2, self.user2, self.shop2 = make_owner(self.client, email='shop2@test.com', business='Shop Two')

    def auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_broadcast_visible_to_all(self):
        self.auth(self.admin_token)
        self.client.post(reverse('broadcast-notification'), {
            'type': 'announcement', 'title': 'Hi all', 'message': 'Hello',
        }, format='json')
        for token in (self.token1, self.token2):
            self.auth(token)
            res = self.client.get(reverse('my-notifications'))
            data = res.data['results'] if 'results' in res.data else res.data
            self.assertEqual(len(data), 1)

    def test_targeted_visible_only_to_one_shop(self):
        self.auth(self.admin_token)
        self.client.post(reverse('broadcast-notification'), {
            'type': 'warning', 'title': 'For Shop One', 'message': 'Only you',
            'shop_ids': [self.shop1.id],
        }, format='json')

        self.auth(self.token1)
        res = self.client.get(reverse('my-notifications'))
        data1 = res.data['results'] if 'results' in res.data else res.data
        self.assertEqual(len(data1), 1)

        self.auth(self.token2)
        res = self.client.get(reverse('my-notifications'))
        data2 = res.data['results'] if 'results' in res.data else res.data
        self.assertEqual(len(data2), 0)

    def test_unread_count_only_counts_visible(self):
        self.auth(self.admin_token)
        self.client.post(reverse('broadcast-notification'), {
            'type': 'announcement', 'title': 'Targeted', 'message': 'x',
            'shop_ids': [self.shop1.id],
        }, format='json')

        self.auth(self.token2)  # shop 2 never sees it
        res = self.client.get(reverse('notification-unread-count'))
        self.assertEqual(res.data['unread'], 0)

    def test_mark_all_read(self):
        self.auth(self.admin_token)
        self.client.post(reverse('broadcast-notification'), {
            'type': 'announcement', 'title': 'Hi', 'message': 'Hello',
        }, format='json')

        self.auth(self.token1)
        self.client.post(reverse('mark-all-notifications-read'))
        res = self.client.get(reverse('notification-unread-count'))
        self.assertEqual(res.data['unread'], 0)
        self.assertEqual(NotificationRead.objects.filter(user=self.user1).count(), 1)

    def test_admin_cannot_target_unknown_shop(self):
        self.auth(self.admin_token)
        res = self.client.post(reverse('broadcast-notification'), {
            'type': 'announcement', 'title': 'Bad', 'message': 'x',
            'shop_ids': [99999],
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_shop_owner_cannot_send(self):
        self.auth(self.token1)
        res = self.client.post(reverse('broadcast-notification'), {
            'type': 'announcement', 'title': 'Nope', 'message': 'x',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)