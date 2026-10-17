from django.db import models

class Beneficiary(models.Model):
    customer = models.ForeignKey(
        'customers.CustomerProfile',
        on_delete=models.CASCADE,
        related_name='beneficiaries'
    )
    beneficiary_name = models.CharField(max_length=150)
    beneficiary_account = models.ForeignKey(
        'banking.BankAccount',
        on_delete=models.CASCADE,
        related_name='beneficiary_entries'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('customer', 'beneficiary_account')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.beneficiary_name} ({self.beneficiary_account.account_number})"
