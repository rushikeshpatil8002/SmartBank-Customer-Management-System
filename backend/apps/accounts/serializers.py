from decimal import Decimal
from django.db import transaction
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.customers.models import CustomerProfile
from apps.banking.models import BankAccount
from apps.notifications.models import Notification
from apps.audit.services import log_audit_event

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    customer_profile_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role',
            'is_active', 'date_joined', 'full_name',
            'customer_profile_id'
        ]
        read_only_fields = ['id', 'role', 'is_active', 'date_joined']

    def get_full_name(self, obj):
        if hasattr(obj, 'customer_profile'):
            return obj.customer_profile.full_name
        return obj.get_full_name() or obj.username

    def get_customer_profile_id(self, obj):
        if hasattr(obj, 'customer_profile'):
            return obj.customer_profile.id
        return None

class RegisterSerializer(serializers.Serializer):
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
    initial_deposit = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        required=False,
        default=Decimal('100.00'),
        min_value=Decimal('0.00')
    )

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def create(self, validated_data):
        username = validated_data['username']
        password = validated_data['password']
        email = validated_data.get('email', '')
        full_name = validated_data['full_name']
        phone_number = validated_data['phone_number']
        address = validated_data['address']
        date_of_birth = validated_data.get('date_of_birth')
        account_type = validated_data.get('account_type', BankAccount.TYPE_SAVINGS)
        initial_deposit = validated_data.get('initial_deposit', Decimal('100.00'))

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
                role=User.ROLE_CUSTOMER
            )
            profile = CustomerProfile.objects.create(
                user=user,
                full_name=full_name,
                phone_number=phone_number,
                address=address,
                date_of_birth=date_of_birth
            )
            account = BankAccount.objects.create(
                customer=profile,
                account_type=account_type,
                balance=initial_deposit,
                status=BankAccount.STATUS_ACTIVE
            )
            Notification.objects.create(
                user=user,
                title="Welcome to SmartBank!",
                message=f"Welcome {full_name}! Your {account.get_account_type_display()} ({account.account_number}) has been created with an opening balance of ${initial_deposit}."
            )
            log_audit_event(
                action='CUSTOMER_REGISTERED',
                target_type='User',
                target_id=user.id,
                user=user,
                details={'username': username, 'account_number': account.account_number}
            )

        return user, account

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("Invalid credentials. Please verify your username and password.")

        if not user.is_active:
            raise serializers.ValidationError("This user account is inactive. Please contact bank administration.")

        refresh = RefreshToken.for_user(user)
        # Add custom claims to the JWT payload
        refresh['username'] = user.username
        refresh['role'] = user.role

        return {
            'user': user,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
