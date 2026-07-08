from unittest.mock import patch

from django.urls import reverse
from rest_framework.test import APITestCase

from .models import User


class AuthFallbackTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = reverse('login')

    @patch('users.views.RegisterView._send_verification_email', side_effect=Exception('smtp unavailable'))
    def test_register_falls_back_to_direct_auth_when_verification_email_fails(self, _mock_send):
        payload = {
            'email': 'new.user@example.com',
            'password': 'Password123',
            'first_name': 'New',
            'last_name': 'User',
            'phone': '+254712345678',
            'location': 'Kilimani',
            'role': 'CLIENT',
        }

        response = self.client.post(self.register_url, payload, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertFalse(response.data['verification_required'])
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertTrue(User.objects.filter(email='new.user@example.com').exists())

    @patch('users.views.LoginView._send_verification_email', side_effect=Exception('smtp unavailable'))
    def test_login_falls_back_to_direct_auth_when_verification_email_fails(self, _mock_send):
        User.objects.create_user(
            email='existing.user@example.com',
            password='Password123',
            first_name='Existing',
            last_name='User',
            phone='+254712345679',
        )

        response = self.client.post(
            self.login_url,
            {'email': 'existing.user@example.com', 'password': 'Password123'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['verification_required'])
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
