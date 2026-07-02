from datetime import datetime, timedelta
from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.sports.models import Terrain


class TimeSlot(models.Model):
    terrain = models.ForeignKey(
        Terrain,
        on_delete=models.CASCADE,
        related_name="timeslots"
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["terrain", "date", "start_time", "end_time"],
                name="unique_terrain_timeslot_window",
            )
        ]
        ordering = ["date", "start_time"]

    def __str__(self):
        return (
            f"{self.terrain.name} {self.date} "
            f"{self.start_time.strftime('%H:%M')}-{self.end_time.strftime('%H:%M')}"
        )


class Reservation(models.Model):
    class Status(models.TextChoices):
        CONFIRMED = "confirmed", "Confirmed"
        CANCELLED = "cancelled", "Cancelled"

    terrain = models.ForeignKey(
        Terrain,
        on_delete=models.CASCADE,
        related_name="reservations"
    )
    timeslot = models.ForeignKey(
        TimeSlot,
        on_delete=models.PROTECT,
        related_name="reservations"
    )
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="organized_reservations",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.CONFIRMED
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["timeslot"],
                condition=models.Q(status="confirmed"),
                name="unique_confirmed_reservation_per_timeslot",
            )
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"Reservation #{self.pk} - {self.terrain.name}"

    @property
    def can_cancel(self):
        """True if cancellation is still allowed (> 12h before slot start)."""
        if self.status != self.Status.CONFIRMED:
            return False
        slot_start = datetime.combine(self.timeslot.date, self.timeslot.start_time)
        if timezone.is_naive(slot_start):
            slot_start = timezone.make_aware(slot_start)
        return slot_start - timezone.now() >= timedelta(hours=12)


class Participant(models.Model):
    reservation = models.ForeignKey(
        Reservation,
        on_delete=models.CASCADE,
        related_name="participants",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="participations",
    )
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["reservation", "student"],
                name="unique_student_per_reservation",
            )
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"