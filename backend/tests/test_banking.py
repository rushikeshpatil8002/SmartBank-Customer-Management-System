from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.customers.models import CustomerProfile
from apps.banking.models import BankAccount

class BankingAndCustomerTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Admin
        self.admin_user = User.objects.create_user(
            username='adminuser',
            password='AdminPassword123!',
            role=User.ROLE_ADMIN,
            is_staff=True,
            is_superuser=True
        )

        # Customer 1
        self.user1 = User.objects.create_user(
            username='user1',
            password='User1Password123!',
            role=User.ROLE_CUSTOMER
        )
        self.profile1 = CustomerProfile.objects.create(
            user=self.user1,
            full_name='User One',
            phone_number='1111111111',
            address='Address 1'
        )
        self.acc1 = BankAccount.objects.create(
            customer=self.profile1,
            account_number='SB9990000001',
            account_type=BankAccount.TYPE_SAVINGS,
            balance=Decimal('1000.00'),
            status=BankAccount.STATUS_ACTIVE
        )

        # Customer 2
        self.user2 = User.objects.create_user(
            username='user2',
            password='User2Password123!',
            role=User.ROLE_CUSTOMER
        )
        self.profile2 = CustomerProfile.objects.create(
            user=self.user2,
            full_name='User Two',
            phone_number='2222222222',
            address='Address 2'
        )
        self.acc2 = BankAccount.objects.create(
            customer=self.profile2,
            account_number='SB9990000002',
            account_type=BankAccount.TYPE_CURRENT,
            balance=Decimal('500.00'),
            status=BankAccount.STATUS_ACTIVE
        )

    def test_customer_cannot_access_customer_directory(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(reverse('customer_list_create'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_access_customer_directory(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('customer_list_create'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_customer_views_only_own_accounts(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(reverse('account_list_create'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['account_number'], self.acc1.account_number)

    def test_customer_cannot_view_another_customer_account_by_id(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(reverse('account_detail', kwargs={'pk': self.acc2.id}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_customer_cannot_arbitrarily_change_balance(self):
        self.client.force_authenticate(user=self.user1)
        # Attempt direct patch on account endpoint
        response = self.client.patch(reverse('account_detail', kwargs={'pk': self.acc1.id}), {'balance': '9999999.00'})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.acc1.refresh_from_db()
        self.assertEqual(self.acc1.balance, Decimal('1000.00'))

    def test_staff_can_freeze_and_activate_account(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(
            reverse('account_status_update', kwargs={'pk': self.acc1.id}),
            {'status': 'FROZEN'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.acc1.refresh_from_db()
        self.assertEqual(self.acc1.status, BankAccount.STATUS_FROZEN)

    def test_customer_cannot_change_account_status(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.patch(
            reverse('account_status_update', kwargs={'pk': self.acc1.id}),
            {'status': 'ACTIVE'}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
