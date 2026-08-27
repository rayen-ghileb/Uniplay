from django.contrib.auth import get_user_model
from django.db import IntegrityError
from rest_framework import serializers
from .models import TimeSlot, Reservation, Participant
from apps.sports.serializers import TerrainListSerializer

User = get_user_model()


class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = ["id", "date", "start_time", "end_time", "is_available"]


class ParticipantSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source="student.username", read_only=True)

    class Meta:
        model = Participant
        fields = ["id", "student_id", "first_name", "last_name", "added_at"]


class ReservationListSerializer(serializers.ModelSerializer):
    terrain_name = serializers.CharField(source="terrain.name", read_only=True)
    sport_name = serializers.CharField(source="terrain.sport.name", read_only=True)
    timeslot = TimeSlotSerializer(read_only=True)
    participant_count = serializers.IntegerField(source="participants.count", read_only=True)

    class Meta:
        model = Reservation
        fields = [
            "id",
            "terrain_name",
            "sport_name",
            "timeslot",
            "status",
            "created_at",
            "participant_count",
        ]


class ReservationDetailSerializer(serializers.ModelSerializer):
    terrain = TerrainListSerializer(read_only=True)
    timeslot = TimeSlotSerializer(read_only=True)
    organizer = serializers.CharField(source="organizer.username", read_only=True)
    participants = ParticipantSerializer(many=True, read_only=True)
    can_cancel = serializers.BooleanField(read_only=True)

    class Meta:
        model = Reservation
        fields = [
            "id",
            "terrain",
            "timeslot",
            "organizer",
            "participants",
            "status",
            "created_at",
            "can_cancel",
        ]


class ReservationCreateSerializer(serializers.ModelSerializer):
    participant_ids = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        default=list,
    )

    class Meta:
        model = Reservation
        fields = ["terrain", "timeslot", "participant_ids"]

    def validate(self, attrs):
        from django.utils import timezone
        from datetime import datetime

        terrain = attrs["terrain"]
        timeslot = attrs["timeslot"]
        request = self.context.get("request")

        # 1. Timeslot must belong to terrain
        if timeslot.terrain != terrain:
            raise serializers.ValidationError(
                "The selected timeslot does not belong to this terrain."
            )

        # 2. Cannot book past timeslots
        slot_start = datetime.combine(timeslot.date, timeslot.start_time)
        if timezone.is_naive(slot_start):
            slot_start = timezone.make_aware(slot_start)
        if slot_start < timezone.now():
            raise serializers.ValidationError("Cannot book a timeslot in the past.")

        # 3. Timeslot must be available and not already confirmed
        if not timeslot.is_available:
            raise serializers.ValidationError("This timeslot is not available.")

        if Reservation.objects.filter(
            timeslot=timeslot, status=Reservation.Status.CONFIRMED
        ).exists():
            raise serializers.ValidationError("This timeslot is already booked.")

        # 4. Validate participant IDs
        raw_ids = attrs.get("participant_ids", [])
        participant_ids = list(dict.fromkeys(raw_ids))  # deduplicate

        # Remove organizer if they included themselves
        if request and request.user.username in participant_ids:
            participant_ids.remove(request.user.username)

        valid_users = list(User.objects.filter(username__in=participant_ids))
        found_ids = {u.username for u in valid_users}
        invalid_ids = [pid for pid in participant_ids if pid not in found_ids]

        if invalid_ids:
            raise serializers.ValidationError(
                {"participant_ids": f"Invalid student IDs: {', '.join(invalid_ids)}"}
            )

        # 5. Check capacity (organizer + participants)
        total = 1 + len(valid_users)
        if total > terrain.capacity:
            raise serializers.ValidationError(
                f"Too many participants. Maximum is {terrain.capacity}, you have {total}."
            )

        attrs["valid_participants"] = valid_users
        return attrs

    def create(self, validated_data):
        valid_participants = validated_data.pop("valid_participants", [])
        validated_data.pop("participant_ids", [])

        try:
            reservation = Reservation.objects.create(
                terrain=validated_data["terrain"],
                timeslot=validated_data["timeslot"],
                organizer=self.context["request"].user,
                status=Reservation.Status.CONFIRMED,
            )
        except IntegrityError:
            raise serializers.ValidationError(
                "This timeslot was just booked by someone else. Please refresh and try again."
            )

        # Auto-add organizer as first participant
        Participant.objects.create(
            reservation=reservation,
            student=reservation.organizer,
            first_name=reservation.organizer.first_name,
            last_name=reservation.organizer.last_name,
        )

        # Add invited participants
        for user in valid_participants:
            Participant.objects.create(
                reservation=reservation,
                student=user,
                first_name=user.first_name,
                last_name=user.last_name,
            )

        return reservation