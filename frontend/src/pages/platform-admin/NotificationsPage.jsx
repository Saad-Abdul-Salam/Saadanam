import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Send, Megaphone, Wrench, Sparkles, ShieldAlert } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import axiosClient from '../../api/axiosClient.js'
import * as notificationApi from '../../api/notificationApi.js'

const TYPES = [
    { value: 'announcement', label: 'Announcement', icon: Megaphone },
    { value: 'maintenance', label: 'Maintenance', icon: Wrench },
    { value: 'feature', label: 'Feature Update', icon: Sparkles },
    { value: 'warning', label: 'Warning', icon: ShieldAlert },
]

export default function NotificationsPage() {
    usePageTitle('Send Notifications')
    const [type, setType] = useState(TYPES[0].value)
    const [title, setTitle] = useState('')
    const [message, setMessage] = useState('')
    const [sent, setSent] = useState([])
    const [sending, setSending] = useState(false)

    const [shops, setShops] = useState([])
    const [targetMode, setTargetMode] = useState('all') // 'all' | 'selected'
    const [selectedShopIds, setSelectedShopIds] = useState([])

    const loadSent = () => {
        notificationApi.getSentNotifications()
            .then((res) => setSent(res.data.results ?? res.data))
            .catch(() => { })
    }

    useEffect(() => {
        loadSent()
        axiosClient.get('/platform-admin/shops/')
            .then((res) => {
                const all = res.data.results ?? res.data
                setShops(all.filter((s) => s.status === 'approved'))
            })
            .catch(() => { })
    }, [])

    const toggleShop = (id) => {
        setSelectedShopIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }

    const handleSend = async (e) => {
        e.preventDefault()
        if (!title || !message) return
        if (targetMode === 'selected' && selectedShopIds.length === 0) return
        setSending(true)
        try {
            await notificationApi.sendNotification({
                type, title, message,
                ...(targetMode === 'selected' ? { shop_ids: selectedShopIds } : {}),
            })
            setTitle('')
            setMessage('')
            setSelectedShopIds([])
            loadSent()
        } catch {
            // could add error state here
        } finally {
            setSending(false)
        }
    }

    const targetLabel = targetMode === 'all'
        ? 'All shops'
        : `${selectedShopIds.length} shop${selectedShopIds.length === 1 ? '' : 's'}`

    return (
        <AppLayout title="Send Notifications">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <form onSubmit={handleSend} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 h-fit">
                    <h3 className="font-semibold text-slate-800 mb-1">Send a Message</h3>

                    <div className="grid grid-cols-4 gap-2">
                        {TYPES.map(({ value, label, icon: Icon }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setType(value)}
                                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition ${type === value ? 'bg-brand text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                    }`}
                            >
                                <Icon size={16} />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* TARGET SELECTION */}
                    <div>
                        <p className="text-xs font-medium text-slate-500 mb-2">Send to</p>
                        <div className="flex gap-2 mb-2">
                            <button
                                type="button"
                                onClick={() => setTargetMode('all')}
                                className={`flex-1 py-2 rounded-xl text-xs font-medium transition ${targetMode === 'all' ? 'bg-brand text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                    }`}
                            >
                                All shops
                            </button>
                            <button
                                type="button"
                                onClick={() => setTargetMode('selected')}
                                className={`flex-1 py-2 rounded-xl text-xs font-medium transition ${targetMode === 'selected' ? 'bg-brand text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                    }`}
                            >
                                Specific shops
                            </button>
                        </div>

                        {targetMode === 'selected' && (
                            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
                                {shops.length === 0 && (
                                    <p className="text-xs text-slate-400 py-2 text-center">No approved shops yet.</p>
                                )}
                                {shops.map((s) => (
                                    <label
                                        key={s.id}
                                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm cursor-pointer transition ${selectedShopIds.includes(s.id) ? 'bg-brand/10 text-brand' : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedShopIds.includes(s.id)}
                                            onChange={() => toggleShop(s.id)}
                                            className="accent-[#1b3b2b]"
                                        />
                                        {s.business_name}
                                        <span className="ml-auto text-xs text-slate-400">{s.owner_name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <input required placeholder="Title" value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                    <textarea required rows={4} placeholder="Message" value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none" />

                    <button type="submit" disabled={sending || (targetMode === 'selected' && selectedShopIds.length === 0)} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
                        <Send size={15} /> {sending ? 'Sending...' : `Send to ${targetLabel}`}
                    </button>
                </form>

                <div>
                    <h3 className="font-semibold text-slate-800 mb-3">Recently Sent</h3>
                    <div className="space-y-3">
                        {sent.map((n, i) => {
                            const TypeIcon = TYPES.find((t) => t.value === n.type)?.icon ?? Megaphone
                            return (
                                <motion.div
                                    key={n.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: i * 0.05 }}
                                    className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                                        <TypeIcon size={15} className="text-slate-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-800">{n.title}</p>
                                        <p className="text-xs text-slate-400">{n.sentTo} · {n.date}</p>
                                    </div>
                                </motion.div>
                            )
                        })}

                        {sent.length === 0 && (
                            <EmptyState
                                icon={Megaphone}
                                title="Nothing sent yet"
                                description="Messages you broadcast to shops will appear here."
                            />
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}