from rest_framework import serializers
from .models import Sport, Terrain


class SportSerializer(serializers.ModelSerializer):
    active_terrains_count = serializers.SerializerMethodField()
    maintenance_terrains_count = serializers.SerializerMethodField()

    class Meta:
        model = Sport
        fields = [
            "id",
            "name",
            "description",
            "icon",
            "is_active",
            "active_terrains_count",
            "maintenance_terrains_count",
        ]

    def get_active_terrains_count(self, obj):
        try:
            terrains = getattr(obj, 'terrains', getattr(obj, 'terrain_set', None))
            if terrains is None:
                return 0
            return terrains.filter(status__iexact="available").count()
        except Exception:
            return 0

    def get_maintenance_terrains_count(self, obj):
        try:
            terrains = getattr(obj, 'terrains', getattr(obj, 'terrain_set', None))
            if terrains is None:
                return 0
            return terrains.filter(status__iexact="maintenance").count()
        except Exception:
            return 0


class TerrainListSerializer(serializers.ModelSerializer):
    sport_name = serializers.CharField(source="sport.name", read_only=True)

    class Meta:
        model = Terrain
        fields = ["id", "name", "sport_name", "capacity", "photo", "status"]


class TerrainDetailSerializer(serializers.ModelSerializer):
    sport = SportSerializer(read_only=True)

    class Meta:
        model = Terrain
        fields = [
            "id",
            "name",
            "sport",
            "capacity",
            "slot_duration",
            "photo",
            "status",
            "opening_hours",
        ]


class SportDetailSerializer(serializers.ModelSerializer):
    terrains = serializers.SerializerMethodField()
    active_terrains_count = serializers.SerializerMethodField()

    class Meta:
        model = Sport
        fields = ["id", "name", "description", "icon", "is_active", "active_terrains_count", "terrains"]

    def get_active_terrains_count(self, obj):
        try:
            terrains = getattr(obj, 'terrains', getattr(obj, 'terrain_set', None))
            return terrains.filter(status__iexact="available").count() if terrains else 0
        except Exception:
            return 0

    def get_terrains(self, obj):
        try:
            terrains = getattr(obj, 'terrains', getattr(obj, 'terrain_set', None))
            if not terrains:
                return []
            available_terrains = terrains.exclude(status__iexact='inactive')
            return TerrainListSerializer(available_terrains, many=True).data
        except Exception:
            return []