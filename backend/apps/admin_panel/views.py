import calendar
import csv
from datetime import date, datetime, timedelta
from django.http import HttpResponse
from django.db.models import Count, Q
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response

from .permissions import IsAdminUser
from .serializers import AdminSportSerializer, AdminTerrainSerializer, AdminReservationSerializer, AdminReclamationListSerializer, AdminReclamationDetailSerializer 
from apps.sports.models import Sport, Terrain
from apps.accounts.models import Reclamation
from apps.reservations.models import TimeSlot, Reservation

User = get_user_model()


class DashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_students = User.objects.filter(is_admin=False).count()
        
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

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.status = 'inactive'
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def generate_slots(self, request, pk=None):
        terrain = self.get_object()
        target = request.data.get('target', 'current') 
        
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
            return Response({"error": "Cible invalide."}, status=status.HTTP_400_BAD_REQUEST)
            
        last_day = calendar.monthrange(year, month)[1]
        end_date = date(year, month, last_day)
        
        days_to_generate = (end_date - start_date).days + 1
        if days_to_generate <= 0:
            return Response({"message": "Aucun jour à générer."}, status=status.HTTP_200_OK)
            
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
                
        return Response(
            {"message": f"{slots_created} créneaux générés avec succès pour {terrain.name}."}, 
            status=status.HTTP_200_OK
        )


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