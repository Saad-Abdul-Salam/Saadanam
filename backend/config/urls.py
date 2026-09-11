from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('django-admin/', admin.site.urls),

    path('api/auth/', include('apps.accounts.urls')),
    path('api/shops/', include('apps.shops.urls')),
    path('api/devices/', include('apps.devices.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/billing/', include('apps.billing.urls')),
    path('api/purchases/', include('apps.purchases.urls')),
    path('api/customers/', include('apps.customers.urls')),
    path('api/suppliers/', include('apps.suppliers.urls')),
    path('api/expenses/', include('apps.expenses.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/feedback/', include('apps.feedback.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/platform-admin/', include('apps.platform_admin.urls')),
]