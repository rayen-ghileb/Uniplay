from django.urls import path
from .views import (
    LoginView,
    RefreshView,
    LogoutView,
    MeView,
    UserListView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    ValidateStudentIdsView,
)

urlpatterns = [
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
]