import calendar
import csv
from datetime import date, datetime, timedelta
from django.http import HttpResponse
from django.db.models import Count, Q
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response

from .permissions import IsAdminUser
from .serializers import (
    AdminSportSerializer, AdminTerrainSerializer, AdminReservationSerializer,
    AdminReclamationListSerializer, AdminReclamationDetailSerializer,
)
from apps.sports.models import Sport, Terrain
from apps.reservations.models import TimeSlot, Reservation
from apps.accounts.models import Reclamation
from django.utils import timezone as dj_timezone
from apps.games.models import Game, GameParticipant
from apps.accounts.models import Warning
from .serializers import AdminGroupListSerializer, AdminGroupDetailSerializer

User = get_user_model()


def _generate_slots_for_terrain(terrain, target):
    """
    Bulk-creates TimeSlot rows for a terrain for the given month target ('current' or 'next'),
    based on the terrain's opening_hours and slot_duration. Skips any (date, start_time) that
    already exists for that terrain. Returns the number of slots created.
    Shared by manual generation, auto-generation on create, and regeneration on update.
    """
    today = date.today()

    if target == 'current':
        start_date = today
        year, month = today.year, today.month
    elif target == 'next':
        if today.month == 12:
            month = 1
            year = today.year + 1
        else:
            month = today.month + 1
            year = today.year
        start_date = date(year, month, 1)
    else:
        raise ValueError("Invalid target")

    last_day = calendar.monthrange(year, month)[1]
    end_date = date(year, month, last_day)

    days_to_generate = (end_date - start_date).days + 1
    if days_to_generate <= 0:
        return 0

    slot_duration = terrain.slot_duration or 60
    slots_created = 0

    opening_hours = terrain.opening_hours if isinstance(terrain.opening_hours, dict) else {}
    start_time_str = opening_hours.get('start', '08:00')
    end_time_str = opening_hours.get('end', '22:00')

    op_time = datetime.strptime(start_time_str, '%H:%M').time()
    cl_time = datetime.strptime(end_time_str, '%H:%M').time()

    for i in range(days_to_generate):
        current_date = start_date + timedelta(days=i)
        current_dt = datetime.combine(current_date, op_time)
        closing_dt = datetime.combine(current_date, cl_time)

        slots_to_bulk_create = []

        existing_slots = set(
            TimeSlot.objects.filter(
                terrain=terrain, date=current_date
            ).values_list('start_time', flat=True)
        )

        while current_dt + timedelta(minutes=slot_duration) <= closing_dt:
            end_dt = current_dt + timedelta(minutes=slot_duration)

            if current_dt.time() not in existing_slots:
                slots_to_bulk_create.append(
                    TimeSlot(
                        terrain=terrain,
                        date=current_date,
                        start_time=current_dt.time(),
                        end_time=end_dt.time(),
                        is_available=True
                    )
                )
            current_dt = end_dt

        if slots_to_bulk_create:
            TimeSlot.objects.bulk_create(slots_to_bulk_create)
            slots_created += len(slots_to_bulk_create)

    return slots_created


class DashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_students = User.objects.filter(is_admin=False, is_employee=False).count()

        res_stats = Reservation.objects.aggregate(
            total=Count('id'),
            confirmed=Count('id', filter=Q(status='confirmed')),
            cancelled=Count('id', filter=Q(status='cancelled')),
            pending=Count('id', filter=Q(status='pending'))
        )

        total_res = res_stats['total'] or 0
        cancelled_res = res_stats['cancelled'] or 0
        cancellation_rate = round((cancelled_res / total_res * 100), 1) if total_res > 0 else 0

        return Response({
            "total_students": total_students,
            "total_reservations": total_res,
            "confirmed_reservations": res_stats['confirmed'] or 0,
            "cancelled_reservations": cancelled_res,
            "pending_reservations": res_stats['pending'] or 0,
            "cancellation_rate": cancellation_rate,
        }, status=status.HTTP_200_OK)


class AdminSportViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = Sport.objects.all().order_by('name')
    serializer_class = AdminSportSerializer


class AdminTerrainViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = Terrain.objects.exclude(status='inactive')
    serializer_class = AdminTerrainSerializer

    def perform_create(self, serializer):
        """Auto-generates this month's and next month's slots as soon as a terrain is created."""
        terrain = serializer.save()
        _generate_slots_for_terrain(terrain, 'current')
        _generate_slots_for_terrain(terrain, 'next')

    def perform_update(self, serializer):
        """
        If opening hours or slot duration change, rebuild future slots to match.
        Only future slots with NO reservation history (confirmed or cancelled) are touched,
        since Reservation.timeslot is on_delete=PROTECT and would block deletion anyway.
        """
        terrain = serializer.save()
        today = date.today()
        TimeSlot.objects.filter(
            terrain=terrain, date__gte=today, reservations__isnull=True
        ).delete()
        _generate_slots_for_terrain(terrain, 'current')
        _generate_slots_for_terrain(terrain, 'next')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.status = 'inactive'
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def generate_slots(self, request, pk=None):
        terrain = self.get_object()
        target = request.data.get('target', 'current')

        try:
            slots_created = _generate_slots_for_terrain(terrain, target)
        except ValueError:
            return Response({"error": "Cible invalide."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"message": f"{slots_created} créneaux générés avec succès pour {terrain.name}."},
            status=status.HTTP_200_OK
        )


class AdminTerrainPlanningView(APIView):
    """
    Returns a month's planning grid for one terrain: row = time slot (derived from the
    terrain's opening hours and slot_duration), columns = each day of the month, cell =
    the confirmed reservation id booking that slot, or null if free.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        terrain_id = request.query_params.get('terrain')
        year_param = request.query_params.get('year')
        month_param = request.query_params.get('month')

        if not (terrain_id and year_param and month_param):
            return Response(
                {"error": "Paramètres terrain, year et month requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            terrain = Terrain.objects.get(pk=terrain_id)
            year = int(year_param)
            month = int(month_param)
        except (Terrain.DoesNotExist, ValueError):
            return Response({"error": "Paramètres invalides."}, status=status.HTTP_400_BAD_REQUEST)

        last_day = calendar.monthrange(year, month)[1]
        start_date = date(year, month, 1)
        end_date = date(year, month, last_day)

        opening_hours = terrain.opening_hours if isinstance(terrain.opening_hours, dict) else {}
        start_time_str = opening_hours.get('start', '08:00')
        end_time_str = opening_hours.get('end', '22:00')
        slot_duration = terrain.slot_duration or 60

        op_time = datetime.strptime(start_time_str, '%H:%M').time()
        cl_time = datetime.strptime(end_time_str, '%H:%M').time()

        # Row labels are derived once from the terrain's current opening hours.
        rows_labels = []
        cursor = datetime.combine(start_date, op_time)
        closing_ref = datetime.combine(start_date, cl_time)
        while cursor + timedelta(minutes=slot_duration) <= closing_ref:
            end_dt = cursor + timedelta(minutes=slot_duration)
            rows_labels.append((cursor.time().strftime('%H:%M'), end_dt.time().strftime('%H:%M')))
            cursor = end_dt

        slots = TimeSlot.objects.filter(
            terrain=terrain, date__gte=start_date, date__lte=end_date
        ).prefetch_related('reservations')

        booked = {}
        now = timezone.now()
        for slot in slots:
            confirmed = next(
                (r for r in slot.reservations.all() if r.status == Reservation.Status.CONFIRMED),
                None,
            )
            if confirmed:
                slot_end = datetime.combine(slot.date, slot.end_time)
                if timezone.is_naive(slot_end):
                    slot_end = timezone.make_aware(slot_end)
                booked[(slot.date.isoformat(), slot.start_time.strftime('%H:%M'))] = {
                    "id": confirmed.id,
                    "status": "finished" if slot_end < now else "confirmed",
                }

        days = [
            (start_date + timedelta(days=i)).isoformat()
            for i in range((end_date - start_date).days + 1)
        ]

        rows = []
        for start_label, end_label in rows_labels:
            rows.append({
                "start": start_label,
                "end": end_label,
                "cells": [
                    {
                        "date": day,
                        "reservation_id": booked.get((day, start_label), {}).get("id"),
                        "status": booked.get((day, start_label), {}).get("status"),
                    }
                    for day in days
                ],
            })

        return Response({
            "terrain": {"id": terrain.id, "name": terrain.name, "slot_duration": slot_duration},
            "days": days,
            "rows": rows,
        })


class AdminReservationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminReservationSerializer

    def get_queryset(self):
        qs = Reservation.objects.select_related(
            'terrain__sport', 'timeslot', 'organizer'
        ).prefetch_related('participants').all().order_by('-created_at')

        search = self.request.query_params.get('search', None)
        if search:
            qs = qs.filter(
                Q(organizer__username__icontains=search) |
                Q(terrain__name__icontains=search) |
                Q(organizer__first_name__icontains=search) |
                Q(organizer__last_name__icontains=search)
            )
        return qs

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def cancel(self, request, pk=None):
        reservation = self.get_object()
        if reservation.status == Reservation.Status.CANCELLED:
            return Response({"error": "Déjà annulée."}, status=status.HTTP_400_BAD_REQUEST)

        reservation.status = Reservation.Status.CANCELLED
        reservation.save()
        return Response({"message": "Réservation annulée avec succès."})

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def export_csv(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="reservations_uniplay.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Matricule', 'Organisateur', 'Participants',
            'Sport', 'Terrain', 'Date', 'Heure Debut', 'Heure Fin',
            'Statut', 'Date Reservation'
        ])

        now = timezone.now()

        for res in self.get_queryset():
            if res.status == 'cancelled':
                status_display = 'Annulé'
            else:
                slot_end = datetime.combine(res.timeslot.date, res.timeslot.end_time)
                if timezone.is_naive(slot_end):
                    slot_end = timezone.make_aware(slot_end)

                if slot_end < now:
                    status_display = 'Terminé'
                else:
                    status_display = 'Confirmé'

            participants_str = ", ".join([f"{p.first_name} {p.last_name}".strip() for p in res.participants.all()])
            writer.writerow([
                res.id,
                res.organizer.username,
                f"{res.organizer.first_name} {res.organizer.last_name}".strip(),
                participants_str,
                res.terrain.sport.name,
                res.terrain.name,
                res.timeslot.date,
                res.timeslot.start_time.strftime('%H:%M'),
                res.timeslot.end_time.strftime('%H:%M'),
                status_display,
                res.created_at.strftime('%Y-%m-%d %H:%M')
            ])

        return response


class AdminReclamationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = Reclamation.objects.select_related('sender').all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AdminReclamationDetailSerializer
        return AdminReclamationListSerializer

    def get_serializer_context(self):
        return {'request': self.request}

class AdminGroupViewSet(viewsets.ReadOnlyModelViewSet):
    """One card per completed game — the roster that actually played together."""
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        now = dj_timezone.now()
        qs = Game.objects.exclude(reservation__status='cancelled').select_related(
            'reservation__terrain__sport', 'reservation__organizer', 'reservation__timeslot'
        )
        past_ids = []
        for game in qs:
            ts = game.reservation.timeslot
            slot_end = datetime.combine(ts.date, ts.end_time)
            if timezone.is_naive(slot_end):
                slot_end = timezone.make_aware(slot_end)
            if slot_end < now:
                past_ids.append(game.id)
        return qs.filter(id__in=past_ids).order_by('-reservation__timeslot__date')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AdminGroupDetailSerializer
        return AdminGroupListSerializer

    def get_serializer_context(self):
        return {'request': self.request}


class AdminWarnStudentView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, student_id, game_id=None):
        from apps.games.serializers import _notify
        from apps.games.models import Notification

        student = get_object_or_404(User, username=student_id, is_admin=False, is_employee=False)
        game = Game.objects.filter(pk=game_id).first() if game_id else None

        existing_count = Warning.objects.filter(recipient=student).count()
        new_count = existing_count + 1

        if new_count == 1:
            message = (
                "Avertissement : votre comportement lors d'un jeu récent a été signalé par "
                "l'administration. Merci de respecter les autres joueurs et le règlement du campus. "
                "Une récidive entraînera la suspension de votre compte."
            )
        elif new_count == 2:
            message = (
                "Avertissement final : suite à un second signalement pour mauvais comportement, "
                "votre compte a été suspendu. Veuillez contacter l'administration pour régulariser "
                "votre situation."
            )
            student.is_suspended = True
            student.save()
        else:
            message = (
                "Suspension immédiate : votre compte avait déjà été suspendu après deux avertissements. "
                "Un nouveau signalement entraîne une suspension immédiate. Veuillez contacter "
                "l'administration pour régulariser votre situation."
            )
            student.is_suspended = True
            student.save()

        Warning.objects.create(recipient=student, issued_by=request.user, game=game, message=message)
        _notify(student, request.user, Notification.Kind.WARNING, game)

        return Response(
            {
                "detail": "Avertissement envoyé." if new_count == 1 else "Compte suspendu.",
                "warning_count": new_count,
                "is_suspended": student.is_suspended,
            },
            status=status.HTTP_201_CREATED,
        )