from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.customers.models import CustomerProfile
from apps.banking.models import BankAccount

class AuthenticationAndRoleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.profile_url = reverse('user_profile')

        # Create staff and customer
        self.staff_user = User.objects.create_user(
            username='bankstaff',
            password='StaffPassword123!',
            role=User.ROLE_STAFF,
            is_staff=True
        )

        self.customer_user = User.objects.create_user(
            username='cust1',
            password='CustPassword123!',
            role=User.ROLE_CUSTOMER
        )
        self.customer_profile = CustomerProfile.objects.create(
            user=self.customer_user,
            full_name='Customer One',
            phone_number='1234567890',
            address='123 Street'
        )

    def test_customer_registration_success(self):
        payload = {
            'username': 'newuser',
            'password': 'StrongPassword123!',
            'email': 'newuser@example.com',
            'full_name': 'New User',
            'phone_number': '9876543210',
            'address': '456 Avenue',
            'account_type': 'SAVINGS',
            'initial_deposit': '150.00'
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())
        user = User.objects.get(username='newuser')
        self.assertEqual(user.role, User.ROLE_CUSTOMER)
        self.assertTrue(CustomerProfile.objects.filter(user=user).exists())
        self.assertTrue(BankAccount.objects.filter(customer__user=user).exists())
        account = BankAccount.objects.get(customer__user=user)
        self.assertEqual(account.balance, 150)

    def test_login_success_and_jwt_tokens(self):
        payload = {
            'username': 'cust1',
            'password': 'CustPassword123!'
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['username'], 'cust1')
        self.assertEqual(response.data['user']['role'], 'CUSTOMER')

    def test_login_invalid_password(self):
        payload = {
            'username': 'cust1',
            'password': 'WrongPassword!'
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_authenticated_profile_access(self):
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['full_name'], 'Customer One')

    def test_unauthenticated_profile_rejected(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
