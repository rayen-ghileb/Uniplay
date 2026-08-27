from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DashboardStatsView, AdminSportViewSet, AdminTerrainViewSet, AdminReservationViewSet

router = DefaultRouter()
router.register(r'sports', AdminSportViewSet, basename='admin-sports')
router.register(r'terrains', AdminTerrainViewSet, basename='admin-terrains')
router.register(r'reservations', AdminReservationViewSet, basename='admin-reservations')

urlpatterns = [
    path('dashboard/stats/', DashboardStatsView.as_view(), name='admin-dashboard-stats'),
    path('', include(router.urls)),
]