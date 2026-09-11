from datetime import timedelta
from decimal import Decimal

from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.billing.models import Sale
from apps.accounts.models import User


class IsShopOwner(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == User.ROLE_SHOP_OWNER


class IsPlatformAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == User.ROLE_PLATFORM_ADMIN


def _parse_date(value, default):
    try:
        return timezone.datetime.strptime(value, '%Y-%m-%d').date()
    except (TypeError, ValueError):
        return default


def _sale_profit(sale):
    """Real profit: sum of (price - cost) * qty per item, minus the invoice discount."""
    margin = sum(
        (item.price - item.cost) * item.qty for item in sale.items.all()
    )
    return margin - sale.discount


def _sales_for_shop(request, start, end):
    return Sale.objects.filter(
        shop=request.user.shop,
        created_at__date__gte=start,
        created_at__date__lte=end,
    )


class SalesReportView(APIView):
    """Daily sales + profit for a date range (default: last 7 days).

    Accepts ?start=YYYY-MM-DD&end=YYYY-MM-DD. The response also includes
    aggregate totals for the selected range.
    """
    permission_classes = [IsShopOwner]

    def get(self, request):
        today = timezone.now().date()
        start = _parse_date(request.query_params.get('start'), today - timedelta(days=6))
        end = _parse_date(request.query_params.get('end'), today)
        if start > end:
            start, end = end, start

        sales = _sales_for_shop(request, start, end).prefetch_related('items')

        # fill every day in the range so charts are continuous
        day_totals = {}
        day_profits = {}
        day_counts = {}
        for sale in sales:
            day = sale.created_at.date()
            day_totals[day] = day_totals.get(day, Decimal('0')) + sale.total
            day_profits[day] = day_profits.get(day, Decimal('0')) + _sale_profit(sale)
            day_counts[day] = day_counts.get(day, 0) + 1

        daily = []
        cursor = start
        while cursor <= end:
            daily.append({
                'day': cursor.strftime('%a'),
                'date': cursor.strftime('%Y-%m-%d'),
                'sales': float(day_totals.get(cursor, Decimal('0'))),
                'profit': float(day_profits.get(cursor, Decimal('0'))),
                'count': day_counts.get(cursor, 0),
            })
            cursor += timedelta(days=1)

        return Response({
            'start': start.strftime('%Y-%m-%d'),
            'end': end.strftime('%Y-%m-%d'),
            'totalSales': float(sum(day_totals.values())),
            'totalProfit': float(sum(day_profits.values())),
            'totalInvoices': sum(day_counts.values()),
            'daily': daily,
        })


class SalesReportExportView(APIView):
    """CSV download of the same daily sales/profit data as SalesReportView."""
    permission_classes = [IsShopOwner]

    def get(self, request):
        today = timezone.now().date()
        start = _parse_date(request.query_params.get('start'), today - timedelta(days=6))
        end = _parse_date(request.query_params.get('end'), today)
        if start > end:
            start, end = end, start

        sales = _sales_for_shop(request, start, end).prefetch_related('items')

        day_totals = {}
        day_profits = {}
        day_counts = {}
        for sale in sales:
            day = sale.created_at.date()
            day_totals[day] = day_totals.get(day, Decimal('0')) + sale.total
            day_profits[day] = day_profits.get(day, Decimal('0')) + _sale_profit(sale)
            day_counts[day] = day_counts.get(day, 0) + 1

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="sales-report-{start}-to-{end}.csv"'
        response.write('\ufeff')  # BOM so Excel opens UTF-8 correctly
        response.write('Date,Day,Sales (Rs),Profit (Rs),Invoices\n')

        cursor = start
        while cursor <= end:
            response.write(
                f"{cursor.strftime('%Y-%m-%d')},{cursor.strftime('%a')},"
                f"{day_totals.get(cursor, 0)},{day_profits.get(cursor, 0)},{day_counts.get(cursor, 0)}\n"
            )
            cursor += timedelta(days=1)

        return response


class TodayStatsView(APIView):
    """Powers the shop owner's Dashboard stat cards."""
    permission_classes = [IsShopOwner]

    def get(self, request):
        shop = request.user.shop
        today = timezone.now().date()

        today_sales = Sale.objects.filter(shop=shop, created_at__date=today).prefetch_related('items')
        today_total = today_sales.aggregate(total=Sum('total'))['total'] or 0
        invoice_count = today_sales.count()
        today_profit = sum(_sale_profit(s) for s in today_sales)

        from apps.products.models import Product
        products = Product.objects.filter(shop=shop)
        total_stock_value = sum(p.price * p.stock for p in products)
        total_stock_cost = sum(p.cost * p.stock for p in products)
        low_stock_items = [p for p in products if p.stock <= p.min_stock]

        pending_customers = shop.customers.filter(outstanding__gt=0)
        pending_total = pending_customers.aggregate(total=Sum('outstanding'))['total'] or 0

        recent_sales = Sale.objects.filter(shop=shop).select_related('customer').order_by('-created_at')[:5]
        recent_sales_data = [
            {
                'id': s.id,
                'invoiceNo': s.invoice_no,
                'customerName': s.customer.name,
                'total': float(s.total),
            }
            for s in recent_sales
        ]

        return Response({
            'todaySales': float(today_total),
            'todayProfit': float(today_profit),
            'invoiceCount': invoice_count,
            'stockValue': float(total_stock_value),
            'stockCost': float(total_stock_cost),
            'pendingPayments': float(pending_total),
            'lowStockCount': len(low_stock_items),
            'recentSales': recent_sales_data,
        })


class PlatformAnalyticsView(APIView):
    """Powers the platform admin's Analytics page."""
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        from apps.shops.models import Shop
        from apps.products.models import Product

        total_bills = Sale.objects.count()
        total_products = Product.objects.count()

        today = timezone.now().date()
        active_today = Sale.objects.filter(created_at__date=today).values('shop').distinct().count()

        six_months_ago = today - timedelta(days=180)
        # Group registrations by month in Python — portable across SQLite/MySQL/Postgres
        # (the old .extra(strftime) version was SQLite-only and produced broken keys).
        per_month = {}
        for shop in Shop.objects.filter(created_at__date__gte=six_months_ago).order_by('created_at'):
            month = shop.created_at.strftime('%Y-%m')
            per_month[month] = per_month.get(month, 0) + 1

        registrations = [
            {'month': month, 'shops': count}
            for month, count in sorted(per_month.items())
        ]

        return Response({
            'totalBills': total_bills,
            'totalProducts': total_products,
            'activeToday': active_today,
            'registrations': registrations,
        })