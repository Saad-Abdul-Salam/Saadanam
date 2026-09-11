from django.urls import path
from .views import SaleListView, SaleDetailView, FinalizeSaleView, SaleExportView

urlpatterns = [
    path('sales/', SaleListView.as_view(), name='sale-list'),
    path('sales/export/', SaleExportView.as_view(), name='sale-export'),
    path('sales/<int:pk>/', SaleDetailView.as_view(), name='sale-detail'),
    path('finalize-sale/', FinalizeSaleView.as_view(), name='finalize-sale'),
]