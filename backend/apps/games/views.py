from datetime import datetime, timedelta
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Game, GameParticipant, Notification
from .serializers import (
    GameListSerializer, GameDetailSerializer, GameCreateSerializer, GameInviteSerializer,
    NotificationSerializer,
    _add_participant_record, _remove_participant_record,
    _notify, _notify_many, _occupied_count, _game_label,
    _notify_admins,
)
from apps.reservations.models import Reservation


def _joined_users(game, exclude=None):
    qs = game.game_participants.filter(status=GameParticipant.Status.JOINED).select_related("student")
    return [gp.student for gp in qs if gp.student != exclude]


def _all_other_members(game, exclude=None):
    """Everyone attached to the game (joined or invited), optionally excluding one user."""
    qs = game.game_participants.select_related("student")
    return [gp.student for gp in qs if gp.student != exclude]


class GameCreateView(generics.CreateAPIView):
    """Books a terrain slot and creates its game lobby in one step."""
    serializer_class = GameCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        game = serializer.save()
        return Response(
            GameDetailSerializer(game, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class MyGamesView(APIView):
    """Current user's games split into active, pending, historical, and cancelled games."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        games = (
            Game.objects.filter(game_participants__student=user)
            .distinct()
            .select_related("reservation__terrain__sport", "reservation__organizer", "reservation__timeslot")
        )

        active, pending, history, cancelled = [], [], [], []
        for game in games:
            gp = game.game_participants.filter(student=user).first()
            if not gp:
                continue
            data = GameListSerializer(game, context={"request": request}).data
            if data["is_cancelled"]:
                cancelled.append(data)
            elif data["is_finished"]:
                history.append(data)
            elif gp.status == GameParticipant.Status.JOINED:
                active.append(data)
            else:
                pending.append(data)

        return Response({
            "active": active,
            "pending": pending,
            "history": history,
            "cancelled": cancelled,
        })


class GamesListView(generics.ListAPIView):
    """Browse public, non-cancelled, upcoming games. Optional ?sport=<id> filter."""
    serializer_class = GameListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        now = timezone.now()
        qs = (
            Game.objects.filter(is_public=True)
            .exclude(reservation__status=Reservation.Status.CANCELLED)
            .select_related("reservation__terrain__sport", "reservation__organizer", "reservation__timeslot")
            .order_by("reservation__timeslot__date", "reservation__timeslot__start_time")
        )

        sport = self.request.query_params.get("sport")
        if sport:
            qs = qs.filter(reservation__terrain__sport_id=sport)

        upcoming = []
        for game in qs:
            ts = game.reservation.timeslot
            slot_end = datetime.combine(ts.date, ts.end_time)
            if timezone.is_naive(slot_end):
                slot_end = timezone.make_aware(slot_end)
            if slot_end >= now:
                upcoming.append(game)
        return upcoming


class GameDetailView(generics.RetrieveAPIView):
    serializer_class = GameDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Game.objects.select_related(
            "reservation__terrain__sport", "reservation__organizer", "reservation__timeslot"
        )

    def get_object(self):
        game = super().get_object()
        if not game.is_public and not game.game_participants.filter(student=self.request.user).exists():
            raise PermissionDenied("Ce jeu est privé.")
        return game


class GameInviteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        game = get_object_or_404(Game, pk=pk)
        if game.reservation.status == Reservation.Status.CANCELLED:
            return Response(
                {"detail": "Ce jeu a été annulé et n'accepte plus d'invitations."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        slot_end = datetime.combine(game.reservation.timeslot.date, game.reservation.timeslot.end_time)
        if timezone.is_naive(slot_end):
            slot_end = timezone.make_aware(slot_end)
        if slot_end < timezone.now():
            return Response(
                {"detail": "Ce jeu est terminé et n'accepte plus d'invitations."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        is_owner = game.reservation.organizer_id == request.user.id
        is_member = game.game_participants.filter(
            student=request.user, status=GameParticipant.Status.JOINED
        ).exists()
        if not (is_member or is_owner):
            return Response(
                {"detail": "Vous devez faire partie de ce jeu pour inviter quelqu'un."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = GameInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invited_user = serializer.validated_data["student_id"]

        with transaction.atomic():
            # Keep legacy games valid when the organizer participant row was not created.
            if is_owner and not is_member:
                GameParticipant.objects.create(
                    game=game,
                    student=request.user,
                    status=GameParticipant.Status.JOINED,
                    invited_by=request.user,
                    joined_at=timezone.now(),
                )

            existing = game.game_participants.filter(student=invited_user).first()
            if existing:
                detail = (
                    "Cet étudiant fait déjà partie du jeu."
                    if existing.status == GameParticipant.Status.JOINED
                    else "Cet étudiant est déjà invité."
                )
                return Response({"detail": detail}, status=status.HTTP_400_BAD_REQUEST)

            # Pending invitations hold a spot, so they count toward capacity here.
            if _occupied_count(game) >= game.reservation.terrain.capacity:
                return Response(
                    {"detail": "Le jeu est complet (invitations en attente incluses)."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            GameParticipant.objects.create(
                game=game, student=invited_user,
                status=GameParticipant.Status.INVITED, invited_by=request.user,
            )
            _notify(invited_user, request.user, Notification.Kind.INVITED, game)

        return Response({"detail": "Invitation envoyée."}, status=status.HTTP_201_CREATED)


class GameAcceptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        game = get_object_or_404(Game, pk=pk)
        with transaction.atomic():
            gp = game.game_participants.filter(
                student=request.user, status=GameParticipant.Status.INVITED
            ).first()
            if not gp:
                return Response(
                    {"detail": "Aucune invitation en attente pour ce jeu."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # The invite already holds this user's spot, so no capacity re-check is needed.
            gp.status = GameParticipant.Status.JOINED
            gp.joined_at = timezone.now()
            gp.save()
            _add_participant_record(game.reservation, request.user)

            inviter = gp.invited_by or game.reservation.organizer
            _notify(inviter, request.user, Notification.Kind.INVITE_ACCEPTED, game)
            if inviter != game.reservation.organizer:
                _notify(game.reservation.organizer, request.user, Notification.Kind.MEMBER_JOINED, game)

        return Response(GameDetailSerializer(game, context={"request": request}).data)


class GameDeclineView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        game = get_object_or_404(Game, pk=pk)
        with transaction.atomic():
            gp = game.game_participants.filter(
                student=request.user, status=GameParticipant.Status.INVITED
            ).first()
            if not gp:
                return Response(
                    {"detail": "Aucune invitation en attente pour ce jeu."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            inviter = gp.invited_by or game.reservation.organizer
            # Deleting the row frees the spot the pending invite was holding.
            gp.delete()
            _notify(inviter, request.user, Notification.Kind.INVITE_DECLINED, game)

        return Response({"detail": "Invitation refusée."})


class GameJoinView(APIView):
    """Public games only: join directly without an invite, if there's room."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        game = get_object_or_404(Game, pk=pk)
        if not game.is_public:
            return Response(
                {"detail": "Ce jeu est privé, une invitation est nécessaire."},
                status=status.HTTP_403_FORBIDDEN,
            )

        with transaction.atomic():
            existing = game.game_participants.filter(student=request.user).first()
            if existing and existing.status == GameParticipant.Status.JOINED:
                return Response(
                    {"detail": "Vous faites déjà partie de ce jeu."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # An existing invite already holds a spot for this user; otherwise check capacity.
            if not existing and _occupied_count(game) >= game.reservation.terrain.capacity:
                return Response({"detail": "Le jeu est complet."}, status=status.HTTP_400_BAD_REQUEST)

            if existing:
                existing.status = GameParticipant.Status.JOINED
                existing.joined_at = timezone.now()
                existing.save()
            else:
                GameParticipant.objects.create(
                    game=game, student=request.user, status=GameParticipant.Status.JOINED,
                    invited_by=request.user, joined_at=timezone.now(),
                )
            _add_participant_record(game.reservation, request.user)

            # Owner plus every joined member hears about a public join.
            recipients = set(_joined_users(game, exclude=request.user))
            recipients.add(game.reservation.organizer)
            _notify_many(
                [r for r in recipients if r != request.user],
                request.user, Notification.Kind.MEMBER_JOINED, game,
            )

        return Response(GameDetailSerializer(game, context={"request": request}).data)


class GameLeaveOrKickView(APIView):
    """
    POST {}                        -> current user leaves.
    POST {"student_id": "..."}     -> owner kicks that student (or cancels a pending invite).
    Owner leaving cancels the reservation and keeps the lobby in history.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        game = get_object_or_404(Game, pk=pk)
        organizer = game.reservation.organizer
        target_id = request.data.get("student_id")

        # --- Owner removing someone else ---
        if target_id:
            if request.user != organizer:
                return Response(
                    {"detail": "Seul le propriétaire peut exclure un participant."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if target_id == organizer.username:
                return Response(
                    {"detail": "Le propriétaire ne peut pas s'exclure lui-même."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            with transaction.atomic():
                gp = game.game_participants.filter(student__username=target_id).first()
                if not gp:
                    return Response({"detail": "Participant introuvable."}, status=status.HTTP_404_NOT_FOUND)

                target_user = gp.student
                was_invited = gp.status == GameParticipant.Status.INVITED
                _remove_participant_record(game.reservation, target_user)
                gp.delete()

                # A cancelled invitation isn't an exclusion, so only real members get the kick notice.
                if not was_invited:
                    _notify(target_user, request.user, Notification.Kind.KICKED, game)

            return Response({"detail": "Invitation annulée." if was_invited else "Participant exclu."})

        # --- Owner leaving: cancel the reservation but preserve the lobby ---
        if request.user == organizer:
            slot_start = datetime.combine(
                game.reservation.timeslot.date,
                game.reservation.timeslot.start_time,
            )
            if timezone.is_naive(slot_start):
                slot_start = timezone.make_aware(slot_start)
            if slot_start - timezone.now() <= timedelta(hours=12):
                return Response(
                    {"detail": "Vous ne pouvez annuler ce jeu que plus de 12 heures avant son début."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            with transaction.atomic():
                recipients = _all_other_members(game, exclude=request.user)
                label = _game_label(game)
                # Notify before deletion, since Game FK is SET_NULL and game_label carries the text.
                _notify_many(recipients, request.user, Notification.Kind.GAME_CANCELLED, game)
                _notify_admins(Notification.Kind.BOOKING_CANCELLED, game, actor=request.user)

                game.reservation.status = Reservation.Status.CANCELLED
                game.reservation.save()

            return Response({"detail": f"Le jeu « {label} » a été annulé."})

        # --- Joined member leaving voluntarily ---
        with transaction.atomic():
            gp = game.game_participants.filter(
                student=request.user, status=GameParticipant.Status.JOINED
            ).first()
            if not gp:
                return Response(
                    {"detail": "Vous ne faites pas partie de ce jeu."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            _remove_participant_record(game.reservation, request.user)
            gp.delete()
            _notify(organizer, request.user, Notification.Kind.MEMBER_LEFT, game)

        return Response({"detail": "Vous avez quitté le jeu."})


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).select_related("actor", "game")


class NotificationMarkReadView(APIView):
    """POST with no body marks every notification read; {'id': N} marks just one."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        qs = Notification.objects.filter(recipient=request.user, is_read=False)
        notif_id = request.data.get("id")
        if notif_id:
            qs = qs.filter(pk=notif_id)
        updated = qs.update(is_read=True)
        return Response({"detail": f"{updated} notification(s) marquée(s) comme lue(s)."})


class NotificationDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)