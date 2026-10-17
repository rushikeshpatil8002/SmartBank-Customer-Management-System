import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator

def generate_transaction_ref():
    """Generates a unique 20-character transaction reference string."""
    return f"TXN{uuid.uuid4().hex[:16].upper()}"

class Transaction(models.Model):
    TYPE_DEPOSIT = 'DEPOSIT'
    TYPE_WITHDRAWAL = 'WITHDRAWAL'
    TYPE_TRANSFER = 'TRANSFER'
    TRANSACTION_TYPE_CHOICES = [
        (TYPE_DEPOSIT, 'Deposit'),
        (TYPE_WITHDRAWAL, 'Withdrawal'),
        (TYPE_TRANSFER, 'Internal Transfer'),
    ]

    STATUS_SUCCESS = 'SUCCESS'
    STATUS_FAILED = 'FAILED'
    TRANSACTION_STATUS_CHOICES = [
        (STATUS_SUCCESS, 'Success'),
        (STATUS_FAILED, 'Failed'),
    ]

    transaction_ref = models.CharField(
        max_length=32,
        unique=True,
        db_index=True,
        default=generate_transaction_ref
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPE_CHOICES
    )
    source_account = models.ForeignKey(
        'banking.BankAccount',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='outgoing_transactions'
    )
    destination_account = models.ForeignKey(
        'banking.BankAccount',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='incoming_transactions'
    )
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    status = models.CharField(
        max_length=20,
        choices=TRANSACTION_STATUS_CHOICES,
        default=STATUS_SUCCESS
    )
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        return f"{self.transaction_ref} [{self.transaction_type}] ${self.amount} ({self.status})"

    class Meta:
        ordering = ['-created_at']
