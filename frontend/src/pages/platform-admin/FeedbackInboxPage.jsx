import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Send, Clock, MessageSquare, CheckCircle2 } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import * as feedbackApi from '../../api/feedbackApi.js'

const STATUS_STYLES = {
    open: { label: 'Open', color: 'bg-amber-50 text-amber-600', icon: Clock },
    in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-600', icon: MessageSquare },
    resolved: { label: 'Resolved', color: 'bg-green-50 text-green-600', icon: CheckCircle2 },
}

export default function FeedbackInboxPage() {
    usePageTitle('Feedback Inbox')
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState(null)
    const [reply, setReply] = useState('')

    const loadTickets = () => {
        setLoading(true)
        feedbackApi.getAllTickets()
            .then((res) => {
                const list = res.data.results ?? res.data
                setTickets(list)
                if (list.length > 0 && !selectedId) setSelectedId(list[0].id)
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadTickets()
    }, [])

    const selected = tickets.find((t) => t.id === selectedId)

    const markResolved = async () => {
        try {
            await feedbackApi.resolveTicket(selectedId)
            setTickets((prev) => prev.map((t) => (t.id === selectedId ? { ...t, status: 'resolved' } : t)))
        } catch {
            // could add error state
        }
    }

    const sendReply = async (e) => {
        e.preventDefault()
        if (!reply) return
        try {
            const res = await feedbackApi.replyToTicket(selectedId, reply)
            setTickets((prev) =>
                prev.map((t) => (t.id === selectedId ? { ...t, replies: [...t.replies, res.data] } : t))
            )
            setReply('')
        } catch {
            // could add error state
        }
    }

    return (
        <AppLayout title="Feedback Inbox">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    {tickets.map((t) => {
                        const { color } = STATUS_STYLES[t.status]
                        return (
                            <button
                                key={t.id}
                                onClick={() => setSelectedId(t.id)}
                                className={`w-full text-left bg-white rounded-xl border p-4 transition ${selectedId === t.id ? 'border-brand' : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <p className="text-sm font-medium text-slate-800 mb-1">{t.subject}</p>
                                <p className="text-xs text-slate-400 mb-2">{t.shop} · {t.date}</p>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${color}`}>
                                    {STATUS_STYLES[t.status].label}
                                </span>
                            </button>
                        )
                    })}

                    {!loading && tickets.length === 0 && (
                        <EmptyState
                            icon={MessageSquare}
                            title="No tickets yet"
                            description="Support requests from shops will appear here."
                        />
                    )}
                </div>

                <div className="lg:col-span-2">
                    {selected ? (
                        <motion.div
                            key={selected.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-slate-800">{selected.subject}</h3>
                                    <p className="text-xs text-slate-400">{selected.shop}</p>
                                </div>
                                {selected.status !== 'resolved' && (
                                    <button
                                        onClick={markResolved}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-green-50 text-green-600 hover:bg-green-100 transition"
                                    >
                                        <CheckCircle2 size={13} /> Mark Resolved
                                    </button>
                                )}
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 mb-4">
                                {selected.message}
                            </div>

                            {selected.replies?.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    {selected.replies.map((r) => (
                                        <div key={r.id} className="bg-blue-50 rounded-xl p-3 text-sm text-slate-700">
                                            <p className="text-xs text-slate-400 mb-1">{r.senderName} ({r.senderRole})</p>
                                            {r.message}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={sendReply} className="flex gap-2">
                                <input
                                    placeholder="Type a reply..." value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                />
                                <button type="submit" className="px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition">
                                    <Send size={15} />
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <div className="text-center py-16 text-slate-400 text-sm">Select a ticket to view.</div>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}