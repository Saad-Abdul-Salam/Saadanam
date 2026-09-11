import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, X, Clock, MessageSquare, CheckCircle2, ChevronDown, ChevronUp, Send } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import { useToast } from '../../components/ui/Toast.jsx'
import * as feedbackApi from '../../api/feedbackApi.js'

const STATUS_STYLES = {
  open: { label: 'Open', color: 'bg-amber-50 text-amber-600', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-600', icon: MessageSquare },
  resolved: { label: 'Resolved', color: 'bg-green-50 text-green-600', icon: CheckCircle2 },
}

export default function FeedbackPage() {
  usePageTitle('Feedback & Support')
  const toast = useToast()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [replyDrafts, setReplyDrafts] = useState({})
  const [sendingId, setSendingId] = useState(null)

  const handleReply = async (ticketId) => {
    const message = (replyDrafts[ticketId] || '').trim()
    if (!message) return
    setSendingId(ticketId)
    try {
      const res = await feedbackApi.replyToTicket(ticketId, message)
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, replies: [...t.replies, res.data] } : t))
      )
      setReplyDrafts((d) => ({ ...d, [ticketId]: '' }))
      toast.success('Reply sent.')
    } catch {
      toast.error('Could not send your reply. Please try again.')
    } finally {
      setSendingId(null)
    }
  }

  const loadTickets = () => {
    setLoading(true)
    feedbackApi.getMyTickets()
      .then((res) => setTickets(res.data.results ?? res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!subject || !message) return
    setSaving(true)
    try {
      const res = await feedbackApi.createTicket({ subject, message })
      setTickets((prev) => [res.data, ...prev])
      setSubject('')
      setMessage('')
      setShowForm(false)
      toast.success('Ticket submitted — our team will reply soon.')
    } catch {
      toast.error('Could not submit your ticket. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout title="Feedback & Support">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <p className="text-slate-500">
          Report bugs or request features, or email us at{' '}
          <a
            href="mailto:support@saadanam.app"
            className="font-medium text-brand hover:underline underline-offset-2"
          >
            support@saadanam.app
          </a>.
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New Ticket'}
        </button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 space-y-3 max-w-xl"
        >
          <input required placeholder="Subject" value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
          <textarea required rows={4} placeholder="Describe the issue or request..." value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
          <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
            {saving ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </motion.form>
      )}

      {loading ? (
        <LoadingSpinner label="Loading tickets…" />
      ) : (
        <div className="space-y-3 max-w-2xl">
          {tickets.map((t, i) => {
            const { label, color, icon: Icon } = STATUS_STYLES[t.status]
            const replies = t.replies ?? []
            const isExpanded = expandedId === t.id

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : t.id)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div>
                    <p className="font-medium text-slate-800 mb-1">{t.subject}</p>
                    <p className="text-xs text-slate-400">
                      Opened {t.date} · {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${color}`}>
                      <Icon size={12} /> {label}
                    </span>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5 border-t border-slate-100 pt-4"
                    >
                      <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 mb-3">
                        {t.message}
                      </div>

                      {replies.length > 0 ? (
                        <div className="space-y-2">
                          {replies.map((r) => (
                            <div
                              key={r.id}
                              className={`rounded-xl p-3 text-sm ${
                                r.senderRole === 'platform_admin' ? 'bg-blue-50 text-slate-700' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              <p className="text-xs text-slate-400 mb-1">
                                {r.senderRole === 'platform_admin' ? 'Saadanam Support' : r.senderName}
                              </p>
                              {r.message}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No replies yet.</p>
                      )}

                      {/* Continue the conversation on this same ticket */}
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleReply(t.id) }}
                        className="mt-3 flex gap-2"
                      >
                        <input
                          value={replyDrafts[t.id] || ''}
                          onChange={(e) => setReplyDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
                          placeholder="Type a reply... (Enter to send)"
                          className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                        />
                        <button
                          type="submit"
                          disabled={sendingId === t.id || !(replyDrafts[t.id] || '').trim()}
                          className="px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-light transition disabled:opacity-60"
                          title="Send reply"
                        >
                          <Send size={15} />
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}

          {tickets.length === 0 && (
            <EmptyState
              icon={MessageSquare}
              title="No tickets yet"
              description="Need help or have an idea? Open your first ticket above."
            />
          )}
        </div>
      )}
    </AppLayout>
  )
}