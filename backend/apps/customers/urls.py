from django.urls import path
from .views import (
    CustomerListCreateView, CustomerDetailView, AdjustBalanceView,
    CustomerLedgerView, WalkinCustomerView, CustomerExportView,
)

urlpatterns = [
    path('', CustomerListCreateView.as_view(), name='customer-list'),
    path('walkin/', WalkinCustomerView.as_view(), name='customer-walkin'),
    path('export/', CustomerExportView.as_view(), name='customer-export'),
    path('<int:pk>/', CustomerDetailView.as_view(), name='customer-detail'),
    path('<int:customer_id>/adjust-balance/', AdjustBalanceView.as_view(), name='customer-adjust-balance'),
    path('<int:customer_id>/ledger/', CustomerLedgerView.as_view(), name='customer-ledger'),
]