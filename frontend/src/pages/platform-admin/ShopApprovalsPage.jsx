import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle, XCircle, Store } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import axiosClient from '../../api/axiosClient.js'

export default function ShopApprovalsPage() {
    usePageTitle('Shop Approvals')
    const [shops, setShops] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [actionLoading, setActionLoading] = useState(null)

    const loadPending = () => {
        setLoading(true)
        axiosClient.get('/platform-admin/shops/pending/')
            .then((res) => setShops(res.data.results ?? res.data))
            .catch(() => setError('Could not load pending shops.'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadPending()
    }, [])

    const handleAction = async (shopId, action) => {
        setActionLoading(shopId)
        try {
            await axiosClient.post(`/platform-admin/shops/${shopId}/${action}/`)
            setShops((prev) => prev.filter((s) => s.id !== shopId))
        } catch {
            setError('Action failed. Please try again.')
        } finally {
            setActionLoading(null)
        }
    }

    return (
        <AppLayout title="Shop Approvals">
            <p className="text-slate-500 mb-6">Review and approve pending shop registrations.</p>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            {loading ? (
                <LoadingSpinner label="Loading pending shops…" />
            ) : shops.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200">
                    <EmptyState
                        icon={Store}
                        title="No pending registrations"
                        description="New shop registrations awaiting your approval will appear here."
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shops.map((shop, i) => (
                        <motion.div
                            key={shop.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            className="bg-white rounded-2xl border border-slate-200 p-5"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                                    <Store size={18} className="text-brand" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{shop.business_name}</p>
                                    <p className="text-xs text-slate-400">{shop.business_type}</p>
                                </div>
                            </div>

                            <div className="text-sm text-slate-500 space-y-1 mb-4">
                                <p><span className="text-slate-400">Owner:</span> {shop.owner_name}</p>
                                <p><span className="text-slate-400">Email:</span> {shop.owner_email}</p>
                                <p><span className="text-slate-400">Phone:</span> {shop.owner_phone}</p>
                                <p><span className="text-slate-400">Address:</span> {shop.address}</p>
                                <p><span className="text-slate-400">Tax:</span> {shop.tax_label} — {shop.tax_rate}% ({shop.tax_mode})</p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    disabled={actionLoading === shop.id}
                                    onClick={() => handleAction(shop.id, 'approve')}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition disabled:opacity-50"
                                >
                                    <CheckCircle size={15} /> Approve
                                </button>
                                <button
                                    disabled={actionLoading === shop.id}
                                    onClick={() => handleAction(shop.id, 'reject')}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition disabled:opacity-50"
                                >
                                    <XCircle size={15} /> Reject
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </AppLayout>
    )
}