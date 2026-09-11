from django.urls import path
from .views import (
    SupplierListCreateView, SupplierDetailView, AdjustSupplierBalanceView,
    SupplierLedgerView, SupplierExportView,
)

urlpatterns = [
    path('', SupplierListCreateView.as_view(), name='supplier-list'),
    path('export/', SupplierExportView.as_view(), name='supplier-export'),
    path('<int:pk>/', SupplierDetailView.as_view(), name='supplier-detail'),
    path('<int:supplier_id>/adjust-balance/', AdjustSupplierBalanceView.as_view(), name='supplier-adjust-balance'),
    path('<int:supplier_id>/ledger/', SupplierLedgerView.as_view(), name='supplier-ledger'),
]