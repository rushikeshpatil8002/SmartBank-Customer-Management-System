from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.customers.models import CustomerProfile
from apps.banking.models import BankAccount
from apps.beneficiaries.models import Beneficiary
from apps.notifications.models import Notification

class BeneficiaryAndNotificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # User 1
        self.user1 = User.objects.create_user(username='u1', password='Pass123!', role=User.ROLE_CUSTOMER)
        self.prof1 = CustomerProfile.objects.create(user=self.user1, full_name='User One', phone_number='1', address='A')
        self.acc1 = BankAccount.objects.create(customer=self.prof1, account_number='SB1111111111', balance=Decimal('500.00'))

        # User 2
        self.user2 = User.objects.create_user(username='u2', password='Pass123!', role=User.ROLE_CUSTOMER)
        self.prof2 = CustomerProfile.objects.create(user=self.user2, full_name='User Two', phone_number='2', address='B')
        self.acc2 = BankAccount.objects.create(customer=self.prof2, account_number='SB2222222222', balance=Decimal('500.00'))

    def test_add_beneficiary_success(self):
        self.client.force_authenticate(user=self.user1)
        payload = {
            'beneficiary_name': 'Friend Two',
            'account_number': self.acc2.account_number
        }
        response = self.client.post(reverse('beneficiary_list_create'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Beneficiary.objects.filter(customer=self.prof1, beneficiary_account=self.acc2).exists())

    def test_cannot_add_own_account_as_beneficiary(self):
        self.client.force_authenticate(user=self.user1)
        payload = {
            'beneficiary_name': 'Myself',
            'account_number': self.acc1.account_number
        }
        response = self.client.post(reverse('beneficiary_list_create'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_add_nonexistent_account_as_beneficiary(self):
        self.client.force_authenticate(user=self.user1)
        payload = {
            'beneficiary_name': 'Ghost',
            'account_number': 'SB9999999999'
        }
        response = self.client.post(reverse('beneficiary_list_create'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_remove_beneficiary(self):
        ben = Beneficiary.objects.create(
            customer=self.prof1,
            beneficiary_name='Friend',
            beneficiary_account=self.acc2,
            is_active=True
        )
        self.client.force_authenticate(user=self.user1)
        response = self.client.delete(reverse('beneficiary_detail', kwargs={'pk': ben.id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ben.refresh_from_db()
        self.assertFalse(ben.is_active)

    def test_notifications_isolation_and_mark_read(self):
        notif1 = Notification.objects.create(user=self.user1, title='Notice 1', message='Text 1', is_read=False)
        notif2 = Notification.objects.create(user=self.user2, title='Notice 2', message='Text 2', is_read=False)

        self.client.force_authenticate(user=self.user1)
        response = self.client.get(reverse('notification_list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unread_count'], 1)
        self.assertEqual(len(response.data['notifications']), 1)
        self.assertEqual(response.data['notifications'][0]['title'], 'Notice 1')

        # Mark read
        read_response = self.client.patch(reverse('notification_mark_read', kwargs={'pk': notif1.id}))
        self.assertEqual(read_response.status_code, status.HTTP_200_OK)
        notif1.refresh_from_db()
        self.assertTrue(notif1.is_read)

        # Cannot mark other user's notification
        other_read_response = self.client.patch(reverse('notification_mark_read', kwargs={'pk': notif2.id}))
        self.assertEqual(other_read_response.status_code, status.HTTP_404_NOT_FOUND)
