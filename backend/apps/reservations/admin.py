from django.contrib import admin

from .models import Participant, Reservation, TimeSlot


from django.contrib import admin
from .models import TimeSlot

@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    # The columns that will show up in the admin table
    list_display = ('id', 'terrain', 'date', 'start_time', 'end_time', 'is_available')
    
    # Adds a sidebar filter so you can quickly find slots for a specific day or court
    list_filter = ('date', 'is_available', 'terrain')
    
    # Default sorting (closest dates and earliest times first)
    ordering = ('date', 'start_time')


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
	list_display = ("id", "terrain", "timeslot", "organizer", "status", "created_at")
	list_filter = ("status", "terrain")
	search_fields = ("organizer__username", "terrain__name")


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
	list_display = ("reservation", "student", "first_name", "last_name", "added_at")
	search_fields = ("student__username", "first_name", "last_name")
