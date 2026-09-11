from django.urls import path
from .views import ProductListCreateView, ProductDetailView, QuickPriceUpdateView, BulkImportProductsView

urlpatterns = [
    path('', ProductListCreateView.as_view(), name='product-list'),
    path('bulk-import/', BulkImportProductsView.as_view(), name='product-bulk-import'),
    path('<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('<int:product_id>/quick-price/', QuickPriceUpdateView.as_view(), name='product-quick-price'),
]