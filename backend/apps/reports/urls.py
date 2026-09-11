from django.urls import path
from .views import (
    SalesReportView, SalesReportExportView, TodayStatsView, PlatformAnalyticsView,
)

urlpatterns = [
    path('sales/', SalesReportView.as_view(), name='sales-report'),
    path('sales/export/', SalesReportExportView.as_view(), name='sales-report-export'),
    path('today-stats/', TodayStatsView.as_view(), name='today-stats'),
    path('platform-analytics/', PlatformAnalyticsView.as_view(), name='platform-analytics'),
]