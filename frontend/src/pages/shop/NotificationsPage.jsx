import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Megaphone, Wrench, Sparkles, ShieldAlert } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import * as notificationApi from '../../api/notificationApi.js'

const TYPE_STYLES = {
    announcement: { icon: Megaphone, color: 'text-blue-600 bg-blue-50' },
    maintenance: { icon: Wrench, color: 'text-amber-600 bg-amber-50' },
    feature: { icon: Sparkles, color: 'text-purple-600 bg-purple-50' },
    warning: { icon: ShieldAlert, color: 'text-red-600 bg-red-50' },
}

export default function NotificationsPage() {
    usePageTitle('Notifications')
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        notificationApi.getMyNotifications()
            .then((res) => {
                const list = res.data.results ?? res.data
                setNotifications(list)
                if (list.some((n) => !n.read)) {
                    notificationApi.markAllNotificationsRead().catch(() => {})
                }
            })
            .finally(() => setLoading(false))
    }, [])

    return (
        <AppLayout title="Notifications">
            <p className="text-slate-500 mb-6">Updates and messages from the Saadanam platform.</p>

            {loading ? (
                <LoadingSpinner label="Loading notifications…" />
            ) : (
                <div className="space-y-3 max-w-2xl">
                    {notifications.map((n, i) => {
                        const { icon: Icon, color } = TYPE_STYLES[n.type] ?? TYPE_STYLES.announcement
                        return (
                            <motion.div
                                key={n.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.05 }}
                                className={`bg-white rounded-2xl border p-5 flex gap-4 ${n.read ? 'border-slate-200' : 'border-brand/30'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                                    <Icon size={17} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium text-slate-800">{n.title}</p>
                                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
                                    </div>
                                    <p className="text-sm text-slate-500 mb-1">{n.message}</p>
                                    <p className="text-xs text-slate-400">{n.time}</p>
                                </div>
                            </motion.div>
                        )
                    })}

                    {notifications.length === 0 && (
                        <EmptyState
                            icon={Megaphone}
                            title="No notifications yet"
                            description="Announcements and updates from the Saadanam team will appear here."
                        />
                    )}
                </div>
            )}
        </AppLayout>
    )
}