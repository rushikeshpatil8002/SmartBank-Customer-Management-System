from decimal import Decimal
from rest_framework import serializers
from apps.transactions.models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    source_account_number = serializers.CharField(source='source_account.account_number', read_only=True, default=None)
    destination_account_number = serializers.CharField(source='destination_account.account_number', read_only=True, default=None)
    source_customer_name = serializers.CharField(source='source_account.customer.full_name', read_only=True, default=None)
    destination_customer_name = serializers.CharField(source='destination_account.customer.full_name', read_only=True, default=None)

    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_ref', 'transaction_type',
            'source_account_number', 'destination_account_number',
            'source_customer_name', 'destination_customer_name',
            'amount', 'status', 'description', 'created_at'
        ]
        read_only_fields = fields

class DepositSerializer(serializers.Serializer):
    account_number = serializers.CharField(max_length=12)
    amount = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=Decimal('0.01'))
    description = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')

class WithdrawalSerializer(serializers.Serializer):
    account_number = serializers.CharField(max_length=12)
    amount = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=Decimal('0.01'))
    description = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')

class TransferSerializer(serializers.Serializer):
    source_account_number = serializers.CharField(max_length=12)
    destination_account_number = serializers.CharField(max_length=12)
    amount = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=Decimal('0.01'))
    description = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
