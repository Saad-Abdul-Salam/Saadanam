import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Search, Monitor, LogOut } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import * as deviceApi from '../../api/deviceApi.js'

export default function ShopDevicesPage() {
    usePageTitle('Shop Devices')
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')

    const loadSessions = () => {
        setLoading(true)
        deviceApi.getShopDevices()
            .then((res) => setSessions(res.data.results ?? res.data))
            .catch(() => setError('Could not load device sessions.'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadSessions()
    }, [])

    const filtered = sessions.filter((s) => s.shopName.toLowerCase().includes(search.toLowerCase()))

    const forceLogout = async (sessionId) => {
        try {
            await deviceApi.forceLogoutDevice(sessionId)
            setSessions((prev) => prev.filter((s) => s.id !== sessionId))
        } catch {
            setError('Failed to force-logout device.')
        }
    }

    return (
        <AppLayout title="Shop Devices">
            <p className="text-slate-500 mb-4">Active login sessions across every shop on the platform.</p>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            <div className="relative w-full sm:w-80 mb-6">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    placeholder="Search by shop name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand transition"
                />
            </div>

            {loading ? (
                <LoadingSpinner label="Loading sessions…" />
            ) : (
                <div className="space-y-3 max-w-3xl">
                    {filtered.map((s, i) => (
                        <motion.div
                            key={s.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                    <Monitor size={17} className="text-slate-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">{s.shopName}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{s.device} · IP {s.ip} · {new Date(s.lastActive).toLocaleString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => forceLogout(s.id)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition"
                            >
                                <LogOut size={14} /> Force Logout
                            </button>
                        </motion.div>
                    ))}

                    {filtered.length === 0 && (
                        <EmptyState
                            icon={Monitor}
                            title={search ? 'No matching sessions' : 'No active sessions'}
                            description={search ? 'Try a different shop name.' : 'Device logins across all shops will appear here.'}
                        />
                    )}
                </div>
            )}
        </AppLayout>
    )
}