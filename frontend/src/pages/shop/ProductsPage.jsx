import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Plus, Pencil, Trash2, Check, X, AlertTriangle, Package, Receipt, Eye, Upload, Download } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import InvoiceModal from '../../components/invoice/InvoiceModal.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import * as productApi from '../../api/productApi.js'
import * as billingApi from '../../api/billingApi.js'
import * as shopApi from '../../api/shopApi.js'

const emptyForm = { name: '', price: '', cost: '', stock: '', minStock: '' }

export default function ProductsPage() {
    usePageTitle('Products')
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [search, setSearch] = useState('')
    const [editingPriceId, setEditingPriceId] = useState(null)
    const [priceDraft, setPriceDraft] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [saving, setSaving] = useState(false)

    const [showLedger, setShowLedger] = useState(false)
    const [showBulkImport, setShowBulkImport] = useState(false)
    const [bulkFile, setBulkFile] = useState(null)
    const [bulkResult, setBulkResult] = useState(null)
    const [bulkUploading, setBulkUploading] = useState(false)

    const handleBulkUpload = async () => {
        if (!bulkFile) return
        setBulkUploading(true)
        try {
            const res = await productApi.bulkImportProducts(bulkFile)
            setBulkResult(res.data)
            loadProducts()
        } catch {
            setBulkResult({ error: 'Upload failed.' })
        } finally {
            setBulkUploading(false)
        }
    }

    const downloadSampleCsv = () => {
        const csv = 'name,price,stock,minStock,cost\nTomato (1kg),32,50,10,25\nOnion (1kg),28,40,10,22\n'
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'products_sample.csv'
        a.click()
        URL.revokeObjectURL(url)
    }
    const [sales, setSales] = useState([])
    const [loadingSales, setLoadingSales] = useState(false)
    const [viewingSale, setViewingSale] = useState(null)
    const [shopInfo, setShopInfo] = useState(null)

    const openLedger = () => {
        setShowLedger(true)
        setLoadingSales(true)
        Promise.all([billingApi.getSales(), shopApi.getMyShop()])
            .then(([salesRes, shopRes]) => {
                setSales(salesRes.data.results ?? salesRes.data)
                setShopInfo(shopRes.data)
            })
            .catch(() => setError('Could not load invoice ledger.'))
            .finally(() => setLoadingSales(false))
    }

    const loadProducts = () => {
        setLoading(true)
        productApi.getProducts()
            .then((res) => setProducts(res.data.results ?? res.data))
            .catch(() => setError('Could not load products.'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadProducts()
    }, [])

    const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    )

    const startEditPrice = (product) => {
        setEditingPriceId(product.id)
        setPriceDraft(String(product.price))
    }

    const savePrice = async (id) => {
        const newPrice = parseFloat(priceDraft)
        if (isNaN(newPrice) || newPrice < 0) {
            setEditingPriceId(null)
            return
        }
        try {
            const res = await productApi.quickUpdatePrice(id, newPrice)
            setProducts((prev) => prev.map((p) => (p.id === id ? res.data : p)))
        } catch {
            setError('Failed to update price.')
        }
        setEditingPriceId(null)
    }

    const cancelEdit = () => setEditingPriceId(null)

    const handleAddProduct = async (e) => {
        e.preventDefault()
        if (!form.name || !form.price) return
        setSaving(true)
        try {
            const res = await productApi.createProduct({
                name: form.name,
                price: form.price,
                cost: form.cost || 0,
                stock: form.stock || 0,
                minStock: form.minStock || 0,
            })
            setProducts((prev) => [...prev, res.data])
            setForm(emptyForm)
            setShowAddModal(false)
        } catch {
            setError('Failed to add product.')
        } finally {
            setSaving(false)
        }
    }

    const openEditModal = (product) => {
        setEditingProduct(product)
        setForm({
            name: product.name,
            price: String(product.price),
            cost: String(product.cost ?? ''),
            stock: String(product.stock),
            minStock: String(product.minStock),
        })
    }

    const handleEditProduct = async (e) => {
        e.preventDefault()
        if (!form.name || !form.price) return
        setSaving(true)
        try {
            const res = await productApi.updateProduct(editingProduct.id, {
                name: form.name,
                price: form.price,
                cost: form.cost || 0,
                stock: form.stock || 0,
                minStock: form.minStock || 0,
            })
            setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? res.data : p)))
            setEditingProduct(null)
            setForm(emptyForm)
        } catch {
            setError('Failed to update product.')
        } finally {
            setSaving(false)
        }
    }

    const confirmDelete = async () => {
        try {
            await productApi.deleteProduct(deleteTarget.id)
            setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
        } catch {
            setError('Failed to delete product.')
        }
        setDeleteTarget(null)
    }

    return (
        <AppLayout title="Products">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="relative w-full sm:w-80">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand transition"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={openLedger}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
                    >
                        <Receipt size={16} /> Invoice Ledger
                    </button>
                    <button
                        onClick={() => { setShowBulkImport(true); setBulkResult(null); setBulkFile(null) }}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
                    >
                        <Upload size={16} /> Bulk Import
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition"
                    >
                        <Plus size={16} /> Add Product
                    </button>
                </div>
            </div>
            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            {/* ADD PRODUCT MODAL */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <Package size={17} className="text-brand" />
                                    <h3 className="font-semibold text-slate-800">Add Product</h3>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAddProduct} className="p-5 space-y-3">
                                <input
                                    required autoFocus placeholder="Product name" value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        required type="number" step="0.01" min="0" placeholder="Price (₹)" value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                    />
                                    <input
                                        type="number" step="0.01" min="0" placeholder="Cost (₹)" value={form.cost}
                                        onChange={(e) => setForm({ ...form, cost: e.target.value })}
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="number" min="0" step="0.01" placeholder="Opening stock" value={form.stock}
                                        onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                    />
                                    <input
                                        type="number" min="0" step="0.01" placeholder="Min stock alert" value={form.minStock}
                                        onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-3 rounded-xl bg-brand text-white font-medium text-sm hover:bg-indigo-700 transition mt-2 disabled:opacity-60"
                                >
                                    {saving ? 'Adding...' : 'Add Product'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EDIT PRODUCT MODAL */}
            <AnimatePresence>
                {editingProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4"
                        onClick={() => { setEditingProduct(null); setForm(emptyForm) }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <Pencil size={17} className="text-brand" />
                                    <h3 className="font-semibold text-slate-800">Edit Product</h3>
                                </div>
                                <button
                                    onClick={() => { setEditingProduct(null); setForm(emptyForm) }}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleEditProduct} className="p-5 space-y-3">
                                <input
                                    required autoFocus placeholder="Product name" value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        required type="number" step="0.01" min="0" placeholder="Price (₹)" value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                    />
                                    <input
                                        type="number" step="0.01" min="0" placeholder="Cost (₹)" value={form.cost}
                                        onChange={(e) => setForm({ ...form, cost: e.target.value })}
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="number" min="0" placeholder="Stock" value={form.stock}
                                        onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                    />
                                    <input
                                        type="number" min="0" placeholder="Min stock alert" value={form.minStock}
                                        onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-3 rounded-xl bg-brand text-white font-medium text-sm hover:bg-indigo-700 transition mt-2 disabled:opacity-60"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DELETE CONFIRMATION MODAL */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4"
                        onClick={() => setDeleteTarget(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6 text-center"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={20} className="text-red-500" />
                            </div>
                            <h3 className="font-semibold text-slate-800 mb-1">Delete this product?</h3>
                            <p className="text-sm text-slate-400 mb-6">
                                "{deleteTarget.name}" will be permanently removed. This can't be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* INVOICE LEDGER MODAL */}
            <AnimatePresence>
                {showLedger && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4"
                        onClick={() => setShowLedger(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden max-h-[80vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                                <div className="flex items-center gap-2">
                                    <Receipt size={17} className="text-brand" />
                                    <h3 className="font-semibold text-slate-800">Invoice Ledger</h3>
                                </div>
                                <button onClick={() => setShowLedger(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="overflow-y-auto">
                                {loadingSales ? (
                                    <div className="text-center py-10 text-slate-400 text-sm">Loading...</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                                <th className="text-left px-5 py-3 font-medium text-slate-500">Invoice</th>
                                                <th className="text-left px-5 py-3 font-medium text-slate-500">Customer</th>
                                                <th className="text-left px-5 py-3 font-medium text-slate-500">Date</th>
                                                <th className="text-right px-5 py-3 font-medium text-slate-500">Total</th>
                                                <th className="text-right px-5 py-3 font-medium text-slate-500">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sales.map((s) => (
                                                <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                                    <td className="px-5 py-3 font-medium text-slate-800">{s.invoice_no}</td>
                                                    <td className="px-5 py-3 text-slate-500">{s.customerName}</td>
                                                    <td className="px-5 py-3 text-slate-500">{new Date(s.created_at).toLocaleDateString()}</td>
                                                    <td className="px-5 py-3 text-right text-slate-700">₹{Number(s.total).toFixed(2)}</td>
                                                    <td className="px-5 py-3 text-right">
                                                        <button
                                                            onClick={() => setViewingSale(s)}
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
                                )}

                                {!loadingSales && sales.length === 0 && (
                                    <div className="text-center py-10 text-slate-400 text-sm">No invoices yet.</div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <InvoiceModal sale={viewingSale} shop={shopInfo} onClose={() => setViewingSale(null)} />

            {/* BULK IMPORT MODAL */}
            <AnimatePresence>
                {showBulkImport && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4"
                        onClick={() => setShowBulkImport(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                <h3 className="font-semibold text-slate-800">Bulk Import Products</h3>
                                <button onClick={() => setShowBulkImport(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                            </div>

                            <div className="p-5 space-y-4">
                                <button onClick={downloadSampleCsv} className="flex items-center gap-1.5 text-sm text-brand font-medium hover:underline">
                                    <Download size={14} /> Download sample CSV format
                                </button>

                                <input
                                    type="file" accept=".csv"
                                    onChange={(e) => setBulkFile(e.target.files[0])}
                                    className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:text-sm"
                                />

                                {bulkResult && (
                                    <div className="text-sm space-y-1 bg-slate-50 rounded-xl p-3">
                                        {bulkResult.error ? (
                                            <p className="text-red-500">{bulkResult.error}</p>
                                        ) : (
                                            <>
                                                <p className="text-green-600 font-medium">{bulkResult.createdCount} product(s) added.</p>
                                                {bulkResult.errors?.length > 0 && (
                                                    <ul className="text-red-500 text-xs list-disc pl-4">
                                                        {bulkResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                                                    </ul>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={handleBulkUpload}
                                    disabled={!bulkFile || bulkUploading}
                                    className="w-full py-3 rounded-xl bg-brand text-white font-medium text-sm hover:bg-indigo-700 transition disabled:opacity-50"
                                >
                                    {bulkUploading ? 'Uploading...' : 'Upload & Import'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <LoadingSpinner label="Loading products…" />
                ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="text-left px-5 py-3 font-medium text-slate-500">Product</th>
                                <th className="text-left px-5 py-3 font-medium text-slate-500">Price</th>
                                <th className="text-left px-5 py-3 font-medium text-slate-500">Cost</th>
                                <th className="text-left px-5 py-3 font-medium text-slate-500">Stock</th>
                                <th className="text-right px-5 py-3 font-medium text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p, i) => {
                                const lowStock = p.stock <= p.minStock
                                return (
                                    <motion.tr
                                        key={p.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2, delay: i * 0.03 }}
                                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                                    >
                                        <td className="px-5 py-3 font-medium text-slate-800">{p.name}</td>

                                        <td className="px-5 py-3">
                                            {editingPriceId === p.id ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        autoFocus
                                                        value={priceDraft}
                                                        onChange={(e) => setPriceDraft(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') savePrice(p.id)
                                                            if (e.key === 'Escape') cancelEdit()
                                                        }}
                                                        className="w-20 px-2 py-1 rounded-md border border-brand text-sm focus:outline-none"
                                                    />
                                                    <button onClick={() => savePrice(p.id)} className="text-green-600 hover:bg-green-50 p-1 rounded">
                                                        <Check size={15} />
                                                    </button>
                                                    <button onClick={cancelEdit} className="text-slate-400 hover:bg-slate-100 p-1 rounded">
                                                        <X size={15} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => startEditPrice(p)}
                                                    className="font-medium text-slate-700 hover:text-brand hover:underline decoration-dashed underline-offset-4"
                                                >
                                                    ₹{Number(p.price).toFixed(2)}
                                                </button>
                                            )}
                                        </td>

                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-700">₹{Number(p.cost ?? 0).toFixed(2)}</span>
                                                {Number(p.margin) > 0 && (
                                                    <span className="text-[11px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{p.margin}%</span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className={lowStock ? 'text-red-600 font-medium' : 'text-slate-700'}>{p.stock}</span>
                                                {lowStock && <AlertTriangle size={13} className="text-red-500" />}
                                            </div>
                                        </td>

                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openEditModal(p)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(p)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                )
                            })}
                        </tbody>
                    </table>
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <EmptyState
                        icon={Package}
                        title={search ? 'No products match your search' : 'No products yet'}
                        description={search ? 'Try a different name.' : 'Add your first product to start billing.'}
                        action={!search && (
                            <button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition">
                                <Plus size={15} className="inline mr-1 -mt-0.5" /> Add Product
                            </button>
                        )}
                    />
                )}
            </div>
        </AppLayout>
    )
}