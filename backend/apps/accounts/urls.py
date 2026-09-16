from django.urls import path
from .views import (
    RegisterView,
    AdminUserListView,
    AdminUserDetailView,
    AdminStudentListView,
    LoginView,
    RefreshView,
    LogoutView,
    MeView,
    UserListView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    ValidateStudentIdsView,
    ChangePasswordView,
    ReclamationCreateView,
)

urlpatterns = [
    # Admin User Management
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("admin/users/<int:pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("admin/students/", AdminStudentListView.as_view(), name="admin-student-list"),

    # Public Auth & User Operations
    path("register/", RegisterView.as_view(), name="register"),
    path("users/", UserListView.as_view(), name="user-list"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", RefreshView.as_view(), name="refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("validate-students/", ValidateStudentIdsView.as_view(), name="validate-students"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path(
        "password-reset-confirm/",
        PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("reclamations/", ReclamationCreateView.as_view(), name="reclamation-create"),
]