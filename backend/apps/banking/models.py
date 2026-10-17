import random
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator

def generate_account_number():
    """Generates a unique 12-character bank account number prefixed with SB."""
    suffix = ''.join([str(random.randint(0, 9)) for _ in range(10)])
    return f"SB{suffix}"

class BankAccount(models.Model):
    TYPE_SAVINGS = 'SAVINGS'
    TYPE_CURRENT = 'CURRENT'
    ACCOUNT_TYPE_CHOICES = [
        (TYPE_SAVINGS, 'Savings Account'),
        (TYPE_CURRENT, 'Current Account'),
    ]

    STATUS_ACTIVE = 'ACTIVE'
    STATUS_FROZEN = 'FROZEN'
    STATUS_CLOSED = 'CLOSED'
    ACCOUNT_STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_FROZEN, 'Frozen'),
        (STATUS_CLOSED, 'Closed'),
    ]

    customer = models.ForeignKey(
        'customers.CustomerProfile',
        on_delete=models.PROTECT,
        related_name='accounts'
    )
    account_number = models.CharField(
        max_length=12,
        unique=True,
        db_index=True,
        default=generate_account_number
    )
    account_type = models.CharField(
        max_length=20,
        choices=ACCOUNT_TYPE_CHOICES,
        default=TYPE_SAVINGS
    )
    balance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    status = models.CharField(
        max_length=20,
        choices=ACCOUNT_STATUS_CHOICES,
        default=STATUS_ACTIVE
    )
    currency = models.CharField(max_length=3, default='USD')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_operational(self):
        """Returns True if the account is active and can process debits/credits."""
        return self.status == self.STATUS_ACTIVE

    def __str__(self):
        return f"{self.account_number} ({self.get_account_type_display()} - {self.status}) - ${self.balance}"

    class Meta:
        ordering = ['-created_at']
