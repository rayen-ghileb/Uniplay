from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class User(AbstractUser):
    username = models.CharField(
        max_length=150,
        unique=True,
        verbose_name="matricule",
        help_text="Student matricule used to log in.",
    )
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, verbose_name="numéro de téléphone")
    classe = models.CharField(max_length=100, blank=True, verbose_name="classe")
    specialite = models.CharField(max_length=100, blank=True, verbose_name="spécialité")
    photo = models.ImageField(upload_to="users/photos/", blank=True, null=True, verbose_name="photo de profil")
    is_admin = models.BooleanField(default=False)
    is_deactivated = models.BooleanField(default=False)
    is_suspended = models.BooleanField(
        default=False,
        verbose_name="suspendu",
        help_text="Suspended after a second conduct warning; blocked from logging in.",
    )
    show_reactivation_warning = models.BooleanField(default=False)

    def __str__(self):
        return self.username

class Reclamation(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reclamations",
    )
    message = models.TextField(verbose_name="message")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Réclamation de {self.sender.username} ({self.created_at:%Y-%m-%d})"

class Warning(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="warnings"
    )
    issued_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="issued_warnings"
    )
    game = models.ForeignKey(
        "games.Game", on_delete=models.SET_NULL, null=True, blank=True, related_name="warnings"
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Warning #{self.pk} -> {self.recipient.username}"