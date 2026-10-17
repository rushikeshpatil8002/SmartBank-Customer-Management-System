from rest_framework import serializers
from apps.customers.models import CustomerProfile
from apps.accounts.models import User
from apps.banking.models import BankAccount
from apps.audit.services import log_audit_event

class CustomerBankAccountSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = ['id', 'account_number', 'account_type', 'balance', 'status', 'currency', 'created_at']

class CustomerProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    accounts = CustomerBankAccountSummarySerializer(many=True, read_only=True)

    class Meta:
        model = CustomerProfile
        fields = [
            'id', 'user_id', 'username', 'email', 'full_name',
            'phone_number', 'address', 'date_of_birth',
            'is_active', 'accounts', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_id', 'created_at', 'updated_at']

class CustomerCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=False, allow_blank=True)
    full_name = serializers.CharField(max_length=255)
    phone_number = serializers.CharField(max_length=20)
    address = serializers.CharField()
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    account_type = serializers.ChoiceField(
        choices=BankAccount.ACCOUNT_TYPE_CHOICES,
        default=BankAccount.TYPE_SAVINGS
    )

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            role=User.ROLE_CUSTOMER
        )
        profile = CustomerProfile.objects.create(
            user=user,
            full_name=validated_data['full_name'],
            phone_number=validated_data['phone_number'],
            address=validated_data['address'],
            date_of_birth=validated_data.get('date_of_birth')
        )
        account = BankAccount.objects.create(
            customer=profile,
            account_type=validated_data.get('account_type', BankAccount.TYPE_SAVINGS)
        )
        return profile
