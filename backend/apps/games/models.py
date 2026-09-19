from django.conf import settings
from django.db import models
from apps.reservations.models import Reservation


class Game(models.Model):
    reservation = models.OneToOneField(
        Reservation,
        on_delete=models.CASCADE,
        related_name="game",
    )
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Game #{self.pk} ({'Public' if self.is_public else 'Privé'})"


class GameParticipant(models.Model):
    class Status(models.TextChoices):
        INVITED = "invited", "Invited"
        JOINED = "joined", "Joined"

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="game_participants")
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="game_participations"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.INVITED)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_game_invites",
    )
    invited_at = models.DateTimeField(auto_now_add=True)
    joined_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["game", "student"], name="unique_student_per_game"),
        ]

    def __str__(self):
        return f"{self.student.username} - Game #{self.game_id} ({self.status})"

class Notification(models.Model):
    class Kind(models.TextChoices):
        INVITED = "invited", "Invited to a game"
        KICKED = "kicked", "Kicked from a game"
        GAME_CANCELLED = "game_cancelled", "Game cancelled"
        INVITE_ACCEPTED = "invite_accepted", "Invitation accepted"
        INVITE_DECLINED = "invite_declined", "Invitation declined"
        MEMBER_LEFT = "member_left", "Member left the game"
        MEMBER_JOINED = "member_joined", "Member joined the game"
        BOOKING_CREATED = "booking_created", "Booking created (admin)"       # add this
        BOOKING_CANCELLED = "booking_cancelled", "Booking cancelled (admin)" 

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triggered_notifications",
    )
    kind = models.CharField(max_length=32, choices=Kind.choices)
    # Kept nullable + SET_NULL so a notification survives its game being deleted.
    game = models.ForeignKey(
        Game, on_delete=models.SET_NULL, null=True, blank=True, related_name="notifications"
    )
    # Snapshot so cancelled/deleted games still render a meaningful message.
    game_label = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.kind} -> {self.recipient.username}"