from django.contrib import admin

from .models import Participant, Reservation, TimeSlot


@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
	list_display = ("terrain", "date", "start_time", "end_time", "is_available")
	list_filter = ("terrain", "date", "is_available")


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
	list_display = ("id", "terrain", "timeslot", "organizer", "status", "created_at")
	list_filter = ("status", "terrain")
	search_fields = ("organizer__username", "terrain__name")


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
	list_display = ("reservation", "student", "first_name", "last_name", "added_at")
	search_fields = ("student__username", "first_name", "last_name")
