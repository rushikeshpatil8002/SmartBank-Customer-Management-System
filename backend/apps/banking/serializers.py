from decimal import Decimal
from rest_framework import serializers
from apps.banking.models import BankAccount
from apps.customers.models import CustomerProfile

class BankAccountSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    customer_username = serializers.CharField(source='customer.user.username', read_only=True)
    customer_id = serializers.IntegerField(source='customer.id', read_only=True)

    class Meta:
        model = BankAccount
        fields = [
            'id', 'account_number', 'customer_id', 'customer_name',
            'customer_username', 'account_type', 'balance',
            'status', 'currency', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'account_number', 'balance', 'created_at', 'updated_at']

class AccountCreateSerializer(serializers.Serializer):
    account_type = serializers.ChoiceField(
        choices=BankAccount.ACCOUNT_TYPE_CHOICES,
        default=BankAccount.TYPE_SAVINGS
    )
    initial_deposit = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        required=False,
        default=Decimal('0.00'),
        min_value=Decimal('0.00')
    )
    customer_id = serializers.IntegerField(required=False)

class AccountStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = ['status']
