import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
    LayoutDashboard, ShoppingCart, Package, Users, Truck,
    Receipt, BarChart3, Smartphone, Bell, MessageSquare, Settings,
    ShieldCheck, Store, Building2, Activity, Megaphone, Inbox, X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import * as notificationApi from '../../api/notificationApi.js'
import * as feedbackApi from '../../api/feedbackApi.js'
import Logo from './Logo.jsx'
const shopLinks = [
    { to: '/shop/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/shop/billing', label: 'Sales & POS', icon: ShoppingCart },
    { to: '/shop/sales-ledger', label: 'Sales Ledger', icon: Receipt },
    { to: '/shop/products', label: 'Products', icon: Package },
    { to: '/shop/purchases', label: 'Purchases', icon: Truck },
    { to: '/shop/customers', label: 'Customers', icon: Users },
    { to: '/shop/suppliers', label: 'Suppliers', icon: Building2 },
    { to: '/shop/expenses', label: 'Expenses', icon: Receipt },
    { to: '/shop/reports', label: 'Reports', icon: BarChart3 },
    { to: '/shop/devices', label: 'My Devices', icon: Smartphone },
    { to: '/shop/notifications', label: 'Notifications', icon: Bell },
    { to: '/shop/feedback', label: 'Feedback', icon: MessageSquare },
    { to: '/shop/settings', label: 'Settings', icon: Settings },
]

const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/approvals', label: 'Approvals', icon: ShieldCheck },
    { to: '/admin/shops', label: 'All Shops', icon: Store },
    { to: '/admin/devices', label: 'Shop Devices', icon: Activity },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/notifications', label: 'Notifications', icon: Megaphone },
    { to: '/admin/feedback', label: 'Feedback Inbox', icon: Inbox },
]

export default function Sidebar({ mobileOpen, onCloseMobile }) {
    const { user } = useAuth()
    const isAdmin = user?.role === 'platform_admin'
    const links = isAdmin ? adminLinks : shopLinks
    // Dot counts — feedback dot shows only when a new (unseen) message has
    // arrived; it clears once the user opens the feedback page. Shop owners
    // also keep the notifications dot.
    const [feedbackCount, setFeedbackCount] = useState(0)
    const [notifCount, setNotifCount] = useState(0)

    useEffect(() => {
        const load = () => {
            feedbackApi.getUnseenCount().then((res) => setFeedbackCount(res.data.unseen)).catch(() => { })
            if (!isAdmin) {
                notificationApi.getUnreadCount().then((res) => setNotifCount(res.data.unread)).catch(() => { })
            }
        }
        load()
        const interval = setInterval(load, 30000)
        return () => clearInterval(interval)
    }, [isAdmin])

    const hasDot = (to) =>
        (to === '/admin/feedback' && isAdmin && feedbackCount > 0) ||
        (to === '/shop/feedback' && !isAdmin && feedbackCount > 0) ||
        (to === '/shop/notifications' && !isAdmin && notifCount > 0)

    // Shared nav content — rendered inside both the desktop sidebar and the
    // mobile slide-in drawer.
    const navContent = (
        <>
            <div className="flex items-center justify-between px-6 py-5">
                <Link to={isAdmin ? '/admin/dashboard' : '/shop/dashboard'} onClick={onCloseMobile}>
                    <Logo chip="always" />
                </Link>
                {/* Close button — only rendered for the mobile drawer instance */}
                {onCloseMobile && (
                    <button
                        onClick={onCloseMobile}
                        className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition"
                        aria-label="Close menu"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-4">
                {links.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onCloseMobile}
                        className={({ isActive }) =>
                            `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive
                                ? 'bg-brand-light text-white'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`
                        }
                    >
                        <Icon size={17} />
                        {label}
                        {hasDot(to) && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500" />
                        )}
                    </NavLink>
                ))}
            </nav>

            {isAdmin && (
                <div className="px-6 py-3 text-[11px] tracking-wide text-slate-500 font-medium uppercase">
                    Platform Administrator
                </div>
            )}
        </>
    )

    return (
        <>
            {/* DESKTOP — fixed sidebar, hidden on phones */}
            <aside className="hidden lg:flex w-64 h-screen bg-slate-900 flex-col shrink-0">
                {navContent}
            </aside>

            {/* MOBILE — slide-in drawer + dark backdrop */}
            <div
                className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-200 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                aria-hidden={!mobileOpen}
            >
                <div className="absolute inset-0 bg-slate-900/60" onClick={onCloseMobile} />
                <aside
                    className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-slate-900 flex flex-col shadow-2xl transition-transform duration-200 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    {navContent}
                </aside>
            </div>
        </>
    )
}