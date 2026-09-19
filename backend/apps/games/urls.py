from django.urls import path
from .views import (
    GameCreateView, MyGamesView, GamesListView, GameDetailView,
    GameInviteView, GameAcceptView, GameDeclineView, GameJoinView, GameLeaveOrKickView,
    NotificationListView, NotificationMarkReadView, NotificationDeleteView,
)

urlpatterns = [
    path("", GameCreateView.as_view(), name="game-create"),
    path("mine/", MyGamesView.as_view(), name="my-games"),
    path("browse/", GamesListView.as_view(), name="games-list"),
    path("notifications/", NotificationListView.as_view(), name="notification-list"),
    path("notifications/read/", NotificationMarkReadView.as_view(), name="notification-read"),
    path("notifications/<int:pk>/", NotificationDeleteView.as_view(), name="notification-delete"),
    path("<int:pk>/", GameDetailView.as_view(), name="game-detail"),
    path("<int:pk>/invite/", GameInviteView.as_view(), name="game-invite"),
    path("<int:pk>/accept/", GameAcceptView.as_view(), name="game-accept"),
    path("<int:pk>/decline/", GameDeclineView.as_view(), name="game-decline"),
    path("<int:pk>/join/", GameJoinView.as_view(), name="game-join"),
    path("<int:pk>/leave/", GameLeaveOrKickView.as_view(), name="game-leave"),
]