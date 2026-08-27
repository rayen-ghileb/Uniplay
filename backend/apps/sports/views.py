from rest_framework import generics, permissions
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta

from .models import Sport, Terrain
from .serializers import (
    SportSerializer, 
    SportDetailSerializer, 
    TerrainListSerializer, 
    TerrainDetailSerializer
)
from apps.reservations.models import TimeSlot


class SportListView(generics.ListAPIView):
    queryset = Sport.objects.filter(is_active=True)
    serializer_class = SportSerializer
    permission_classes = [permissions.AllowAny]


class SportDetailView(generics.RetrieveAPIView):
    queryset = Sport.objects.filter(is_active=True)
    serializer_class = SportDetailSerializer
    permission_classes = [permissions.AllowAny]


class TerrainBySportView(generics.ListAPIView):
    serializer_class = TerrainListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        sport_id = self.kwargs["sport_id"]
        return Terrain.objects.filter(
            sport_id=sport_id,
            status=Terrain.Status.AVAILABLE,
        )


class TerrainListView(generics.ListAPIView):
    queryset = Terrain.objects.exclude(status='inactive')
    serializer_class = TerrainListSerializer
    permission_classes = [permissions.AllowAny]


class TerrainDetailView(generics.RetrieveAPIView):
    queryset = Terrain.objects.all()
    serializer_class = TerrainDetailSerializer
    permission_classes = [permissions.AllowAny]


class TerrainTimeSlotsView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, terrain_id):
        terrain = Terrain.objects.get(pk=terrain_id)

        start_date_str = request.query_params.get("start_date")
        if start_date_str:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        else:
            start_date = timezone.now().date()

        days = int(request.query_params.get("days", 7))
        end_date = start_date + timedelta(days=days)

        slots = TimeSlot.objects.filter(
            terrain=terrain,
            date__gte=start_date,
            date__lte=end_date,
            is_available=True,
        ).exclude(
            reservations__status="confirmed"
        ).order_by("date", "start_time")

        data = [
            {
                "id": slot.id,
                "date": slot.date,
                "start_time": slot.start_time.strftime("%H:%M"),
                "end_time": slot.end_time.strftime("%H:%M"),
                "is_available": True,
            }
            for slot in slots
        ]

        return Response(data)