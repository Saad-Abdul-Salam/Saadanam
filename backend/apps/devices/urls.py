from django.urls import path
from .views import MyDevicesView, LogoutDeviceView, AllShopDevicesView, ForceLogoutDeviceView

urlpatterns = [
    path('my-devices/', MyDevicesView.as_view(), name='my-devices'),
    path('<int:session_id>/logout/', LogoutDeviceView.as_view(), name='logout-device'),
    path('shop-devices/', AllShopDevicesView.as_view(), name='shop-devices'),
    path('<int:session_id>/force-logout/', ForceLogoutDeviceView.as_view(), name='force-logout-device'),
]