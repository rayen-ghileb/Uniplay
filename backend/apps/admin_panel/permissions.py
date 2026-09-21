from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Allows authenticated admins and employees to use the frontend admin panel.
    """
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                getattr(request.user, "is_admin", False)
                or getattr(request.user, "is_superadmin", False)
                or getattr(request.user, "is_employee", False)
            )
        )