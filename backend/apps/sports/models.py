from django.db import models


class Sport(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.ImageField(upload_to="sports/icons/", blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Terrain(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = "available", "Available"
        MAINTENANCE = "maintenance", "Maintenance"
        INACTIVE = "inactive", "Inactive"

    name = models.CharField(max_length=120)
    sport = models.ForeignKey(
        Sport,
        on_delete=models.CASCADE,
        related_name="terrains"
    )
    capacity = models.PositiveIntegerField()
    slot_duration = models.PositiveIntegerField(
        default=60,
        help_text="Duration of each bookable slot in minutes"
    )
    photo = models.ImageField(upload_to="terrains/photos/", blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE
    )
    opening_hours = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.name} ({self.sport.name})"