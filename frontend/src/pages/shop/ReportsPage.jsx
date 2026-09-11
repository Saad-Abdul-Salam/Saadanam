import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, Download, Wallet, Receipt, IndianRupee } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import * as reportApi from '../../api/reportApi.js'
import downloadCsv from '../../utils/downloadCsv.js'

const todayISO = () => new Date().toISOString().slice(0, 10)
const daysAgoISO = (n) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d.toISOString().slice(0, 10)
}

export default function ReportsPage() {
    usePageTitle('Reports')
    const [start, setStart] = useState(daysAgoISO(6))
    const [end, setEnd] = useState(todayISO())
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [exporting, setExporting] = useState(false)

    const load = useCallback(() => {
        setLoading(true)
        setError('')
        reportApi.getSalesReport(start, end)
            .then((res) => setData(res.data))
            .catch(() => setError('Could not load sales report.'))
            .finally(() => setLoading(false))
    }, [start, end])

    useEffect(() => {
        load()
    }, [load])

    const handleExport = async () => {
        setExporting(true)
        try {
            await downloadCsv(reportApi.exportSalesReportUrl(start, end), `sales-report-${start}-to-${end}.csv`)
        } catch {
            setError('Could not export report.')
        } finally {
            setExporting(false)
        }
    }

    const summary = [
        { label: 'Total Sales', value: `₹${(data?.totalSales ?? 0).toFixed(2)}`, icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
        { label: 'Total Profit', value: `₹${(data?.totalProfit ?? 0).toFixed(2)}`, icon: Wallet, color: 'text-green-600 bg-green-50' },
        { label: 'Invoices', value: data?.totalInvoices ?? 0, icon: Receipt, color: 'text-purple-600 bg-purple-50' },
        { label: 'Profit Margin', value: `${data && data.totalSales > 0 ? ((data.totalProfit / data.totalSales) * 100).toFixed(1) : 0}%`, icon: IndianRupee, color: 'text-orange-600 bg-orange-50' },
    ]

    return (
        <AppLayout title="Reports">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div className="flex items-end gap-3">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">From</label>
                        <input
                            type="date" value={start} max={end}
                            onChange={(e) => setStart(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">To</label>
                        <input
                            type="date" value={end} min={start} max={todayISO()}
                            onChange={(e) => setEnd(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                        />
                    </div>
                    <button
                        onClick={() => { setStart(daysAgoISO(6)); setEnd(todayISO()) }}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 transition"
                    >
                        Last 7 days
                    </button>
                </div>

                <button
                    onClick={handleExport}
                    disabled={exporting || loading || !data}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50"
                >
                    <Download size={15} /> {exporting ? 'Exporting...' : 'Export CSV'}
                </button>
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {summary.map(({ label, value, icon: Icon, color }, i) => (
                    <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-slate-200 p-5"
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                            <Icon size={18} />
                        </div>
                        <p className="text-sm text-slate-400 mb-1">{label}</p>
                        <p className="text-xl font-semibold text-slate-800">{value}</p>
                    </motion.div>
                ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={16} className="text-brand" />
                    <h3 className="font-semibold text-slate-800">Sales & Profit</h3>
                </div>
                {loading ? (
                    <LoadingSpinner label="Loading report…" />
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.daily}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                            <Legend />
                            <Line type="monotone" dataKey="sales" name="Sales" stroke="#1b3b2b" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 4, fill: '#1b3b2b' }} />
                            <Line type="monotone" dataKey="profit" name="Profit" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 4, fill: '#059669' }} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Daily Sales Volume</h3>
                {!loading && (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data.daily}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                            <Bar dataKey="sales" fill="#1b3b2b" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </motion.div>
        </AppLayout>
    )
}