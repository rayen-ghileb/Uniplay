from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardStatsView, AdminSportViewSet, AdminTerrainViewSet,
    AdminReservationViewSet, AdminReclamationViewSet, AdminTerrainPlanningView,
)

router = DefaultRouter()
router.register(r'sports', AdminSportViewSet, basename='admin-sports')
router.register(r'terrains', AdminTerrainViewSet, basename='admin-terrains')
router.register(r'reservations', AdminReservationViewSet, basename='admin-reservations')
router.register(r'reclamations', AdminReclamationViewSet, basename='admin-reclamations')

urlpatterns = [
    path('dashboard/stats/', DashboardStatsView.as_view(), name='admin-dashboard-stats'),
    path('planning/', AdminTerrainPlanningView.as_view(), name='admin-planning'),
    path('', include(router.urls)),
]