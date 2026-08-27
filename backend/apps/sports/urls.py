from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import (
    SportListView,
    SportDetailView,
    TerrainListView,
    TerrainDetailView,
    TerrainBySportView,
    TerrainTimeSlotsView,
)

urlpatterns = [
    path("", SportListView.as_view(), name="sport-list"),
    path("<int:pk>/", SportDetailView.as_view(), name="sport-detail"),
    path("terrains/", TerrainListView.as_view(), name="terrain-list"),
    path("terrains/<int:pk>/", TerrainDetailView.as_view(), name="terrain-detail"),
    path("<int:sport_id>/terrains/", TerrainBySportView.as_view(), name="terrain-by-sport"),
    path("terrains/<int:terrain_id>/timeslots/", TerrainTimeSlotsView.as_view(), name="terrain-timeslots"),
    
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)