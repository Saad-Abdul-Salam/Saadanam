import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Receipt, Package, Activity } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import * as reportApi from '../../api/reportApi.js'

export default function AnalyticsPage() {
    usePageTitle('Analytics')
    const [data, setData] = useState(null)

    useEffect(() => {
        reportApi.getPlatformAnalytics().then((res) => setData(res.data)).catch(() => { })
    }, [])

    const stats = [
        { label: 'Total Bills Generated', value: data?.totalBills ?? '—', icon: Receipt, color: 'text-blue-600 bg-blue-50' },
        { label: 'Total Products Stored', value: data?.totalProducts ?? '—', icon: Package, color: 'text-purple-600 bg-purple-50' },
        { label: 'Active Shops Today', value: data?.activeToday ?? '—', icon: Activity, color: 'text-green-600 bg-green-50' },
    ]

    const registrationData = (data?.registrations ?? []).map((r) => ({ month: r.month, shops: r.shops }))

    return (
        <AppLayout title="Analytics">
            <p className="text-slate-500 mb-6">Platform-wide statistics. Individual business data stays private.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {stats.map(({ label, value, icon: Icon, color }, i) => (
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

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Shop Registrations Over Time</h3>
                <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={registrationData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                        <Line type="monotone" dataKey="shops" stroke="#1b3b2b" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 5, fill: '#1b3b2b' }} />
                    </LineChart>
                </ResponsiveContainer>
            </motion.div>
        </AppLayout>
    )
}