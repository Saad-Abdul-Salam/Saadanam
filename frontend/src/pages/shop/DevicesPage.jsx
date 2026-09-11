import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Monitor, LogOut, Wifi } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import * as deviceApi from '../../api/deviceApi.js'

export default function DevicesPage() {
    usePageTitle('My Devices')
    const [devices, setDevices] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const loadDevices = () => {
        setLoading(true)
        deviceApi.getMyDevices()
            .then((res) => setDevices(res.data.results ?? res.data))
            .catch(() => setError('Could not load devices.'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadDevices()
    }, [])

    const handleLogout = async (sessionId) => {
        try {
            await deviceApi.logoutDevice(sessionId)
            setDevices((prev) => prev.filter((d) => d.id !== sessionId))
        } catch {
            setError('Failed to log out device.')
        }
    }

    return (
        <AppLayout title="My Devices">
            <p className="text-slate-500 mb-6">
                These are the devices currently signed in to your account. If you don't recognize one, log it out.
            </p>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            {loading ? (
                <LoadingSpinner label="Loading devices…" />
            ) : (
                <div className="space-y-3 max-w-2xl">
                    {devices.map((d, i) => (
                        <motion.div
                            key={d.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-slate-100">
                                    <Monitor size={19} className="text-slate-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">{d.device}</p>
                                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                        <span className="flex items-center gap-1"><Wifi size={11} /> IP {d.ip}</span>
                                        <span>{new Date(d.lastActive).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleLogout(d.id)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition"
                            >
                                <LogOut size={14} /> Log out
                            </button>
                        </motion.div>
                    ))}

                    {devices.length === 0 && (
                        <EmptyState
                            icon={Monitor}
                            title="No active sessions"
                            description="Devices you're signed in on will be listed here."
                        />
                    )}
                </div>
            )}
        </AppLayout>
    )
}