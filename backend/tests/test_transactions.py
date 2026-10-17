from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.customers.models import CustomerProfile
from apps.banking.models import BankAccount
from apps.transactions.models import Transaction

class FinancialTransactionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Sender Customer
        self.sender_user = User.objects.create_user(
            username='sender',
            password='SenderPassword123!',
            role=User.ROLE_CUSTOMER
        )
        self.sender_profile = CustomerProfile.objects.create(
            user=self.sender_user,
            full_name='Sender User',
            phone_number='1112223333',
            address='Sender Address'
        )
        self.sender_account = BankAccount.objects.create(
            customer=self.sender_profile,
            account_number='SB7770000001',
            account_type=BankAccount.TYPE_SAVINGS,
            balance=Decimal('2000.00'),
            status=BankAccount.STATUS_ACTIVE
        )

        # Receiver Customer
        self.receiver_user = User.objects.create_user(
            username='receiver',
            password='ReceiverPassword123!',
            role=User.ROLE_CUSTOMER
        )
        self.receiver_profile = CustomerProfile.objects.create(
            user=self.receiver_user,
            full_name='Receiver User',
            phone_number='4445556666',
            address='Receiver Address'
        )
        self.receiver_account = BankAccount.objects.create(
            customer=self.receiver_profile,
            account_number='SB7770000002',
            account_type=BankAccount.TYPE_CURRENT,
            balance=Decimal('500.00'),
            status=BankAccount.STATUS_ACTIVE
        )

        # Frozen Account
        self.frozen_account = BankAccount.objects.create(
            customer=self.sender_profile,
            account_number='SB7770000003',
            account_type=BankAccount.TYPE_SAVINGS,
            balance=Decimal('100.00'),
            status=BankAccount.STATUS_FROZEN
        )

    def test_deposit_success(self):
        self.client.force_authenticate(user=self.sender_user)
        payload = {
            'account_number': self.sender_account.account_number,
            'amount': '350.50',
            'description': 'Test check deposit'
        }
        response = self.client.post(reverse('transaction_deposit'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.sender_account.refresh_from_db()
        self.assertEqual(self.sender_account.balance, Decimal('2350.50'))
        self.assertTrue(Transaction.objects.filter(transaction_type='DEPOSIT', amount=Decimal('350.50')).exists())

    def test_deposit_negative_amount_rejected(self):
        self.client.force_authenticate(user=self.sender_user)
        payload = {
            'account_number': self.sender_account.account_number,
            'amount': '-100.00'
        }
        response = self.client.post(reverse('transaction_deposit'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_withdrawal_success(self):
        self.client.force_authenticate(user=self.sender_user)
        payload = {
            'account_number': self.sender_account.account_number,
            'amount': '500.00',
            'description': 'ATM Cash'
        }
        response = self.client.post(reverse('transaction_withdraw'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.sender_account.refresh_from_db()
        self.assertEqual(self.sender_account.balance, Decimal('1500.00'))

    def test_withdrawal_insufficient_funds_rejected(self):
        self.client.force_authenticate(user=self.sender_user)
        payload = {
            'account_number': self.sender_account.account_number,
            'amount': '3000.00'
        }
        response = self.client.post(reverse('transaction_withdraw'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.sender_account.refresh_from_db()
        self.assertEqual(self.sender_account.balance, Decimal('2000.00'))

    def test_withdrawal_from_frozen_account_rejected(self):
        self.client.force_authenticate(user=self.sender_user)
        payload = {
            'account_number': self.frozen_account.account_number,
            'amount': '50.00'
        }
        response = self.client.post(reverse('transaction_withdraw'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.frozen_account.refresh_from_db()
        self.assertEqual(self.frozen_account.balance, Decimal('100.00'))

    def test_transfer_success_atomic(self):
        self.client.force_authenticate(user=self.sender_user)
        payload = {
            'source_account_number': self.sender_account.account_number,
            'destination_account_number': self.receiver_account.account_number,
            'amount': '600.00',
            'description': 'Shared bill payment'
        }
        response = self.client.post(reverse('transaction_transfer'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.sender_account.refresh_from_db()
        self.receiver_account.refresh_from_db()
        self.assertEqual(self.sender_account.balance, Decimal('1400.00'))
        self.assertEqual(self.receiver_account.balance, Decimal('1100.00'))

    def test_transfer_to_same_account_rejected(self):
        self.client.force_authenticate(user=self.sender_user)
        payload = {
            'source_account_number': self.sender_account.account_number,
            'destination_account_number': self.sender_account.account_number,
            'amount': '100.00'
        }
        response = self.client.post(reverse('transaction_transfer'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthorized_account_transfer_rejected(self):
        # Authenticate as receiver and try to transfer from sender's account
        self.client.force_authenticate(user=self.receiver_user)
        payload = {
            'source_account_number': self.sender_account.account_number,
            'destination_account_number': self.receiver_account.account_number,
            'amount': '100.00'
        }
        response = self.client.post(reverse('transaction_transfer'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_statement_csv_export(self):
        # Create a transaction
        Transaction.objects.create(
            transaction_ref='TXNCSV0001',
            transaction_type='DEPOSIT',
            destination_account=self.sender_account,
            amount=Decimal('100.00'),
            status='SUCCESS',
            description='Test deposit for CSV'
        )
        self.client.force_authenticate(user=self.sender_user)
        response = self.client.get(
            reverse('statement_export_csv') + f"?account_number={self.sender_account.account_number}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment; filename=', response['Content-Disposition'])
        self.assertIn('TXNCSV0001', response.content.decode('utf-8'))
