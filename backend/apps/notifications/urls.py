from django.urls import path
from .views import (
    MyNotificationsView, MarkNotificationReadView, MarkAllNotificationsReadView,
    SendNotificationView, UnreadNotificationCountView
)

urlpatterns = [
    path('', MyNotificationsView.as_view(), name='my-notifications'),
    path('unread-count/', UnreadNotificationCountView.as_view(), name='notification-unread-count'),
    path('mark-all-read/', MarkAllNotificationsReadView.as_view(), name='mark-all-notifications-read'),
    path('<int:notification_id>/read/', MarkNotificationReadView.as_view(), name='mark-notification-read'),
    path('broadcast/', SendNotificationView.as_view(), name='broadcast-notification'),
]