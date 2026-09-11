import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { TrendingUp, Wallet, PackageX, Clock, AlertTriangle, ShoppingCart, Tag, Eye, Receipt } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import QuickPriceUpdateModal from '../../components/ui/QuickPriceUpdateModal.jsx'
import InvoiceModal from '../../components/invoice/InvoiceModal.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import { useAuth } from '../../context/AuthContext.jsx'
import * as reportApi from '../../api/reportApi.js'
import * as billingApi from '../../api/billingApi.js'
import * as shopApi from '../../api/shopApi.js'

export default function DashboardPage() {
    usePageTitle('Dashboard')
    const { user } = useAuth()
    const navigate = useNavigate()
    const [quickPriceOpen, setQuickPriceOpen] = useState(false)
    const [stats, setStats] = useState(null)
    const [viewingSale, setViewingSale] = useState(null)
    const [shopInfo, setShopInfo] = useState(null)

    useEffect(() => {
        reportApi.getTodayStats().then((res) => setStats(res.data)).catch(() => { })
        shopApi.getMyShop().then((res) => setShopInfo(res.data)).catch(() => { })
    }, [])

    const openInvoice = (saleId) => {
        billingApi.getSaleDetail(saleId).then((res) => setViewingSale(res.data)).catch(() => { })
    }
    return (
        <AppLayout title="Dashboard">
            <QuickPriceUpdateModal open={quickPriceOpen} onClose={() => setQuickPriceOpen(false)} />

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <p className="text-slate-500">
                        Welcome back, <span className="font-medium text-slate-700">{user?.full_name}</span>.
                        Here's what's happening in your shop today.
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setQuickPriceOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
                        >
                            <Tag size={15} /> Quick Price Update
                        </button>
                        <button
                            onClick={() => navigate('/shop/billing')}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition"
                        >
                            <ShoppingCart size={15} /> New Sale
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Today's Sales", value: `₹${(stats?.todaySales ?? 0).toFixed(2)}`, icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
                        { label: "Today's Profit", value: `₹${(stats?.todayProfit ?? 0).toFixed(2)}`, icon: Wallet, color: 'text-green-600 bg-green-50' },
                        { label: 'Invoices Today', value: stats?.invoiceCount ?? 0, icon: Receipt, color: 'text-purple-600 bg-purple-50' },
                        { label: 'Stock Value', value: `₹${(stats?.stockValue ?? 0).toFixed(2)}`, icon: PackageX, color: 'text-indigo-600 bg-indigo-50' },
                        { label: 'Pending Payments', value: `₹${(stats?.pendingPayments ?? 0).toFixed(2)}`, icon: Clock, color: 'text-orange-600 bg-orange-50' },
                    ].map(({ label, value, icon: Icon, color }, i) => (
                        <motion.div
                            key={label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.05 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                                <Icon size={18} />
                            </div>
                            <p className="text-sm text-slate-400 mb-1">{label}</p>
                            <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{value}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="font-semibold text-slate-800 mb-4">Recent Bills</h3>
                        {stats?.recentSales?.length > 0 ? (
                            <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left py-2 font-medium text-slate-500">Invoice</th>
                                        <th className="text-left py-2 font-medium text-slate-500">Customer</th>
                                        <th className="text-right py-2 font-medium text-slate-500">Total</th>
                                        <th className="text-right py-2 font-medium text-slate-500">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentSales.map((s) => (
                                        <tr key={s.id} className="border-b border-slate-50 last:border-0">
                                            <td className="py-2.5 text-slate-700 font-medium">{s.invoiceNo}</td>
                                            <td className="py-2.5 text-slate-500">{s.customerName}</td>
                                            <td className="py-2.5 text-right text-slate-700">₹{s.total.toFixed(2)}</td>
                                            <td className="py-2.5 text-right">
                                                <button
                                                    onClick={() => openInvoice(s.id)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                                                >
                                                    <Eye size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        ) : (
                            <div className="text-sm text-slate-400 text-center py-10">
                                No sales recorded yet.
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle size={16} className="text-amber-500" />
                            <h3 className="font-semibold text-slate-800">Low Stock Alerts</h3>
                        </div>
                        {(stats?.lowStockCount ?? 0) > 0 ? (
                            <div>
                                <p className="text-2xl font-semibold text-slate-800 mb-1">{stats.lowStockCount}</p>
                                <p className="text-sm text-slate-500">
                                    product(s) below their minimum stock level.
                                </p>
                            </div>
                        ) : (
                            <div className="text-sm text-slate-400 text-center py-10">
                                All product stock levels are healthy.
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
            <InvoiceModal sale={viewingSale} shop={shopInfo} onClose={() => setViewingSale(null)} />
        </AppLayout>
    )
}