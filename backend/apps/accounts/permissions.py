from rest_framework import permissions

class IsAdminRole(permissions.BasePermission):
    """Allows access only to Admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin_role)

class IsStaffRole(permissions.BasePermission):
    """Allows access to Bank Staff and Admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff_role)

class IsCustomerRole(permissions.BasePermission):
    """Allows access to Customer users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_customer_role)

class IsOwnerOrStaff(permissions.BasePermission):
    """
    Object-level permission allowing owners or staff/admin to view/edit.
    Assumes object has either `user` attribute or `customer.user` attribute.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff_role:
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'customer') and hasattr(obj.customer, 'user'):
            return obj.customer.user == request.user
        return False
