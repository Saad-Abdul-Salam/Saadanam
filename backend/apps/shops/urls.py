from django.urls import path
from .views import MyShopView

urlpatterns = [
    path('me/', MyShopView.as_view(), name='my-shop'),
]