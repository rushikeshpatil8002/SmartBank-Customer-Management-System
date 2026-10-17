from decimal import Decimal
from django.db import transaction
from django.db.models import Sum, Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import views, status, permissions
from rest_framework.response import Response

from apps.banking.models import BankAccount
from apps.banking.serializers import BankAccountSerializer, AccountCreateSerializer, AccountStatusUpdateSerializer
from apps.customers.models import CustomerProfile
from apps.accounts.permissions import IsStaffRole, IsAdminRole
from apps.transactions.models import Transaction
from apps.notifications.models import Notification
from apps.audit.services import log_audit_event

class AccountListCreateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_staff_role:
            queryset = BankAccount.objects.select_related('customer', 'customer__user').all()
            search = request.query_params.get('search', '').strip()
            if search:
                queryset = queryset.filter(
                    Q(account_number__icontains=search) |
                    Q(customer__full_name__icontains=search) |
                    Q(customer__user__username__icontains=search)
                )
            status_param = request.query_params.get('status')
            if status_param:
                queryset = queryset.filter(status=status_param.upper())
            account_type = request.query_params.get('account_type')
            if account_type:
                queryset = queryset.filter(account_type=account_type.upper())
        else:
            if not hasattr(user, 'customer_profile'):
                return Response([])
            queryset = BankAccount.objects.filter(customer=user.customer_profile)

        serializer = BankAccountSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        user = request.user
        serializer = AccountCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        initial_deposit = data.get('initial_deposit', Decimal('0.00'))
        account_type = data.get('account_type', BankAccount.TYPE_SAVINGS)

        if user.is_staff_role and 'customer_id' in data:
            customer = get_object_or_404(CustomerProfile, id=data['customer_id'])
        else:
            if not hasattr(user, 'customer_profile'):
                return Response({'detail': 'User has no customer profile.'}, status=status.HTTP_400_BAD_REQUEST)
            customer = user.customer_profile

        with transaction.atomic():
            account = BankAccount.objects.create(
                customer=customer,
                account_type=account_type,
                balance=initial_deposit,
                status=BankAccount.STATUS_ACTIVE
            )
            Notification.objects.create(
                user=customer.user,
                title="New Account Opened",
                message=f"A new {account.get_account_type_display()} ({account.account_number}) was created with balance ${initial_deposit}."
            )
            log_audit_event(
                action='ACCOUNT_CREATED',
                target_type='BankAccount',
                target_id=account.id,
                user=user,
                details={'account_number': account.account_number, 'balance': str(account.balance)}
            )

        return Response(BankAccountSerializer(account).data, status=status.HTTP_201_CREATED)

class AccountDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        user = request.user
        if user.is_staff_role:
            account = get_object_or_404(BankAccount.objects.select_related('customer', 'customer__user'), pk=pk)
        else:
            if not hasattr(user, 'customer_profile'):
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            account = get_object_or_404(BankAccount, pk=pk, customer=user.customer_profile)

        return Response(BankAccountSerializer(account).data)

class AccountStatusUpdateView(views.APIView):
    permission_classes = [IsStaffRole]

    def patch(self, request, pk):
        account = get_object_or_404(BankAccount, pk=pk)
        serializer = AccountStatusUpdateSerializer(account, data=request.data, partial=True)
        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            account.status = new_status
            account.save()
            Notification.objects.create(
                user=account.customer.user,
                title="Account Status Updated",
                message=f"Your account {account.account_number} status changed to {new_status}."
            )
            log_audit_event(
                action='ACCOUNT_STATUS_CHANGED',
                target_type='BankAccount',
                target_id=account.id,
                user=request.user,
                details={'new_status': new_status}
            )
            return Response(BankAccountSerializer(account).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DashboardSummaryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_staff_role:
            total_customers = CustomerProfile.objects.count()
            total_accounts = BankAccount.objects.count()
            active_accounts = BankAccount.objects.filter(status=BankAccount.STATUS_ACTIVE).count()
            frozen_accounts = BankAccount.objects.filter(status=BankAccount.STATUS_FROZEN).count()
            closed_accounts = BankAccount.objects.filter(status=BankAccount.STATUS_CLOSED).count()
            
            total_deposits = Transaction.objects.filter(
                transaction_type=Transaction.TYPE_DEPOSIT,
                status=Transaction.STATUS_SUCCESS
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            total_withdrawals = Transaction.objects.filter(
                transaction_type=Transaction.TYPE_WITHDRAWAL,
                status=Transaction.STATUS_SUCCESS
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            total_transfers = Transaction.objects.filter(
                transaction_type=Transaction.TYPE_TRANSFER,
                status=Transaction.STATUS_SUCCESS
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            recent_transactions = Transaction.objects.select_related(
                'source_account', 'destination_account'
            ).order_by('-created_at')[:8]

            from apps.transactions.serializers import TransactionSerializer
            return Response({
                'role': user.role,
                'metrics': {
                    'total_customers': total_customers,
                    'total_accounts': total_accounts,
                    'active_accounts': active_accounts,
                    'frozen_accounts': frozen_accounts,
                    'closed_accounts': closed_accounts,
                    'total_deposits': str(total_deposits),
                    'total_withdrawals': str(total_withdrawals),
                    'total_transfers': str(total_transfers),
                },
                'recent_transactions': TransactionSerializer(recent_transactions, many=True).data
            })
        else:
            if not hasattr(user, 'customer_profile'):
                return Response({
                    'role': user.role,
                    'greeting': f"Hello, {user.username}!",
                    'total_balance': "0.00",
                    'accounts': [],
                    'recent_transactions': [],
                    'unread_notifications_count': 0
                })

            profile = user.customer_profile
            accounts = BankAccount.objects.filter(customer=profile)
            total_balance = accounts.aggregate(total=Sum('balance'))['total'] or Decimal('0.00')
            unread_count = Notification.objects.filter(user=user, is_read=False).count()

            recent_transactions = Transaction.objects.filter(
                Q(source_account__customer=profile) | Q(destination_account__customer=profile)
            ).select_related('source_account', 'destination_account').order_by('-created_at')[:6]

            from apps.transactions.serializers import TransactionSerializer
            return Response({
                'role': user.role,
                'greeting': f"Welcome back, {profile.full_name}!",
                'total_balance': str(total_balance),
                'accounts': BankAccountSerializer(accounts, many=True).data,
                'recent_transactions': TransactionSerializer(recent_transactions, many=True).data,
                'unread_notifications_count': unread_count
            })
