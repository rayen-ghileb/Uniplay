from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.conf import settings
from django.db.models.deletion import ProtectedError
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from .permissions import IsAdmin
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    StudentSerializer,
    RegisterSerializer,
    StudentIdValidationSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    ChangePasswordSerializer,
    ReclamationCreateSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Handles student registration. Accounts are inactive by default."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class AdminUserListView(generics.ListAPIView):
    """Lists all users. Orders pending (inactive) accounts at the very top."""
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        # is_active=False comes first, then ordered by newest registrations
        return User.objects.all().order_by("is_active", "-date_joined")


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Allows admins to approve, deactivate, reactivate, or reject accounts."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        is_active = request.data.get("is_active")
        data = request.data.copy()

        if is_active is False and user.is_active:
            data["is_deactivated"] = True
        elif is_active is True:
            data["is_deactivated"] = False

        serializer = self.get_serializer(user, data=data, partial=kwargs.get("partial", False))
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.is_active or user.is_deactivated:
            return Response(
                {"detail": "Un compte actif ou désactivé ne peut pas être supprimé."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user.delete()
        except ProtectedError:
            return Response(
                {"detail": "Ce compte possède un historique et ne peut pas être supprimé."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserListView(generics.ListAPIView):
    """
    Returns all registered and active users except administrators for the searchable participant dropdown menu.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Excludes admins and pending accounts from the dropdown results
        return User.objects.filter(is_admin=False, is_active=True).order_by("first_name", "last_name")


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"detail": "Logout successful."},
                status=status.HTTP_200_OK,
            )
        except KeyError:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            return Response(
                {"detail": "Invalid token."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    ALLOWED_UPDATE_FIELDS = {"first_name", "last_name", "email", "phone_number", "classe", "specialite", "photo"}

    def get(self, request):
        serializer = UserSerializer(request.user, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        disallowed = set(request.data.keys()) - self.ALLOWED_UPDATE_FIELDS
        if disallowed:
            return Response(
                {"detail": f"Champs non modifiables ici: {', '.join(disallowed)}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        data = {k: v for k, v in request.data.items() if k in self.ALLOWED_UPDATE_FIELDS}
        serializer = UserSerializer(request.user, data=data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        user = User.objects.filter(email__iexact=email).first()

        # Send email only if user exists, but always return success to prevent email enumeration
        if user:
            token_generator = PasswordResetTokenGenerator()
            token = token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

            send_mail(
                subject="UniPlay - Password Reset",
                message=f"Click this link to reset your password: {reset_url}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

        return Response(
            {"detail": "If an account with that email exists, a password reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return Response(
            {"detail": "Password reset successful."},
            status=status.HTTP_200_OK,
        )


class ValidateStudentIdsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = StudentIdValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            {
                "valid": serializer.validated_data["valid"],
                "invalid": serializer.validated_data["invalid"],
            }
        )

class AdminStudentListView(generics.ListAPIView):
    """Read-only list of registered students (non-admin users) for 'Gestion des étudiants'."""
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return User.objects.filter(is_admin=False).order_by("first_name", "last_name")

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()
        return Response({"detail": "Mot de passe modifié avec succès."}, status=status.HTTP_200_OK)

class ReclamationCreateView(generics.CreateAPIView):
    """Lets an authenticated student submit a réclamation."""
    serializer_class = ReclamationCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)