from rest_framework import status, views, permissions
from rest_framework.response import Response

from apps.accounts.serializers import RegisterSerializer, LoginSerializer, UserSerializer
from apps.audit.services import log_audit_event

class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user, account = serializer.save()
            return Response({
                'message': 'Registration successful! Your bank account is ready.',
                'user': UserSerializer(user).data,
                'account_number': account.account_number,
                'account_type': account.account_type,
                'initial_balance': str(account.balance)
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            user = data['user']
            log_audit_event(
                action='USER_LOGIN',
                target_type='User',
                target_id=user.id,
                user=user,
                ip_address=request.META.get('REMOTE_ADDR')
            )
            return Response({
                'access': data['access'],
                'refresh': data['refresh'],
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CurrentUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
