import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Plus, Phone, MapPin, Wallet, X, Pencil, Trash2, PlusCircle, MinusCircle, Download } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import * as customerApi from '../../api/customerApi.js'
import downloadCsv from '../../utils/downloadCsv.js'

const emptyForm = { name: '', phone: '', address: '', creditLimit: '', outstanding: '' }

export default function CustomersPage() {
    usePageTitle('Customers')
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')

    const [showAddModal, setShowAddModal] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)

    const [deleteTarget, setDeleteTarget] = useState(null)
    const [adjustTarget, setAdjustTarget] = useState(null)
    const [adjustType, setAdjustType] = useState('payment')
    const [adjustAmount, setAdjustAmount] = useState('')

    const loadCustomers = () => {
        setLoading(true)
        customerApi.getCustomers()
            .then((res) => setCustomers(res.data.results ?? res.data))
            .catch(() => setError('Could not load customers.'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadCustomers()
    }, [])

    const filtered = customers.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
    )

    const totalOwed = customers.reduce((sum, c) => sum + Number(c.outstanding), 0)

    const openAddForm = () => {
        setForm(emptyForm)
        setShowAddModal(true)
    }

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!form.name || !form.phone) return
        setSaving(true)
        try {
            const res = await customerApi.createCustomer({
                name: form.name,
                phone: form.phone,
                address: form.address,
                creditLimit: form.creditLimit || 0,
                outstanding: form.outstanding || 0,
            })
            setCustomers((prev) => [...prev, res.data])
            setForm(emptyForm)
            setShowAddModal(false)
        } catch {
            setError('Failed to add customer.')
        } finally {
            setSaving(false)
        }
    }

    const openEditForm = (customer) => {
        setEditingCustomer(customer)
        setForm({
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            creditLimit: String(customer.creditLimit),
            outstanding: String(customer.outstanding),
        })
    }

    const handleEdit = async (e) => {
        e.preventDefault()
        if (!form.name || !form.phone) return
        setSaving(true)
        try {
            const res = await customerApi.updateCustomer(editingCustomer.id, {
                name: form.name,
                phone: form.phone,
                address: form.address,
                creditLimit: form.creditLimit || 0,
            })
            setCustomers((prev) => prev.map((c) => (c.id === editingCustomer.id ? res.data : c)))
            setEditingCustomer(null)
            setForm(emptyForm)
        } catch {
            setError('Failed to update customer.')
        } finally {
            setSaving(false)
        }
    }

    const confirmDelete = async () => {
        try {
            await customerApi.deleteCustomer(deleteTarget.id)
            setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id))
        } catch {
            setError('Failed to delete customer.')
        }
        setDeleteTarget(null)
    }

    const openAdjust = (customer, type) => {
        setAdjustTarget(customer)
        setAdjustType(type) // 'payment' | 'charge'
        setAdjustAmount('')
    }

    const confirmAdjust = async () => {
        const amt = Number(adjustAmount)
        if (!amt || amt <= 0) return
        try {
            const res = await customerApi.adjustBalance(adjustTarget.id, adjustType, amt)
            setCustomers((prev) => prev.map((c) => (c.id === adjustTarget.id ? res.data : c)))
        } catch {
            setError('Failed to adjust balance.')
        }
        setAdjustTarget(null)
        setAdjustAmount('')
    }

    const handleExport = async () => {
        try {
            await downloadCsv('/customers/export/', 'customers.csv')
        } catch {
            setError('Could not export customers.')
        }
    }

    return (
        <AppLayout title="Customers">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
                <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                        <Wallet size={17} className="text-red-500" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">Total Outstanding</p>
                        <p className="text-xl font-semibold text-slate-800">₹{totalOwed.toFixed(2)}</p>
                    </div>
                </div>

                <div className="relative flex-1 max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        placeholder="Search by name or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand transition"
                    />
                </div>

                <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition shrink-0"
                >
                    <Download size={15} /> Export CSV
                </button>
                <button
                    onClick={openAddForm}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition shrink-0"
                >
                    <Plus size={16} /> Add Customer
                </button>
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            {/* ADD MODAL */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                <h3 className="font-semibold text-slate-800">Add Customer</h3>
                                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleAdd} className="p-5 space-y-3">
                                <input required autoFocus placeholder="Full name" value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                                <input required placeholder="Phone" value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                                <input placeholder="Address" value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="number" min="0" placeholder="Credit limit (₹)" value={form.creditLimit}
                                        onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                                    <input type="number" min="0" placeholder="Amount already owed (₹)" value={form.outstanding}
                                        onChange={(e) => setForm({ ...form, outstanding: e.target.value })}
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                                </div>
                                <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-brand text-white font-medium text-sm hover:bg-indigo-700 transition mt-2 disabled:opacity-60">
                                    {saving ? 'Adding...' : 'Add Customer'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EDIT MODAL */}
            <AnimatePresence>
                {editingCustomer && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4"
                        onClick={() => { setEditingCustomer(null); setForm(emptyForm) }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                <h3 className="font-semibold text-slate-800">Edit Customer</h3>
                                <button onClick={() => { setEditingCustomer(null); setForm(emptyForm) }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleEdit} className="p-5 space-y-3">
                                <input required autoFocus placeholder="Full name" value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                                <input required placeholder="Phone" value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                                <input placeholder="Address" value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                                <input type="number" min="0" placeholder="Credit limit (₹)" value={form.creditLimit}
                                    onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                                <p className="text-xs text-slate-400">
                                    Outstanding balance can't be edited here — use the + / − buttons on the customer card to adjust it.
                                </p>
                                <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-brand text-white font-medium text-sm hover:bg-indigo-700 transition mt-2 disabled:opacity-60">
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ADJUST BALANCE MODAL */}
            <AnimatePresence>
                {adjustTarget && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4"
                        onClick={() => setAdjustTarget(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                <h3 className="font-semibold text-slate-800">
                                    {adjustType === 'payment' ? 'Record Payment' : 'Add to Due Amount'}
                                </h3>
                                <button onClick={() => setAdjustTarget(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                            </div>

                            <div className="p-5">
                                <p className="text-sm text-slate-500 mb-1">{adjustTarget.name}</p>
                                <p className="text-xs text-slate-400 mb-4">
                                    Current outstanding: <span className="font-medium text-slate-600">₹{Number(adjustTarget.outstanding).toFixed(2)}</span>
                                </p>

                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-slate-400 text-sm">₹</span>
                                    <input
                                        autoFocus type="number" min="0" step="0.01"
                                        placeholder={adjustType === 'payment' ? 'Amount received' : 'Amount to add'}
                                        value={adjustAmount}
                                        onChange={(e) => setAdjustAmount(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && confirmAdjust()}
                                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-brand"
                                    />
                                </div>

                                {adjustAmount && !isNaN(Number(adjustAmount)) && (
                                    <p className="text-xs text-slate-400 mb-4">
                                        New balance:{' '}
                                        <span className="font-medium text-slate-600">
                                            ₹{Math.max(0, adjustType === 'payment'
                                                ? Number(adjustTarget.outstanding) - Number(adjustAmount)
                                                : Number(adjustTarget.outstanding) + Number(adjustAmount)
                                            ).toFixed(2)}
                                        </span>
                                    </p>
                                )}

                                <button
                                    onClick={confirmAdjust}
                                    className={`w-full py-3 rounded-xl text-white font-medium text-sm transition ${adjustType === 'payment' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'
                                        }`}
                                >
                                    {adjustType === 'payment' ? 'Record Payment' : 'Add to Due'}
                                </button>
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
                            <h3 className="font-semibold text-slate-800 mb-1">Delete this customer?</h3>
                            <p className="text-sm text-slate-400 mb-6">
                                "{deleteTarget.name}" will be permanently removed
                                {Number(deleteTarget.outstanding) > 0 && (
                                    <> along with their <span className="font-medium text-red-500">₹{Number(deleteTarget.outstanding).toFixed(2)}</span> outstanding record</>
                                )}. This can't be undone.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
                                <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition">Delete</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <LoadingSpinner label="Loading customers…" />
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title={search ? 'No customers match your search' : 'No customers yet'}
                    description={search ? 'Try a different name or phone number.' : 'Add customers to track credit and outstanding balances.'}
                    action={!search && (
                        <button onClick={openAddForm} className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition">
                            <Plus size={15} className="inline mr-1 -mt-0.5" /> Add Customer
                        </button>
                    )}
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((c, i) => {
                        const outstanding = Number(c.outstanding)
                        const creditLimit = Number(c.creditLimit)
                        const overLimit = outstanding > creditLimit
                        return (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.04 }}
                                className="bg-white rounded-2xl border border-slate-200 p-5"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-semibold text-slate-800">{c.name}</p>
                                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                            <Phone size={11} /> {c.phone}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {outstanding > 0 && (
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${overLimit ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {overLimit ? 'Over Limit' : 'Due'}
                                            </span>
                                        )}
                                        <button onClick={() => openEditForm(c)} className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-600 transition">
                                            <Pencil size={13} />
                                        </button>
                                        <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                {c.address && (
                                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                                        <MapPin size={11} /> {c.address}
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mb-3">
                                    <div className="flex items-center gap-1.5 text-sm">
                                        <Wallet size={14} className="text-slate-400" />
                                        <span className="text-slate-400">Owes us</span>
                                    </div>
                                    <span className={`font-semibold ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ₹{outstanding.toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openAdjust(c, 'payment')}
                                        disabled={outstanding === 0}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <MinusCircle size={13} /> They Paid
                                    </button>
                                    <button
                                        onClick={() => openAdjust(c, 'charge')}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition"
                                    >
                                        <PlusCircle size={13} /> They Owe More
                                    </button>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </AppLayout>
    )
}