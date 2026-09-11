from django.urls import path
from .views import MyTicketsView, AllTicketsView, ReplyToTicketView, MarkTicketResolvedView, UnseenTicketCountView

urlpatterns = [
    path('', MyTicketsView.as_view(), name='my-tickets'),
    path('all/', AllTicketsView.as_view(), name='all-tickets'),
    path('unseen-count/', UnseenTicketCountView.as_view(), name='ticket-unseen-count'),
    path('<int:ticket_id>/reply/', ReplyToTicketView.as_view(), name='reply-ticket'),
    path('<int:ticket_id>/resolve/', MarkTicketResolvedView.as_view(), name='resolve-ticket'),
]