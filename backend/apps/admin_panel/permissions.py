from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to authenticated users who have the is_admin flag set to True.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'is_admin', False))