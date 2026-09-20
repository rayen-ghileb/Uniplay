from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardStatsView, AdminSportViewSet, AdminTerrainViewSet,
    AdminReservationViewSet, AdminReclamationViewSet, AdminTerrainPlanningView,
    AdminGroupViewSet, AdminWarnStudentView
)

router = DefaultRouter()
router.register(r'sports', AdminSportViewSet, basename='admin-sports')
router.register(r'terrains', AdminTerrainViewSet, basename='admin-terrains')
router.register(r'reservations', AdminReservationViewSet, basename='admin-reservations')
router.register(r'reclamations', AdminReclamationViewSet, basename='admin-reclamations')
router.register(r'groups', AdminGroupViewSet, basename='admin-groups')

urlpatterns = [
    path('dashboard/stats/', DashboardStatsView.as_view(), name='admin-dashboard-stats'),
    path('planning/', AdminTerrainPlanningView.as_view(), name='admin-planning'),
    path('students/<str:student_id>/warn/', AdminWarnStudentView.as_view(), name='admin-warn-student'),
    path('students/<str:student_id>/warn/<int:game_id>/', AdminWarnStudentView.as_view(), name='admin-warn-student-game'),
    path('', include(router.urls)),
]