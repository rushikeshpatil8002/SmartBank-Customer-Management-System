from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError
from django.db.models import Q

from apps.banking.models import BankAccount
from apps.transactions.models import Transaction
from apps.notifications.models import Notification
from apps.audit.services import log_audit_event

class TransactionService:
    @staticmethod
    def process_deposit(account_number, amount, description, user=None, ip_address=None):
        """
        Executes a simulated cash/check deposit into an active account.
        """
        if amount <= Decimal('0.00'):
            raise ValidationError("Deposit amount must be strictly greater than 0.")

        with transaction.atomic():
            account = BankAccount.objects.select_for_update().filter(account_number=account_number).first()
            if not account:
                raise ValidationError("Account not found.")

            if account.status != BankAccount.STATUS_ACTIVE:
                raise ValidationError(f"Cannot deposit into an account with status: {account.status}.")

            # Update account balance
            account.balance += amount
            account.save(update_fields=['balance', 'updated_at'])

            # Create transaction record
            txn = Transaction.objects.create(
                transaction_type=Transaction.TYPE_DEPOSIT,
                source_account=None,
                destination_account=account,
                amount=amount,
                status=Transaction.STATUS_SUCCESS,
                description=description or f"Simulated deposit into {account.account_number}"
            )

            # In-app notification
            Notification.objects.create(
                user=account.customer.user,
                title="Deposit Processed",
                message=f"Deposit of ${amount:.2f} credited to {account.account_number}. Current balance: ${account.balance:.2f}."
            )

            # Audit log
            log_audit_event(
                action='TRANSACTION_DEPOSIT',
                target_type='Transaction',
                target_id=txn.id,
                user=user or account.customer.user,
                ip_address=ip_address,
                details={'account_number': account.account_number, 'amount': str(amount), 'ref': txn.transaction_ref}
            )

            return txn

    @staticmethod
    def process_withdrawal(account_number, amount, description, user=None, ip_address=None):
        """
        Executes a simulated cash withdrawal from an active account.
        """
        if amount <= Decimal('0.00'):
            raise ValidationError("Withdrawal amount must be strictly greater than 0.")

        with transaction.atomic():
            account = BankAccount.objects.select_for_update().filter(account_number=account_number).first()
            if not account:
                raise ValidationError("Account not found.")

            if account.status != BankAccount.STATUS_ACTIVE:
                raise ValidationError(f"Cannot withdraw from an account with status: {account.status}.")

            # Verify ownership if user is customer
            if user and not user.is_staff_role:
                if not hasattr(user, 'customer_profile') or account.customer != user.customer_profile:
                    raise ValidationError("You do not have permission to withdraw from this account.")

            if account.balance < amount:
                raise ValidationError(f"Insufficient funds. Available balance is ${account.balance:.2f}.")

            # Decrement balance
            account.balance -= amount
            account.save(update_fields=['balance', 'updated_at'])

            txn = Transaction.objects.create(
                transaction_type=Transaction.TYPE_WITHDRAWAL,
                source_account=account,
                destination_account=None,
                amount=amount,
                status=Transaction.STATUS_SUCCESS,
                description=description or f"Simulated withdrawal from {account.account_number}"
            )

            Notification.objects.create(
                user=account.customer.user,
                title="Withdrawal Processed",
                message=f"Withdrawal of ${amount:.2f} debited from {account.account_number}. Remaining balance: ${account.balance:.2f}."
            )

            log_audit_event(
                action='TRANSACTION_WITHDRAWAL',
                target_type='Transaction',
                target_id=txn.id,
                user=user or account.customer.user,
                ip_address=ip_address,
                details={'account_number': account.account_number, 'amount': str(amount), 'ref': txn.transaction_ref}
            )

            return txn

    @staticmethod
    def process_transfer(source_account_number, destination_account_number, amount, description, user=None, ip_address=None):
        """
        Executes an internal account-to-account transfer with pessimistic row locking.
        """
        if amount <= Decimal('0.00'):
            raise ValidationError("Transfer amount must be strictly greater than 0.")

        if source_account_number.strip() == destination_account_number.strip():
            raise ValidationError("Source and destination accounts must be different.")

        with transaction.atomic():
            # Lock rows in deterministic order based on account_number to prevent deadlocks
            ordered_numbers = sorted([source_account_number.strip(), destination_account_number.strip()])
            locked_accounts = {
                acc.account_number: acc
                for acc in BankAccount.objects.select_for_update().filter(account_number__in=ordered_numbers)
            }

            source_acc = locked_accounts.get(source_account_number.strip())
            dest_acc = locked_accounts.get(destination_account_number.strip())

            if not source_acc:
                raise ValidationError(f"Source account {source_account_number} not found.")
            if not dest_acc:
                raise ValidationError(f"Destination account {destination_account_number} not found.")

            if source_acc.status != BankAccount.STATUS_ACTIVE:
                raise ValidationError(f"Source account status is {source_acc.status}. Transfers are disabled.")
            if dest_acc.status != BankAccount.STATUS_ACTIVE:
                raise ValidationError(f"Destination account status is {dest_acc.status}. It cannot receive funds.")

            # Authorization check
            if user and not user.is_staff_role:
                if not hasattr(user, 'customer_profile') or source_acc.customer != user.customer_profile:
                    raise ValidationError("You do not own the source account.")

            if source_acc.balance < amount:
                raise ValidationError(f"Insufficient funds. Source balance is ${source_acc.balance:.2f}.")

            # Transfer execution
            source_acc.balance -= amount
            source_acc.save(update_fields=['balance', 'updated_at'])

            dest_acc.balance += amount
            dest_acc.save(update_fields=['balance', 'updated_at'])

            txn = Transaction.objects.create(
                transaction_type=Transaction.TYPE_TRANSFER,
                source_account=source_acc,
                destination_account=dest_acc,
                amount=amount,
                status=Transaction.STATUS_SUCCESS,
                description=description or f"Transfer from {source_acc.account_number} to {dest_acc.account_number}"
            )

            # Notifications
            Notification.objects.create(
                user=source_acc.customer.user,
                title="Transfer Sent",
                message=f"You transferred ${amount:.2f} from {source_acc.account_number} to {dest_acc.account_number}. Reference: {txn.transaction_ref}."
            )

            if source_acc.customer.user != dest_acc.customer.user:
                Notification.objects.create(
                    user=dest_acc.customer.user,
                    title="Funds Received",
                    message=f"You received ${amount:.2f} into {dest_acc.account_number} from {source_acc.customer.full_name}. Reference: {txn.transaction_ref}."
                )

            # Audit log
            log_audit_event(
                action='TRANSACTION_TRANSFER',
                target_type='Transaction',
                target_id=txn.id,
                user=user or source_acc.customer.user,
                ip_address=ip_address,
                details={
                    'source': source_acc.account_number,
                    'destination': dest_acc.account_number,
                    'amount': str(amount),
                    'ref': txn.transaction_ref
                }
            )

            return txn
