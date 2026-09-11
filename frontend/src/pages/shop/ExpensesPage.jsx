import { useState, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { Plus, X, Receipt, Wallet, Lock } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import * as expenseApi from '../../api/expenseApi.js'
import EmptyState from '../../components/ui/EmptyState.jsx'
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'

const CATEGORIES = ['Rent', 'Salary', 'Transport', 'Electricity', 'Internet', 'Miscellaneous']

export default function ExpensesPage() {
    usePageTitle('Expenses')
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ category: CATEGORIES[0], amount: '', date: '', note: '' })
    const [saving, setSaving] = useState(false)

    const loadExpenses = () => {
        setLoading(true)
        expenseApi.getExpenses()
            .then((res) => setExpenses(res.data.results ?? res.data))
            .catch(() => setError('Could not load expenses.'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadExpenses()
    }, [])

    const total = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount), 0), [expenses])

    const byCategory = useMemo(() => {
        const map = {}
        expenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + Number(e.amount) })
        return Object.entries(map).sort((a, b) => b[1] - a[1])
    }, [expenses])

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!form.amount || !form.date) return
        setSaving(true)
        try {
            const res = await expenseApi.createExpense(form)
            setExpenses((prev) => [res.data, ...prev])
            setForm({ category: CATEGORIES[0], amount: '', date: '', note: '' })
            setShowForm(false)
        } catch {
            setError('Failed to add expense.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <AppLayout title="Expenses">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                        <Wallet size={17} className="text-red-500" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">Total Expenses</p>
                        <p className="text-xl font-semibold text-slate-800">₹{total.toFixed(2)}</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition"
                >
                    {showForm ? <X size={16} /> : <Plus size={16} />}
                    {showForm ? 'Cancel' : 'Add Expense'}
                </button>
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            {showForm && (
                <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    onSubmit={handleAdd}
                    className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 grid grid-cols-1 sm:grid-cols-5 gap-3"
                >
                    <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input required type="number" placeholder="Amount" value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                    <input required type="date" value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                    <input placeholder="Note (optional)" value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                    <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </motion.form>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {loading ? (
                        <LoadingSpinner label="Loading expenses…" />
                    ) : (
                        <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="text-left px-5 py-3 font-medium text-slate-500">Category</th>
                                    <th className="text-left px-5 py-3 font-medium text-slate-500">Note</th>
                                    <th className="text-left px-5 py-3 font-medium text-slate-500">Date</th>
                                    <th className="text-right px-5 py-3 font-medium text-slate-500">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((e, i) => (
                                    <motion.tr
                                        key={e.id}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2, delay: i * 0.03 }}
                                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                                    >
                                        <td className="px-5 py-3">
                                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">{e.category}</span>
                                        </td>
                                        <td className="px-5 py-3 text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                {e.note || '—'}
                                                {e.purchaseId && (
                                                    <span title="Linked to a purchase — edit or delete it from the Purchases page">
                                                        <Lock size={11} className="text-slate-300" />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-slate-500">{e.date}</td>
                                        <td className="px-5 py-3 text-right font-medium text-slate-700">₹{Number(e.amount).toFixed(2)}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    )}

                    {!loading && expenses.length === 0 && (
                        <EmptyState
                            icon={Receipt}
                            title="No expenses recorded yet"
                            description="Track rent, salaries, transport and other costs here."
                        />
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Receipt size={16} className="text-slate-600" />
                        <h3 className="font-semibold text-slate-800">By Category</h3>
                    </div>
                    <div className="space-y-3">
                        {byCategory.map(([cat, amt]) => (
                            <div key={cat}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-500">{cat}</span>
                                    <span className="font-medium text-slate-700">₹{amt.toFixed(2)}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand rounded-full"
                                        style={{ width: `${total > 0 ? (amt / total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}