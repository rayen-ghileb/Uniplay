from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Reclamation

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "username", "email", "phone_number", "classe", "specialite", "photo",
            "first_name", "last_name", "is_active", "is_admin", "date_joined",
            "is_deactivated", "is_suspended",
            "show_reactivation_warning",
        ]
        read_only_fields = ["date_joined", "show_reactivation_warning"]


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "phone_number", "classe", "specialite"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    classe = serializers.CharField(required=True)
    specialite = serializers.CharField(required=True)
    photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "phone_number", "classe", "specialite", "photo", "first_name", "last_name"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            phone_number=validated_data["phone_number"],
            classe=validated_data["classe"],
            specialite=validated_data["specialite"],
            photo=validated_data.get("photo"),
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            is_active=False
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get("username")
        user = User.objects.filter(username=username).first()

        # Suspension is independent of is_active — a suspended account can otherwise still
        # be approved/active, so this check must come before the is_active branch below.
        if user and user.is_suspended:
            raise serializers.ValidationError({
                "detail": (
                    "Votre compte a été suspendu suite à un avertissement pour mauvais "
                    "comportement. Veuillez contacter l'administration pour régulariser "
                    "votre situation."
                )
            })

        if user and not user.is_active:
            if user.is_deactivated:
                raise serializers.ValidationError({
                    "detail": "Votre compte a été désactivé par un administrateur."
                })
            raise serializers.ValidationError({
                "detail": "Votre compte est en attente d'approbation par un administrateur."
            })

        data = super().validate(attrs)
        reactivation_warning = None
        if self.user.show_reactivation_warning:
            reactivation_warning = (
                "Votre compte a été réactivé. Merci de respecter le règlement et de ne pas "
                "reproduire le comportement ayant entraîné votre suspension."
            )
            self.user.show_reactivation_warning = False
            self.user.save(update_fields=["show_reactivation_warning"])
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
            "is_admin": getattr(self.user, "is_admin", False),
            "is_active": self.user.is_active,
        }
        if reactivation_warning:
            data["reactivation_warning"] = reactivation_warning
        return data


class StudentIdValidationSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=False,
        min_length=1,
    )

    def validate(self, attrs):
        ids = list(dict.fromkeys(attrs["ids"]))
        users = User.objects.filter(username__in=ids, is_active=True)
        found = {u.username for u in users}
        attrs["valid"] = [
            {
                "id": u.username,
                "first_name": u.first_name,
                "last_name": u.last_name,
            }
            for u in users
        ]
        attrs["invalid"] = [id for id in ids if id not in found]
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, attrs):
        try:
            uid = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise serializers.ValidationError("Invalid uid.")

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError("Invalid or expired token.")

        attrs["user"] = user
        return attrs

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=8, write_only=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Mot de passe actuel incorrect.")
        return value



class ReclamationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reclamation
        fields = ["id", "message", "created_at"]
        read_only_fields = ["id", "created_at"]