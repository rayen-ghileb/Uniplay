from django.urls import path
from .views import (
    SportListView,
    SportDetailView,
    TerrainListView,
    TerrainDetailView,
    TerrainBySportView,
    TerrainTimeSlotsView,
    AdminSportListView,
    AdminSportDetailView,
)

urlpatterns = [
    # Public routes
    path("", SportListView.as_view(), name="sport-list"),
    path("<int:pk>/", SportDetailView.as_view(), name="sport-detail"),
    path("terrains/", TerrainListView.as_view(), name="terrain-list"),
    path("terrains/<int:pk>/", TerrainDetailView.as_view(), name="terrain-detail"),
    path("<int:sport_id>/terrains/", TerrainBySportView.as_view(), name="terrain-by-sport"),
    path("terrains/<int:terrain_id>/timeslots/", TerrainTimeSlotsView.as_view(), name="terrain-timeslots"),

    # Admin routes
    path("admin/", AdminSportListView.as_view(), name="admin-sport-list"),
    path("admin/<int:pk>/", AdminSportDetailView.as_view(), name="admin-sport-detail"),
]