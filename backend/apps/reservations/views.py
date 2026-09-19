from django.db import models
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import Reservation
from .serializers import (
    ReservationListSerializer,
    ReservationDetailSerializer,
    ReservationCreateSerializer,
)


class ReservationListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ReservationCreateSerializer
        return ReservationListSerializer

    def get_queryset(self):
        user = self.request.user
        return (
            Reservation.objects.filter(
                models.Q(organizer=user) | models.Q(participants__student=user)
            )
            .distinct()
            .order_by("-created_at")
        )


class ReservationDetailDeleteView(generics.RetrieveDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReservationDetailSerializer

    def get_queryset(self):
        user = self.request.user
        return Reservation.objects.filter(
            models.Q(organizer=user) | models.Q(participants__student=user)
        ).distinct()

    def destroy(self, request, *args, **kwargs):
        reservation = self.get_object()

        # Only organizer can cancel
        if reservation.organizer != request.user:
            return Response(
                {"detail": "Seul l'organisateur peut annuler cette réservation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not reservation.can_cancel:
            return Response(
                {
                    "detail": "L'annulation est autorisée uniquement plus de 12 heures avant le début de la réservation."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        reservation.status = Reservation.Status.CANCELLED
        reservation.save()

        return Response(
            {"detail": "Réservation annulée avec succès."},
            status=status.HTTP_200_OK,
        )