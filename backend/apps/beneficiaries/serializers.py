from rest_framework import serializers
from apps.beneficiaries.models import Beneficiary
from apps.banking.models import BankAccount

class BeneficiarySerializer(serializers.ModelSerializer):
    beneficiary_account_number = serializers.CharField(source='beneficiary_account.account_number', read_only=True)
    beneficiary_account_type = serializers.CharField(source='beneficiary_account.get_account_type_display', read_only=True)

    class Meta:
        model = Beneficiary
        fields = [
            'id', 'beneficiary_name', 'beneficiary_account_id',
            'beneficiary_account_number', 'beneficiary_account_type',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class BeneficiaryCreateSerializer(serializers.Serializer):
    beneficiary_name = serializers.CharField(max_length=150)
    account_number = serializers.CharField(max_length=12)

    def validate_account_number(self, value):
        account = BankAccount.objects.filter(account_number=value.strip()).first()
        if not account:
            raise serializers.ValidationError("Target bank account does not exist in SmartBank.")
        if account.status != BankAccount.STATUS_ACTIVE:
            raise serializers.ValidationError(f"Target account cannot be added because its status is {account.status}.")
        return value.strip()
