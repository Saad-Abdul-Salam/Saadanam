import { Routes, Route, Navigate } from 'react-router-dom'

import LandingPage from './pages/auth/LandingPage.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

// platform-admin pages
import AdminDashboardPage from './pages/platform-admin/AdminDashboardPage.jsx'
import ShopApprovalsPage from './pages/platform-admin/ShopApprovalsPage.jsx'
import ShopListPage from './pages/platform-admin/ShopListPage.jsx'
import ShopDevicesPage from './pages/platform-admin/ShopDevicesPage.jsx'
import AnalyticsPage from './pages/platform-admin/AnalyticsPage.jsx'
import NotificationsAdminPage from './pages/platform-admin/NotificationsPage.jsx'
import FeedbackInboxPage from './pages/platform-admin/FeedbackInboxPage.jsx'

// shop pages
import DashboardPage from './pages/shop/DashboardPage.jsx'
import ProductsPage from './pages/shop/ProductsPage.jsx'
import SalesLedgerPage from './pages/shop/SalesLedgerPage.jsx'
import BillingPage from './pages/shop/BillingPage.jsx'
import PurchasesPage from './pages/shop/PurchasesPage.jsx'
import CustomersPage from './pages/shop/CustomersPage.jsx'
import SuppliersPage from './pages/shop/SuppliersPage.jsx'
import ExpensesPage from './pages/shop/ExpensesPage.jsx'
import ReportsPage from './pages/shop/ReportsPage.jsx'
import DevicesPage from './pages/shop/DevicesPage.jsx'
import NotificationsPage from './pages/shop/NotificationsPage.jsx'
import FeedbackPage from './pages/shop/FeedbackPage.jsx'
import SettingsPage from './pages/shop/SettingsPage.jsx'

import ProtectedRoute from './components/ui/ProtectedRoute.jsx'

function App() {
    return (
        <Routes>
            {/* landing intro page */}
            <Route path="/" element={<LandingPage />} />

            {/* auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* platform admin */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="platform_admin"><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/admin/approvals" element={<ProtectedRoute allowedRole="platform_admin"><ShopApprovalsPage /></ProtectedRoute>} />
            <Route path="/admin/shops" element={<ProtectedRoute allowedRole="platform_admin"><ShopListPage /></ProtectedRoute>} />
            <Route path="/admin/devices" element={<ProtectedRoute allowedRole="platform_admin"><ShopDevicesPage /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRole="platform_admin"><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute allowedRole="platform_admin"><NotificationsAdminPage /></ProtectedRoute>} />
            <Route path="/admin/feedback" element={<ProtectedRoute allowedRole="platform_admin"><FeedbackInboxPage /></ProtectedRoute>} />

            {/* shop owner */}
            <Route path="/shop/dashboard" element={<ProtectedRoute allowedRole="shop_owner"><DashboardPage /></ProtectedRoute>} />
            <Route path="/shop/products" element={<ProtectedRoute allowedRole="shop_owner"><ProductsPage /></ProtectedRoute>} />
            <Route path="/shop/billing" element={<ProtectedRoute allowedRole="shop_owner"><BillingPage /></ProtectedRoute>} />
            <Route path="/shop/sales-ledger" element={<ProtectedRoute allowedRole="shop_owner"><SalesLedgerPage /></ProtectedRoute>} />
            <Route path="/shop/purchases" element={<ProtectedRoute allowedRole="shop_owner"><PurchasesPage /></ProtectedRoute>} />
            <Route path="/shop/customers" element={<ProtectedRoute allowedRole="shop_owner"><CustomersPage /></ProtectedRoute>} />
            <Route path="/shop/suppliers" element={<ProtectedRoute allowedRole="shop_owner"><SuppliersPage /></ProtectedRoute>} />
            <Route path="/shop/expenses" element={<ProtectedRoute allowedRole="shop_owner"><ExpensesPage /></ProtectedRoute>} />
            <Route path="/shop/reports" element={<ProtectedRoute allowedRole="shop_owner"><ReportsPage /></ProtectedRoute>} />
            <Route path="/shop/devices" element={<ProtectedRoute allowedRole="shop_owner"><DevicesPage /></ProtectedRoute>} />
            <Route path="/shop/notifications" element={<ProtectedRoute allowedRole="shop_owner"><NotificationsPage /></ProtectedRoute>} />
            <Route path="/shop/feedback" element={<ProtectedRoute allowedRole="shop_owner"><FeedbackPage /></ProtectedRoute>} />
            <Route path="/shop/settings" element={<ProtectedRoute allowedRole="shop_owner"><SettingsPage /></ProtectedRoute>} />

            {/* 404 — anything unknown gets a real Not Found page */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    )
}

export default App