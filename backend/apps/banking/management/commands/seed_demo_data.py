from decimal import Decimal
from datetime import date
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import User
from apps.customers.models import CustomerProfile
from apps.banking.models import BankAccount
from apps.transactions.models import Transaction
from apps.beneficiaries.models import Beneficiary
from apps.notifications.models import Notification
from apps.audit.services import log_audit_event

class Command(BaseCommand):
    help = 'Seeds initial demonstration data safely without creating duplicates'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding SmartBank demonstration data..."))

        with transaction.atomic():
            # 1. Admin User
            admin_user, created = User.objects.get_or_create(
                username='admin',
                defaults={
                    'email': 'admin@smartbank.local',
                    'role': User.ROLE_ADMIN,
                    'is_staff': True,
                    'is_superuser': True,
                }
            )
            if created:
                admin_user.set_password('AdminPassword123!')
                admin_user.save()
                self.stdout.write(self.style.SUCCESS("Created Admin: admin (Password: AdminPassword123!)"))
            else:
                self.stdout.write("Admin user already exists.")

            # 2. Staff User
            staff_user, created = User.objects.get_or_create(
                username='staff1',
                defaults={
                    'email': 'staff1@smartbank.local',
                    'role': User.ROLE_STAFF,
                    'is_staff': True,
                    'is_superuser': False,
                }
            )
            if created:
                staff_user.set_password('StaffPassword123!')
                staff_user.save()
                self.stdout.write(self.style.SUCCESS("Created Staff: staff1 (Password: StaffPassword123!)"))
            else:
                self.stdout.write("Staff user already exists.")

            # 3. Customer Alice
            alice_user, created = User.objects.get_or_create(
                username='alice',
                defaults={
                    'email': 'alice@smartbank.local',
                    'role': User.ROLE_CUSTOMER,
                }
            )
            if created:
                alice_user.set_password('AlicePassword123!')
                alice_user.save()

            alice_profile, _ = CustomerProfile.objects.get_or_create(
                user=alice_user,
                defaults={
                    'full_name': 'Alice Johnson',
                    'phone_number': '+1-555-0101',
                    'address': '742 Evergreen Terrace, Springfield',
                    'date_of_birth': date(1992, 4, 12),
                }
            )

            alice_acc1, _ = BankAccount.objects.get_or_create(
                account_number='SB1001000001',
                defaults={
                    'customer': alice_profile,
                    'account_type': BankAccount.TYPE_SAVINGS,
                    'balance': Decimal('5250.00'),
                    'status': BankAccount.STATUS_ACTIVE,
                }
            )

            alice_acc2, _ = BankAccount.objects.get_or_create(
                account_number='SB1001000002',
                defaults={
                    'customer': alice_profile,
                    'account_type': BankAccount.TYPE_CURRENT,
                    'balance': Decimal('1420.00'),
                    'status': BankAccount.STATUS_ACTIVE,
                }
            )

            # 4. Customer Bob
            bob_user, created = User.objects.get_or_create(
                username='bob',
                defaults={
                    'email': 'bob@smartbank.local',
                    'role': User.ROLE_CUSTOMER,
                }
            )
            if created:
                bob_user.set_password('BobPassword123!')
                bob_user.save()

            bob_profile, _ = CustomerProfile.objects.get_or_create(
                user=bob_user,
                defaults={
                    'full_name': 'Bob Williams',
                    'phone_number': '+1-555-0102',
                    'address': '124 Conch Street, Pacific Grove',
                    'date_of_birth': date(1988, 11, 23),
                }
            )

            bob_acc1, _ = BankAccount.objects.get_or_create(
                account_number='SB1002000001',
                defaults={
                    'customer': bob_profile,
                    'account_type': BankAccount.TYPE_SAVINGS,
                    'balance': Decimal('3800.00'),
                    'status': BankAccount.STATUS_ACTIVE,
                }
            )

            # 5. Customer Charlie (with a Frozen account for compliance/admin test)
            charlie_user, created = User.objects.get_or_create(
                username='charlie',
                defaults={
                    'email': 'charlie@smartbank.local',
                    'role': User.ROLE_CUSTOMER,
                }
            )
            if created:
                charlie_user.set_password('CharliePassword123!')
                charlie_user.save()

            charlie_profile, _ = CustomerProfile.objects.get_or_create(
                user=charlie_user,
                defaults={
                    'full_name': 'Charlie Brown',
                    'phone_number': '+1-555-0103',
                    'address': '320 Pinecrest Road, Maplewood',
                    'date_of_birth': date(1996, 7, 8),
                }
            )

            charlie_acc1, _ = BankAccount.objects.get_or_create(
                account_number='SB1003000001',
                defaults={
                    'customer': charlie_profile,
                    'account_type': BankAccount.TYPE_SAVINGS,
                    'balance': Decimal('890.00'),
                    'status': BankAccount.STATUS_FROZEN,
                }
            )

            # 6. Beneficiaries
            Beneficiary.objects.get_or_create(
                customer=alice_profile,
                beneficiary_account=bob_acc1,
                defaults={'beneficiary_name': 'Bob Williams', 'is_active': True}
            )
            Beneficiary.objects.get_or_create(
                customer=bob_profile,
                beneficiary_account=alice_acc1,
                defaults={'beneficiary_name': 'Alice Johnson', 'is_active': True}
            )

            # 7. Demo Transactions
            if not Transaction.objects.filter(destination_account=alice_acc1).exists():
                Transaction.objects.create(
                    transaction_ref='TXNDEMO000001',
                    transaction_type=Transaction.TYPE_DEPOSIT,
                    source_account=None,
                    destination_account=alice_acc1,
                    amount=Decimal('5000.00'),
                    status=Transaction.STATUS_SUCCESS,
                    description='Initial account funding via direct deposit'
                )
                Transaction.objects.create(
                    transaction_ref='TXNDEMO000002',
                    transaction_type=Transaction.TYPE_TRANSFER,
                    source_account=alice_acc1,
                    destination_account=bob_acc1,
                    amount=Decimal('250.00'),
                    status=Transaction.STATUS_SUCCESS,
                    description='Shared project contribution'
                )
                Transaction.objects.create(
                    transaction_ref='TXNDEMO000003',
                    transaction_type=Transaction.TYPE_WITHDRAWAL,
                    source_account=alice_acc2,
                    destination_account=None,
                    amount=Decimal('80.00'),
                    status=Transaction.STATUS_SUCCESS,
                    description='ATM cash withdrawal'
                )

            # 8. Demo Notifications
            Notification.objects.get_or_create(
                user=alice_user,
                title="Account Setup Complete",
                defaults={'message': 'Your SmartBank checking and savings accounts are active and ready.', 'is_read': False}
            )
            Notification.objects.get_or_create(
                user=bob_user,
                title="Received Transfer",
                defaults={'message': 'You received $250.00 from Alice Johnson. Reference: TXNDEMO000002.', 'is_read': False}
            )

            # 9. Audit Logs
            log_audit_event(
                action='SYSTEM_DEMO_SEED',
                target_type='System',
                target_id='DEMO',
                user=admin_user,
                details={'accounts_seeded': 4, 'customers_seeded': 3}
            )

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully!"))
