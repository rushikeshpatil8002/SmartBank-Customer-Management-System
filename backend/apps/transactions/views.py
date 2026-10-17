import csv
from datetime import datetime
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.core.exceptions import ValidationError
from rest_framework import views, status, permissions
from rest_framework.response import Response

from apps.transactions.models import Transaction
from apps.transactions.services import TransactionService
from apps.transactions.serializers import (
    TransactionSerializer, DepositSerializer, WithdrawalSerializer, TransferSerializer
)
from apps.banking.models import BankAccount

class TransactionListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        queryset = Transaction.objects.select_related(
            'source_account', 'destination_account',
            'source_account__customer', 'destination_account__customer'
        ).all()

        if not user.is_staff_role:
            if not hasattr(user, 'customer_profile'):
                return Response([])
            profile = user.customer_profile
            queryset = queryset.filter(
                Q(source_account__customer=profile) | Q(destination_account__customer=profile)
            )

        # Filters
        account_number = request.query_params.get('account_number')
        if account_number:
            queryset = queryset.filter(
                Q(source_account__account_number=account_number) |
                Q(destination_account__account_number=account_number)
            )

        txn_type = request.query_params.get('type')
        if txn_type:
            queryset = queryset.filter(transaction_type=txn_type.upper())

        start_date = request.query_params.get('start_date')
        if start_date:
            try:
                parsed_start = datetime.strptime(start_date, '%Y-%m-%d')
                queryset = queryset.filter(created_at__date__gte=parsed_start)
            except ValueError:
                pass

        end_date = request.query_params.get('end_date')
        if end_date:
            try:
                parsed_end = datetime.strptime(end_date, '%Y-%m-%d')
                queryset = queryset.filter(created_at__date__lte=parsed_end)
            except ValueError:
                pass

        serializer = TransactionSerializer(queryset[:100], many=True)
        return Response(serializer.data)

class TransactionDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        user = request.user
        txn = get_object_or_404(
            Transaction.objects.select_related('source_account', 'destination_account'),
            pk=pk
        )
        if not user.is_staff_role:
            if not hasattr(user, 'customer_profile'):
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            profile = user.customer_profile
            user_owns_source = txn.source_account and txn.source_account.customer == profile
            user_owns_dest = txn.destination_account and txn.destination_account.customer == profile
            if not (user_owns_source or user_owns_dest):
                return Response({'detail': 'You do not have permission to view this transaction.'}, status=status.HTTP_403_FORBIDDEN)

        return Response(TransactionSerializer(txn).data)

class DepositView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DepositSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            txn = TransactionService.process_deposit(
                account_number=data['account_number'],
                amount=data['amount'],
                description=data.get('description'),
                user=request.user,
                ip_address=request.META.get('REMOTE_ADDR')
            )
            return Response(TransactionSerializer(txn).data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'detail': str(e.message if hasattr(e, 'message') else e)}, status=status.HTTP_400_BAD_REQUEST)

class WithdrawalView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = WithdrawalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            txn = TransactionService.process_withdrawal(
                account_number=data['account_number'],
                amount=data['amount'],
                description=data.get('description'),
                user=request.user,
                ip_address=request.META.get('REMOTE_ADDR')
            )
            return Response(TransactionSerializer(txn).data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'detail': str(e.message if hasattr(e, 'message') else e)}, status=status.HTTP_400_BAD_REQUEST)

class TransferView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = TransferSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            txn = TransactionService.process_transfer(
                source_account_number=data['source_account_number'],
                destination_account_number=data['destination_account_number'],
                amount=data['amount'],
                description=data.get('description'),
                user=request.user,
                ip_address=request.META.get('REMOTE_ADDR')
            )
            return Response(TransactionSerializer(txn).data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'detail': str(e.message if hasattr(e, 'message') else e)}, status=status.HTTP_400_BAD_REQUEST)

class ExportStatementCSVView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        account_number = request.query_params.get('account_number')
        if not account_number:
            return Response({'detail': 'Query parameter account_number is required.'}, status=status.HTTP_400_BAD_REQUEST)

        account = get_object_or_404(BankAccount, account_number=account_number)
        if not user.is_staff_role:
            if not hasattr(user, 'customer_profile') or account.customer != user.customer_profile:
                return Response({'detail': 'You are not authorized to export statements for this account.'}, status=status.HTTP_403_FORBIDDEN)

        queryset = Transaction.objects.filter(
            Q(source_account=account) | Q(destination_account=account)
        ).order_by('-created_at')

        start_date = request.query_params.get('start_date')
        if start_date:
            try:
                queryset = queryset.filter(created_at__date__gte=datetime.strptime(start_date, '%Y-%m-%d'))
            except ValueError:
                pass

        end_date = request.query_params.get('end_date')
        if end_date:
            try:
                queryset = queryset.filter(created_at__date__lte=datetime.strptime(end_date, '%Y-%m-%d'))
            except ValueError:
                pass

        # CSV formula injection sanitizer
        def sanitize_cell(val):
            s = str(val or '')
            if s and s[0] in ['=', '+', '-', '@', '\t', '\r']:
                return "'" + s
            return s

        response = HttpResponse(content_type='text/csv')
        filename = f"SmartBank_Statement_{account_number}_{datetime.now().strftime('%Y%m%d')}.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        writer.writerow(['Transaction Reference', 'Date', 'Type', 'Debit/Credit', 'Amount (USD)', 'Source Account', 'Destination Account', 'Status', 'Description'])

        for t in queryset:
            is_credit = t.destination_account == account
            direction = "CREDIT" if is_credit else "DEBIT"
            writer.writerow([
                sanitize_cell(t.transaction_ref),
                sanitize_cell(t.created_at.strftime('%Y-%m-%d %H:%M:%S')),
                sanitize_cell(t.transaction_type),
                direction,
                sanitize_cell(f"{t.amount:.2f}"),
                sanitize_cell(t.source_account.account_number if t.source_account else 'EXTERNAL / CASH'),
                sanitize_cell(t.destination_account.account_number if t.destination_account else 'EXTERNAL / CASH'),
                sanitize_cell(t.status),
                sanitize_cell(t.description),
            ])

        return response
