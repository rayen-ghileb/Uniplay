from django.contrib import admin

from .models import Sport, Terrain


@admin.register(Sport)
class SportAdmin(admin.ModelAdmin):
	list_display = ("name", "is_active")
	search_fields = ("name",)
	list_filter = ("is_active",)


@admin.register(Terrain)
class TerrainAdmin(admin.ModelAdmin):
	list_display = ("name", "sport", "capacity", "status")
	search_fields = ("name", "sport__name")
	list_filter = ("status", "sport")
