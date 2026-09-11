from django.urls import path
from .views import (
    ShopListView, PendingShopsView, ApproveShopView,
    RejectShopView, SuspendShopView, ActivateShopView,
    PlatformDashboardView,
)

urlpatterns = [
    path('dashboard/', PlatformDashboardView.as_view(), name='platform-dashboard'),
    path('shops/', ShopListView.as_view(), name='shop-list'),
    path('shops/pending/', PendingShopsView.as_view(), name='shop-pending'),
    path('shops/<int:shop_id>/approve/', ApproveShopView.as_view(), name='shop-approve'),
    path('shops/<int:shop_id>/reject/', RejectShopView.as_view(), name='shop-reject'),
    path('shops/<int:shop_id>/suspend/', SuspendShopView.as_view(), name='shop-suspend'),
    path('shops/<int:shop_id>/activate/', ActivateShopView.as_view(), name='shop-activate'),
]