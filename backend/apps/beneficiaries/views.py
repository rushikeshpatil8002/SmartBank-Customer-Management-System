from django.shortcuts import get_object_or_404
from rest_framework import views, status, permissions
from rest_framework.response import Response

from apps.beneficiaries.models import Beneficiary
from apps.beneficiaries.serializers import BeneficiarySerializer, BeneficiaryCreateSerializer
from apps.banking.models import BankAccount
from apps.audit.services import log_audit_event

class BeneficiaryListCreateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'customer_profile'):
            return Response([])
        beneficiaries = Beneficiary.objects.filter(
            customer=user.customer_profile,
            is_active=True
        ).select_related('beneficiary_account')
        return Response(BeneficiarySerializer(beneficiaries, many=True).data)

    def post(self, request):
        user = request.user
        if not hasattr(user, 'customer_profile'):
            return Response({'detail': 'Only customers can manage beneficiaries.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = BeneficiaryCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        target_acc_num = serializer.validated_data['account_number']
        name = serializer.validated_data['beneficiary_name']
        customer = user.customer_profile

        target_account = BankAccount.objects.get(account_number=target_acc_num)
        if target_account.customer == customer:
            return Response({'detail': 'You cannot add your own account as a beneficiary.'}, status=status.HTTP_400_BAD_REQUEST)

        beneficiary, created = Beneficiary.objects.get_or_create(
            customer=customer,
            beneficiary_account=target_account,
            defaults={'beneficiary_name': name, 'is_active': True}
        )

        if not created:
            if not beneficiary.is_active:
                beneficiary.is_active = True
                beneficiary.beneficiary_name = name
                beneficiary.save()
            else:
                return Response({'detail': 'This account is already in your beneficiary list.'}, status=status.HTTP_400_BAD_REQUEST)

        log_audit_event(
            action='BENEFICIARY_ADDED',
            target_type='Beneficiary',
            target_id=beneficiary.id,
            user=user,
            details={'beneficiary_name': name, 'account_number': target_acc_num}
        )

        return Response(BeneficiarySerializer(beneficiary).data, status=status.HTTP_201_CREATED)

class BeneficiaryDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        user = request.user
        if not hasattr(user, 'customer_profile'):
            return Response({'detail': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)

        beneficiary = get_object_or_404(Beneficiary, pk=pk, customer=user.customer_profile)
        beneficiary.is_active = False
        beneficiary.save()

        log_audit_event(
            action='BENEFICIARY_DEACTIVATED',
            target_type='Beneficiary',
            target_id=beneficiary.id,
            user=user
        )

        return Response({'message': 'Beneficiary removed successfully.'}, status=status.HTTP_200_OK)
