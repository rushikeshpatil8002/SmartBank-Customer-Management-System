from rest_framework import serializers
from apps.audit.models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True, default='System')

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user_id', 'username', 'action',
            'target_type', 'target_id', 'ip_address',
            'details', 'created_at'
        ]
        read_only_fields = fields
