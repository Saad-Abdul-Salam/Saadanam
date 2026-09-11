import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Store, CheckCircle, Clock, PauseCircle } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import axiosClient from '../../api/axiosClient.js'

export default function AdminDashboardPage() {
    usePageTitle('Platform Dashboard')
    const [stats, setStats] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        axiosClient.get('/platform-admin/dashboard/')
            .then((res) => setStats(res.data))
            .catch(() => setError('Could not load dashboard stats.'))
    }, [])

    const cards = [
        { label: 'Total Shops', value: stats?.total_shops ?? '—', icon: Store, color: 'text-blue-600 bg-blue-50' },
        { label: 'Active Shops', value: stats?.active_shops ?? '—', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
        { label: 'Pending Approvals', value: stats?.pending_approvals ?? '—', icon: Clock, color: 'text-orange-600 bg-orange-50' },
        { label: 'Suspended Shops', value: stats?.suspended_shops ?? '—', icon: PauseCircle, color: 'text-red-600 bg-red-50' },
    ]

    return (
        <AppLayout title="Platform Dashboard">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <p className="text-slate-500 mb-6">Overview of every shop registered on Saadanam.</p>

                {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {cards.map(({ label, value, icon: Icon, color }, i) => (
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
            </motion.div>
        </AppLayout>
    )
}