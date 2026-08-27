from django.urls import path
from .views import ReservationListCreateView, ReservationDetailDeleteView

urlpatterns = [
    path("", ReservationListCreateView.as_view(), name="reservation-list-create"),
    path("<int:pk>/", ReservationDetailDeleteView.as_view(), name="reservation-detail-delete"),
]