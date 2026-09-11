import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from '../context/AuthContext.jsx'
import ProtectedRoute from '../components/ui/ProtectedRoute.jsx'
import { enterDemoMode, exitDemoMode } from './demoServer.js'
import { DemoProvider } from './DemoContext.jsx'

import DashboardPage from '../pages/shop/DashboardPage.jsx'
import BillingPage from '../pages/shop/BillingPage.jsx'
import SalesLedgerPage from '../pages/shop/SalesLedgerPage.jsx'
import ProductsPage from '../pages/shop/ProductsPage.jsx'
import PurchasesPage from '../pages/shop/PurchasesPage.jsx'
import CustomersPage from '../pages/shop/CustomersPage.jsx'
import SuppliersPage from '../pages/shop/SuppliersPage.jsx'
import ExpensesPage from '../pages/shop/ExpensesPage.jsx'
import ReportsPage from '../pages/shop/ReportsPage.jsx'
import DevicesPage from '../pages/shop/DevicesPage.jsx'
import NotificationsPage from '../pages/shop/NotificationsPage.jsx'
import FeedbackPage from '../pages/shop/FeedbackPage.jsx'
import SettingsPage from '../pages/shop/SettingsPage.jsx'

const PAGES = [
    { path: '/shop/dashboard', element: DashboardPage },
    { path: '/shop/billing', element: BillingPage },
    { path: '/shop/sales-ledger', element: SalesLedgerPage },
    { path: '/shop/products', element: ProductsPage },
    { path: '/shop/purchases', element: PurchasesPage },
    { path: '/shop/customers', element: CustomersPage },
    { path: '/shop/suppliers', element: SuppliersPage },
    { path: '/shop/expenses', element: ExpensesPage },
    { path: '/shop/reports', element: ReportsPage },
    { path: '/shop/devices', element: DevicesPage },
    { path: '/shop/notifications', element: NotificationsPage },
    { path: '/shop/feedback', element: FeedbackPage },
    { path: '/shop/settings', element: SettingsPage },
]

/**
 * The free "Try the Saadanam Demo" experience.
 *
 * Boots the in-memory demo server, then renders the REAL shop pages inside an
 * in-memory router (the browser URL stays on /). Every API call is answered
 * from browser memory — nothing touches the backend or its database, and all
 * demo data disappears when the page is reloaded or the demo is exited.
 */
export default function DemoShopApp({ onExit }) {
    // Boot demo mode during render — BEFORE AuthProvider initializes its
    // state and before any page effect fires an API request. Idempotent.
    enterDemoMode()

    const exitDemo = () => {
        exitDemoMode()
        onExit?.()
    }

    return (
        <DemoProvider exitDemo={exitDemo}>                <MemoryRouter initialEntries={['/shop/dashboard']}>
                <AuthProvider>
                    <Routes>
                        {PAGES.map(({ path, element: Page }) => (
                            <Route
                                key={path}
                                path={path}
                                element={
                                    <ProtectedRoute allowedRole="shop_owner">
                                        <Page />
                                    </ProtectedRoute>
                                }
                            />
                        ))}
                        <Route path="*" element={<Navigate to="/shop/dashboard" replace />} />
                    </Routes>
                </AuthProvider>
            </MemoryRouter>
        </DemoProvider>
    )
}
