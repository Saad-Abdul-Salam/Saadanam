import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Eye, Trash2, Undo2, Receipt, Download } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import InvoiceModal from '../../components/invoice/InvoiceModal.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import * as billingApi from '../../api/billingApi.js'
import * as shopApi from '../../api/shopApi.js'
import downloadCsv from '../../utils/downloadCsv.js'

export default function SalesLedgerPage() {
    usePageTitle('Sales Ledger')
    const [sales, setSales] = useState([])
    const [shopInfo, setShopInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [viewingSale, setViewingSale] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [undoData, setUndoData] = useState(null) // holds last-deleted sale briefly for undo

    const loadSales = () => {
        setLoading(true)
        Promise.all([billingApi.getSales(), shopApi.getMyShop()])
            .then(([salesRes, shopRes]) => {
                setSales(salesRes.data.results ?? salesRes.data)
                setShopInfo(shopRes.data)
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadSales()
    }, [])

    const filtered = sales.filter((s) =>
        s.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
        s.customerName.toLowerCase().includes(search.toLowerCase())
    )

    const confirmDelete = async () => {            const sale = deleteTarget
        try {
            await billingApi.deleteSale(sale.id)
            setSales((prev) => prev.filter((s) => s.id !== sale.id))
            setDeleteTarget(null)
            setUndoData(sale)
            setTimeout(() => setUndoData((current) => (current?.id === sale.id ? null : current)), 6000)
        } catch {
            setDeleteTarget(null)
            setError('Could not delete this invoice. Please try again.')
        }
    }

    const undoDelete = () => {
        // Note: this notifies you the deletion can't be technically reversed (stock/balance already
        // adjusted server-side) — for a true undo we'd need a re-create endpoint. For now, "undo"
        // re-opens the invoice view so you can see what was deleted and manually re-bill if needed.
        setViewingSale(undoData)
        setUndoData(null)
    }

    const handleExport = async () => {
        try {
            await downloadCsv('/billing/sales/export/', 'sales-ledger.csv')
        } catch {
            setError('Could not export sales.')
        }
    }

    return (
        <AppLayout title="Sales Ledger">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="relative w-full sm:w-80">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        placeholder="Search invoice or customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand transition"
                    />
                </div>

                <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
                >
                    <Download size={15} /> Export CSV
                </button>
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <LoadingSpinner label="Loading sales…" />
                ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="text-left px-5 py-3 font-medium text-slate-500">Invoice</th>
                                <th className="text-left px-5 py-3 font-medium text-slate-500">Customer</th>
                                <th className="text-left px-5 py-3 font-medium text-slate-500">Date</th>
                                <th className="text-left px-5 py-3 font-medium text-slate-500">Payment</th>
                                <th className="text-right px-5 py-3 font-medium text-slate-500">Total</th>
                                <th className="text-right px-5 py-3 font-medium text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s) => (
                                <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                    <td className="px-5 py-3 font-medium text-slate-800">{s.invoice_no}</td>
                                    <td className="px-5 py-3 text-slate-500">{s.customerName}</td>
                                    <td className="px-5 py-3 text-slate-500">{new Date(s.created_at).toLocaleDateString()}</td>
                                    <td className="px-5 py-3 text-slate-500 capitalize">{s.payment_method}</td>
                                    <td className="px-5 py-3 text-right text-slate-700 font-medium">₹{Number(s.total).toFixed(2)}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => setViewingSale(s)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                                                <Eye size={15} />
                                            </button>
                                            <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <EmptyState
                        icon={Receipt}
                        title={search ? 'No sales match your search' : 'No sales recorded yet'}
                        description={search ? 'Try a different invoice number or customer.' : 'Complete your first sale in Sales & POS and it will appear here.'}
                    />
                )}
            </div>

            <InvoiceModal sale={viewingSale} shop={shopInfo} onClose={() => setViewingSale(null)} />

            {/* DELETE CONFIRMATION */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4"
                        onClick={() => setDeleteTarget(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6 text-center"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                                <Receipt size={20} className="text-red-500" />
                            </div>
                            <h3 className="font-semibold text-slate-800 mb-1">Delete invoice {deleteTarget.invoice_no}?</h3>
                            <p className="text-sm text-slate-400 mb-6">
                                Stock will be added back, and any amount charged to the customer's balance will be reversed. This can't be undone automatically.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
                                <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition">Delete</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* UNDO TOAST */}
            <AnimatePresence>
                {undoData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-4"
                    >
                        <span className="text-sm">Invoice {undoData.invoice_no} deleted.</span>
                        <button onClick={undoDelete} className="flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                            <Undo2 size={14} /> View details
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </AppLayout>
    )
}