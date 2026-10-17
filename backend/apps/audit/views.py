from rest_framework import views, permissions
from rest_framework.response import Response
from apps.audit.models import AuditLog
from apps.audit.serializers import AuditLogSerializer
from apps.accounts.permissions import IsStaffRole

class AuditLogListView(views.APIView):
    permission_classes = [IsStaffRole]

    def get(self, request):
        queryset = AuditLog.objects.select_related('user').all()

        action = request.query_params.get('action')
        if action:
            queryset = queryset.filter(action__icontains=action)

        target_type = request.query_params.get('target_type')
        if target_type:
            queryset = queryset.filter(target_type__icontains=target_type)

        username = request.query_params.get('username')
        if username:
            queryset = queryset.filter(user__username__icontains=username)

        serializer = AuditLogSerializer(queryset[:100], many=True)
        return Response(serializer.data)
