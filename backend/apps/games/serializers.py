from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Game, GameParticipant, Notification
from apps.sports.models import Terrain
from apps.sports.serializers import TerrainListSerializer
from apps.reservations.models import Reservation, TimeSlot
from apps.reservations.serializers import TimeSlotSerializer

User = get_user_model()


class GameParticipantSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source="student.username", read_only=True)
    first_name = serializers.CharField(source="student.first_name", read_only=True)
    last_name = serializers.CharField(source="student.last_name", read_only=True)
    photo = serializers.SerializerMethodField()

    class Meta:
        model = GameParticipant
        fields = ["id", "student_id", "first_name", "last_name", "photo", "status", "invited_at", "joined_at"]

    def get_photo(self, obj):
        request = self.context.get("request")
        if obj.student.photo:
            url = obj.student.photo.url
            return request.build_absolute_uri(url) if request else url
        return None


class GameListSerializer(serializers.ModelSerializer):
    terrain_name = serializers.CharField(source="reservation.terrain.name", read_only=True)
    sport_name = serializers.CharField(source="reservation.terrain.sport.name", read_only=True)
    sport_id = serializers.IntegerField(source="reservation.terrain.sport.id", read_only=True)
    date = serializers.DateField(source="reservation.timeslot.date", read_only=True)
    start_time = serializers.TimeField(source="reservation.timeslot.start_time", read_only=True)
    end_time = serializers.TimeField(source="reservation.timeslot.end_time", read_only=True)
    owner_name = serializers.SerializerMethodField()
    capacity = serializers.IntegerField(source="reservation.terrain.capacity", read_only=True)
    joined_count = serializers.SerializerMethodField()
    my_status = serializers.SerializerMethodField()
    invited_by_name = serializers.SerializerMethodField()
    occupied_count = serializers.SerializerMethodField()
    is_cancelled = serializers.SerializerMethodField()
    is_finished = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = [
            "id", "is_public", "terrain_name", "sport_name", "sport_id",
            "date", "start_time", "end_time", "owner_name", "capacity",
            "joined_count", "my_status", "invited_by_name", "occupied_count",
            "is_cancelled", "is_finished",
        ]

    def get_owner_name(self, obj):
        organizer = obj.reservation.organizer
        full_name = f"{organizer.first_name} {organizer.last_name}".strip()
        return full_name if full_name else organizer.username

    def get_joined_count(self, obj):
        return obj.game_participants.filter(status=GameParticipant.Status.JOINED).count()

    def get_occupied_count(self, obj):
        from .serializers import _occupied_count
        return _occupied_count(obj)

    def get_is_cancelled(self, obj):
        return obj.reservation.status == Reservation.Status.CANCELLED

    def get_is_finished(self, obj):
        from datetime import datetime
        from django.utils import timezone

        end = datetime.combine(obj.reservation.timeslot.date, obj.reservation.timeslot.end_time)
        if timezone.is_naive(end):
            end = timezone.make_aware(end)
        return end < timezone.now()

    

    def _my_participant(self, obj):
        request = self.context.get("request")
        if not request:
            return None
        return obj.game_participants.filter(student=request.user).first()

    def get_my_status(self, obj):
        gp = self._my_participant(obj)
        return gp.status if gp else None

    def get_invited_by_name(self, obj):
        gp = self._my_participant(obj)
        if gp and gp.invited_by:
            full = f"{gp.invited_by.first_name} {gp.invited_by.last_name}".strip()
            return full if full else gp.invited_by.username
        return None


class GameDetailSerializer(GameListSerializer):
    participants = serializers.SerializerMethodField()
    terrain = serializers.SerializerMethodField()
    timeslot = TimeSlotSerializer(source="reservation.timeslot", read_only=True)
    organizer_id = serializers.CharField(source="reservation.organizer.username", read_only=True)
    organizer_user_id = serializers.IntegerField(source="reservation.organizer.id", read_only=True)

    class Meta(GameListSerializer.Meta):
        fields = GameListSerializer.Meta.fields + [
            "participants", "terrain", "timeslot", "organizer_id", "organizer_user_id",
        ]

    def get_participants(self, obj):
        qs = obj.game_participants.select_related("student").order_by("-status", "invited_at")
        return GameParticipantSerializer(qs, many=True, context=self.context).data

    def get_terrain(self, obj):
        return TerrainListSerializer(obj.reservation.terrain, context=self.context).data


class GameCreateSerializer(serializers.Serializer):
    terrain = serializers.PrimaryKeyRelatedField(queryset=Terrain.objects.all())
    timeslot = serializers.PrimaryKeyRelatedField(queryset=TimeSlot.objects.all())
    is_public = serializers.BooleanField(default=True)

    def validate(self, attrs):
        from django.utils import timezone
        from datetime import datetime

        terrain = attrs["terrain"]
        timeslot = attrs["timeslot"]

        if timeslot.terrain != terrain:
            raise serializers.ValidationError("Le créneau sélectionné n'appartient pas à ce terrain.")

        slot_start = datetime.combine(timeslot.date, timeslot.start_time)
        if timezone.is_naive(slot_start):
            slot_start = timezone.make_aware(slot_start)
        if slot_start < timezone.now():
            raise serializers.ValidationError("Impossible de réserver un créneau passé.")

        if not timeslot.is_available:
            raise serializers.ValidationError("Ce créneau n'est pas disponible.")

        if Reservation.objects.filter(timeslot=timeslot, status=Reservation.Status.CONFIRMED).exists():
            raise serializers.ValidationError("Ce créneau est déjà réservé.")

        return attrs

    def create(self, validated_data):
        from django.db import IntegrityError, transaction
        from django.utils import timezone

        request = self.context["request"]
        try:
            with transaction.atomic():
                reservation = Reservation.objects.create(
                    terrain=validated_data["terrain"],
                    timeslot=validated_data["timeslot"],
                    organizer=request.user,
                    status=Reservation.Status.CONFIRMED,
                )
                game = Game.objects.create(reservation=reservation, is_public=validated_data["is_public"])
                GameParticipant.objects.create(
                    game=game,
                    student=request.user,
                    status=GameParticipant.Status.JOINED,
                    invited_by=request.user,
                    joined_at=timezone.now(),
                )
                _add_participant_record(reservation, request.user)
                _notify_admins(Notification.Kind.BOOKING_CREATED, game, actor=request.user)  # add this
        except IntegrityError:
            raise serializers.ValidationError(
                "Ce créneau vient d'être réservé par quelqu'un d'autre. Veuillez réessayer."
            )
        return game


class GameInviteSerializer(serializers.Serializer):
    student_id = serializers.CharField()

    def validate_student_id(self, value):
        try:
            user = User.objects.get(username=value, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("Étudiant introuvable.")
        return user

def _game_label(game):
    return f"{game.reservation.terrain.sport.name} — {game.reservation.terrain.name}"


def _notify(recipient, actor, kind, game):
    """Creates a notification, skipping self-notifications."""
    from .models import Notification
    if recipient == actor:
        return
    Notification.objects.create(
        recipient=recipient,
        actor=actor,
        kind=kind,
        game=game,
        game_label=_game_label(game),
    )

def _notify_admins(kind, game, actor):
    """Fans a notification out to every admin user."""
    admins = User.objects.filter(is_admin=True) | User.objects.filter(is_employee=True)
    for admin in admins:
        if admin == actor:
            continue
        Notification.objects.create(
            recipient=admin,
            actor=actor,
            kind=kind,
            game=game,
            game_label=_game_label(game),
        )


def _notify_many(recipients, actor, kind, game):
    for recipient in recipients:
        _notify(recipient, actor, kind, game)


def _occupied_count(game):
    """Invited players hold a spot, so both joined and invited count toward capacity."""
    from .models import GameParticipant
    return game.game_participants.filter(
        status__in=[GameParticipant.Status.JOINED, GameParticipant.Status.INVITED]
    ).count()


def _add_participant_record(reservation, student):
    """Keeps the legacy Participant table (used by admin CSV export etc.) in sync."""
    from apps.reservations.models import Participant
    Participant.objects.get_or_create(
        reservation=reservation, student=student,
        defaults={"first_name": student.first_name, "last_name": student.last_name},
    )


def _remove_participant_record(reservation, student):
    from apps.reservations.models import Participant
    Participant.objects.filter(reservation=reservation, student=student).delete()

class NotificationSerializer(serializers.ModelSerializer):
    from .models import Notification as _N  # noqa

    actor_name = serializers.SerializerMethodField()
    message = serializers.SerializerMethodField()

    class Meta:
        model = None  # set below
        fields = ["id", "kind", "game", "game_label", "actor_name", "message", "is_read", "created_at"]

    def get_actor_name(self, obj):
        if not obj.actor:
            return "Quelqu'un"
        full = f"{obj.actor.first_name} {obj.actor.last_name}".strip()
        return full if full else obj.actor.username

    def get_message(self, obj):
        actor = self.get_actor_name(obj)
        label = obj.game_label or "un jeu"
        messages = {
            "invited": f"{actor} vous a invité à un jeu",
            "kicked": f"{actor} vous a exclu du jeu",
            "game_cancelled": f"{actor} a annulé le jeu",
            "invite_accepted": f"{actor} a accepté votre invitation",
            "invite_declined": f"{actor} a refusé votre invitation",
            "member_left": f"{actor} a quitté le jeu",
            "member_joined": f"{actor} a rejoint le jeu",
            "booking_created": f"{actor} a réservé un terrain",
            "booking_cancelled": f"{actor} a annulé une réservation",
            "warning": "L'administration vous a envoyé un avertissement",
        }
        return f"{messages.get(obj.kind, 'Notification')} · {label}"

from .models import Notification
NotificationSerializer.Meta.model = Notification