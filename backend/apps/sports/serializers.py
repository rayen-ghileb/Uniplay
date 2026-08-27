from rest_framework import serializers
from .models import Sport, Terrain


class SportSerializer(serializers.ModelSerializer):
    terrain_count = serializers.SerializerMethodField()

    class Meta:
        model = Sport
        fields = ["id", "name", "description", "icon", "is_active", "terrain_count"]

    def get_terrain_count(self, obj):
        return obj.terrains.filter(status=Terrain.Status.AVAILABLE).count()


class TerrainListSerializer(serializers.ModelSerializer):
    sport_name = serializers.CharField(source="sport.name", read_only=True)

    class Meta:
        model = Terrain
        # Reverted to only include fields that actually exist on your model
        fields = ["id", "name", "sport_name", "capacity", "photo", "status"]


class TerrainDetailSerializer(serializers.ModelSerializer):
    sport = SportSerializer(read_only=True)

    class Meta:
        model = Terrain
        # Reverted to only include fields that actually exist on your model
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
    terrain_count = serializers.SerializerMethodField()

    class Meta:
        model = Sport
        fields = ["id", "name", "description", "icon", "is_active", "terrain_count", "terrains"]

    def get_terrain_count(self, obj):
        return obj.terrains.filter(status=Terrain.Status.AVAILABLE).count()

    def get_terrains(self, obj):
        available_terrains = obj.terrains.all()
        return TerrainListSerializer(available_terrains, many=True).data