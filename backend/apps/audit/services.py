from apps.audit.models import AuditLog

def log_audit_event(action, target_type, target_id, user=None, ip_address=None, details=None):
    """
    Safely creates an immutable audit trail entry.
    Ensures passwords, tokens, and sensitive secrets are omitted.
    """
    safe_details = details or {}
    # Filter any accidental secrets
    filtered_details = {
        k: v for k, v in safe_details.items()
        if k.lower() not in ['password', 'token', 'refresh', 'access', 'secret']
    }

    return AuditLog.objects.create(
        user=user,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        ip_address=ip_address,
        details=filtered_details
    )
