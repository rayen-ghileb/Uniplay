from rest_framework import serializers
from apps.sports.models import Sport, Terrain
from apps.reservations.models import Reservation


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

    def get_participants(self, obj):
        return [
            f"{p.first_name} {p.last_name}".strip()
            for p in obj.participants.all()
        ]