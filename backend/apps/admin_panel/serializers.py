from datetime import datetime

from django.utils import timezone
from rest_framework import serializers
from apps.sports.models import Sport, Terrain
from apps.reservations.models import Reservation
from apps.accounts.models import Reclamation


class AdminSportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sport
        fields = '__all__'


class AdminTerrainSerializer(serializers.ModelSerializer):
    sport_name = serializers.ReadOnlyField(source='sport.name')

    class Meta:
        model = Terrain
        fields = '__all__'


class AdminReservationSerializer(serializers.ModelSerializer):
    terrain_name = serializers.CharField(source='terrain.name', read_only=True)
    sport_name = serializers.CharField(source='terrain.sport.name', read_only=True)
    organizer_matricule = serializers.CharField(source='organizer.username', read_only=True)
    organizer_name = serializers.SerializerMethodField()
    date = serializers.DateField(source='timeslot.date', read_only=True)
    start_time = serializers.TimeField(source='timeslot.start_time', read_only=True)
    end_time = serializers.TimeField(source='timeslot.end_time', read_only=True)
    participants = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = [
            'id', 'terrain_name', 'sport_name', 'organizer_matricule', 
            'organizer_name', 'date', 'start_time', 'end_time', 'status', 
            'created_at', 'participants'
        ]

    def get_organizer_name(self, obj):
        full_name = f"{obj.organizer.first_name} {obj.organizer.last_name}".strip()
        return full_name if full_name else obj.organizer.username

    def get_status(self, obj):
        if obj.status == Reservation.Status.CANCELLED:
            return obj.status

        slot_end = datetime.combine(obj.timeslot.date, obj.timeslot.end_time)
        if timezone.is_naive(slot_end):
            slot_end = timezone.make_aware(slot_end)
        return "finished" if slot_end < timezone.now() else obj.status

    def get_participants(self, obj):
        return [
            f"{p.first_name} {p.last_name}".strip()
            for p in obj.participants.all()
        ]



class AdminReclamationListSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = Reclamation
        fields = ['id', 'sender_name', 'created_at']

    def get_sender_name(self, obj):
        full_name = f"{obj.sender.first_name} {obj.sender.last_name}".strip()
        return full_name if full_name else obj.sender.username


class AdminReclamationDetailSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_email = serializers.CharField(source='sender.email', read_only=True)
    sender_phone_number = serializers.CharField(source='sender.phone_number', read_only=True)
    sender_classe = serializers.CharField(source='sender.classe', read_only=True)
    sender_specialite = serializers.CharField(source='sender.specialite', read_only=True)
    sender_photo = serializers.SerializerMethodField()

    class Meta:
        model = Reclamation
        fields = [
            'id', 'message', 'created_at',
            'sender_name', 'sender_username', 'sender_email',
            'sender_phone_number', 'sender_classe', 'sender_specialite', 'sender_photo',
        ]

    def get_sender_name(self, obj):
        full_name = f"{obj.sender.first_name} {obj.sender.last_name}".strip()
        return full_name if full_name else obj.sender.username

    def get_sender_photo(self, obj):
        request = self.context.get('request')
        if obj.sender.photo:
            url = obj.sender.photo.url
            return request.build_absolute_uri(url) if request else url
        return None