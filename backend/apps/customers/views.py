from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q

from apps.customers.models import CustomerProfile
from apps.customers.serializers import CustomerProfileSerializer, CustomerCreateSerializer
from apps.accounts.permissions import IsStaffRole
from apps.audit.services import log_audit_event

class ProfileView(APIView):
    """View and update profile for the authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if hasattr(request.user, 'customer_profile'):
            serializer = CustomerProfileSerializer(request.user.customer_profile)
            return Response(serializer.data)
        return Response({
            'id': None,
            'user_id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'role': request.user.role,
            'full_name': request.user.get_full_name() or request.user.username,
            'accounts': []
        })

    def patch(self, request):
        if not hasattr(request.user, 'customer_profile'):
            return Response({'detail': 'Only customers have customer profiles.'}, status=status.HTTP_400_BAD_REQUEST)
        
        profile = request.user.customer_profile
        serializer = CustomerProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            log_audit_event(
                action='PROFILE_UPDATED',
                target_type='CustomerProfile',
                target_id=profile.id,
                user=request.user
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomerListCreateView(APIView):
    """
    Staff / Admin endpoint to list, search, and register customers.
    """
    permission_classes = [IsStaffRole]

    def get(self, request):
        queryset = CustomerProfile.objects.select_related('user').prefetch_related('accounts').all()
        
        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(user__username__icontains=search) |
                Q(phone_number__icontains=search) |
                Q(user__email__icontains=search)
            )

        status_param = request.query_params.get('status')
        if status_param == 'active':
            queryset = queryset.filter(user__is_active=True)
        elif status_param == 'inactive':
            queryset = queryset.filter(user__is_active=False)

        serializer = CustomerProfileSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CustomerCreateSerializer(data=request.data)
        if serializer.is_valid():
            profile = serializer.save()
            log_audit_event(
                action='CUSTOMER_CREATED_BY_STAFF',
                target_type='CustomerProfile',
                target_id=profile.id,
                user=request.user,
                details={'created_username': profile.user.username}
            )
            return Response(CustomerProfileSerializer(profile).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomerDetailView(APIView):
    """Staff / Admin retrieve, update, or deactivate a customer."""
    permission_classes = [IsStaffRole]

    def get(self, request, pk):
        profile = get_object_or_404(CustomerProfile.objects.select_related('user').prefetch_related('accounts'), pk=pk)
        return Response(CustomerProfileSerializer(profile).data)

    def patch(self, request, pk):
        profile = get_object_or_404(CustomerProfile, pk=pk)
        
        # If toggling active status on the user
        if 'is_active' in request.data:
            profile.user.is_active = bool(request.data['is_active'])
            profile.user.save()

        serializer = CustomerProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            log_audit_event(
                action='CUSTOMER_UPDATED_BY_STAFF',
                target_type='CustomerProfile',
                target_id=profile.id,
                user=request.user
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        profile = get_object_or_404(CustomerProfile, pk=pk)
        # Soft-deactivate user rather than hard-deleting financial records
        profile.user.is_active = False
        profile.user.save()
        log_audit_event(
            action='CUSTOMER_DEACTIVATED',
            target_type='CustomerProfile',
            target_id=profile.id,
            user=request.user
        )
        return Response({'message': 'Customer deactivated successfully.'}, status=status.HTTP_200_OK)
