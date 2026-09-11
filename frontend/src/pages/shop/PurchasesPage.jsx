import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, X, Trash2, PackagePlus, Eye, Pencil } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import * as purchaseApi from '../../api/purchaseApi.js'
import EmptyState from '../../components/ui/EmptyState.jsx'
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import * as supplierApi from '../../api/supplierApi.js'
import * as productApi from '../../api/productApi.js'

const emptyLine = () => ({ product: '', qty: '', cost: '' })

export default function PurchasesPage() {
    usePageTitle('Purchases')
    const [purchases, setPurchases] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    const [showForm, setShowForm] = useState(false)
    const [editingPurchase, setEditingPurchase] = useState(null)
    const [viewingPurchase, setViewingPurchase] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)

    const [supplierId, setSupplierId] = useState('')
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10))
    const [lineItems, setLineItems] = useState([emptyLine()])

    const loadAll = () => {
        setLoading(true)
        Promise.all([purchaseApi.getPurchases(), supplierApi.getSuppliers(), productApi.getProducts()])
            .then(([pRes, sRes, prodRes]) => {
                setPurchases(pRes.data.results ?? pRes.data)
                setSuppliers(sRes.data.results ?? sRes.data)
                setProducts(prodRes.data.results ?? prodRes.data)
                const supplierList = sRes.data.results ?? sRes.data
                if (supplierList.length > 0) setSupplierId(String(supplierList[0].id))
            })
            .catch(() => setError('Could not load purchases data.'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadAll()
    }, [])

    const addLine = () => setLineItems((prev) => [...prev, emptyLine()])
    const removeLine = (idx) => setLineItems((prev) => prev.filter((_, i) => i !== idx))
    const updateLine = (idx, field, value) =>
        setLineItems((prev) => prev.map((line, i) => (i === idx ? { ...line, [field]: value } : line)))

    const total = useMemo(
        () => lineItems.reduce((sum, l) => sum + Number(l.qty || 0) * Number(l.cost || 0), 0),
        [lineItems]
    )

    const resetForm = () => {
        if (suppliers.length > 0) setSupplierId(String(suppliers[0].id))
        setPurchaseDate(new Date().toISOString().slice(0, 10))
        setLineItems([emptyLine()])
        setShowForm(false)
        setEditingPurchase(null)
    }

    const openAddForm = () => {
        resetForm()
        setShowForm(true)
    }

    const openEditForm = (purchase) => {
        setEditingPurchase(purchase)
        setSupplierId(String(purchase.supplier))
        setPurchaseDate(purchase.date)
        setLineItems(purchase.items.map((i) => ({ product: String(i.product), qty: String(i.qty), cost: String(i.cost) })))
        setShowForm(true)
        setViewingPurchase(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const cleanItems = lineItems
            .filter((l) => l.product && l.qty && l.cost)
            .map((l) => ({ product: Number(l.product), qty: Number(l.qty), cost: Number(l.cost) }))

        if (cleanItems.length === 0 || !supplierId) return

        setSaving(true)
        const payload = { supplier: Number(supplierId), date: purchaseDate, items: cleanItems }

        try {
            if (editingPurchase) {
                const res = await purchaseApi.updatePurchase(editingPurchase.id, payload)
                setPurchases((prev) => prev.map((p) => (p.id === editingPurchase.id ? res.data : p)))
            } else {
                const res = await purchaseApi.createPurchase(payload)
                setPurchases((prev) => [res.data, ...prev])
            }
            resetForm()
            loadAll() // refresh product stock levels too, since purchase affects stock
        } catch {
            setError('Failed to save purchase.')
        } finally {
            setSaving(false)
        }
    }

    const confirmDelete = async () => {
        try {
            await purchaseApi.deletePurchase(deleteTarget.id)
            setPurchases((prev) => prev.filter((p) => p.id !== deleteTarget.id))
            loadAll()
        } catch {
            setError('Failed to delete purchase.')
        }
        setDeleteTarget(null)
    }

    const productName = (id) => products.find((p) => p.id === id)?.name ?? `Product #${id}`

    return (
        <AppLayout title="Purchases">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <p className="text-slate-500">Record stock coming in from suppliers. Each purchase is added to Expenses automatically.</p>
                <button
                    onClick={openAddForm}
                    disabled={suppliers.length === 0 || products.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition shrink-0 ml-4 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus size={16} /> New Purchase
                </button>
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
            {!loading && (suppliers.length === 0 || products.length === 0) && (
                <p className="text-sm text-amber-600 mb-4">
                    Add at least one supplier and one product before recording a purchase.
                </p>
            )}

            {/* ADD / EDIT FORM MODAL */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4"
                        onClick={resetForm}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                                <div className="flex items-center gap-2">
                                    <PackagePlus size={17} className="text-brand" />
                                    <h3 className="font-semibold text-slate-800">
                                        {editingPurchase ? 'Edit Purchase' : 'New Purchase Entry'}
                                    </h3>
                                </div>
                                <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <select
                                        value={supplierId}
                                        onChange={(e) => setSupplierId(e.target.value)}
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                    >
                                        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <input
                                        type="date" value={purchaseDate}
                                        onChange={(e) => setPurchaseDate(e.target.value)}
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                    />
                                </div>

                                <div className="space-y-2 mb-4">
                                    {lineItems.map((line, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                            <select
                                                value={line.product}
                                                onChange={(e) => updateLine(idx, 'product', e.target.value)}
                                                className="col-span-6 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                            >
                                                <option value="">Select product</option>
                                                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                            <input
                                                type="number" min="0.01" step="0.01" placeholder="Quantity" value={line.qty}
                                                onChange={(e) => updateLine(idx, 'qty', e.target.value)}
                                                className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                            />
                                            <input
                                                type="number" min="0" step="0.01" placeholder="Unit price (₹)" value={line.cost}
                                                onChange={(e) => updateLine(idx, 'cost', e.target.value)}
                                                className="col-span-3 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeLine(idx)}
                                                disabled={lineItems.length === 1}
                                                className="col-span-1 flex justify-center text-slate-300 hover:text-red-500 disabled:opacity-30"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={addLine}
                                    className="text-sm text-brand font-medium hover:underline mb-4"
                                >
                                    + Add another item
                                </button>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <p className="text-slate-500 text-sm">
                                        Total: <span className="font-semibold text-slate-800">₹{total.toFixed(2)}</span>
                                    </p>
                                    <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
                                        {saving ? 'Saving...' : editingPurchase ? 'Save Changes' : 'Save Purchase'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* VIEW DETAILS MODAL */}
            <AnimatePresence>
                {viewingPurchase && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4"
                        onClick={() => setViewingPurchase(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <Eye size={17} className="text-brand" />
                                    <h3 className="font-semibold text-slate-800">Purchase Details</h3>
                                </div>
                                <button onClick={() => setViewingPurchase(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                            </div>

                            <div className="p-5">
                                <div className="flex justify-between text-sm mb-4">
                                    <div>
                                        <p className="text-slate-400 text-xs">Supplier</p>
                                        <p className="font-medium text-slate-800">{viewingPurchase.supplierName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400 text-xs">Date</p>
                                        <p className="font-medium text-slate-800">{viewingPurchase.date}</p>
                                    </div>
                                </div>

                                <div className="border border-slate-100 rounded-xl overflow-hidden mb-4">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500">
                                                <th className="text-left px-3 py-2 font-medium">Product</th>
                                                <th className="text-left px-3 py-2 font-medium">Qty</th>
                                                <th className="text-left px-3 py-2 font-medium">Unit Price</th>
                                                <th className="text-right px-3 py-2 font-medium">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewingPurchase.items.map((item, idx) => (
                                                <tr key={idx} className="border-t border-slate-100">
                                                    <td className="px-3 py-2 text-slate-700">{item.productName}</td>
                                                    <td className="px-3 py-2 text-slate-500">{item.qty}</td>
                                                    <td className="px-3 py-2 text-slate-500">₹{Number(item.cost).toFixed(2)}</td>
                                                    <td className="px-3 py-2 text-right font-medium text-slate-700">₹{(item.qty * item.cost).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm">Total Amount</span>
                                    <span className="text-lg font-semibold text-slate-800">₹{Number(viewingPurchase.total).toFixed(2)}</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                                <Trash2 size={20} className="text-red-500" />
                            </div>
                            <h3 className="font-semibold text-slate-800 mb-1">Delete this purchase?</h3>
                            <p className="text-sm text-slate-400 mb-6">
                                This will also remove the matching ₹{Number(deleteTarget.total).toFixed(2)} expense entry and reverse the stock added. This can't be undone.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
                                <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition">Delete</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <LoadingSpinner label="Loading purchases…" />
                ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="text-left px-5 py-3 font-medium text-slate-500">Supplier</th>
                                <th className="text-left px-5 py-3 font-medium text-slate-500">Date</th>
                                <th className="text-left px-5 py-3 font-medium text-slate-500">Items</th>
                                <th className="text-left px-5 py-3 font-medium text-slate-500">Total</th>
                                <th className="text-left px-5 py-3 font-medium text-slate-500">Status</th>
                                <th className="text-right px-5 py-3 font-medium text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.map((p, i) => (
                                <motion.tr
                                    key={p.id}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2, delay: i * 0.03 }}
                                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                                >
                                    <td className="px-5 py-3 font-medium text-slate-800">{p.supplierName}</td>
                                    <td className="px-5 py-3 text-slate-500">{p.date}</td>
                                    <td className="px-5 py-3 text-slate-500">{p.items.length}</td>
                                    <td className="px-5 py-3 font-medium text-slate-700">₹{Number(p.total).toFixed(2)}</td>
                                    <td className="px-5 py-3">
                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-600">{p.status}</span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => setViewingPurchase(p)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                                                <Eye size={15} />
                                            </button>
                                            <button onClick={() => openEditForm(p)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}

                {!loading && purchases.length === 0 && (
                    <EmptyState
                        icon={PackagePlus}
                        title="No purchases recorded yet"
                        description="Record stock coming in from suppliers — stock levels and expenses update automatically."
                    />
                )}
            </div>
        </AppLayout>
    )
}