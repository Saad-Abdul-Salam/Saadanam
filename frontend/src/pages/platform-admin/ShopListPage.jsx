import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Search, Store, PauseCircle, PlayCircle } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import axiosClient from '../../api/axiosClient.js'

const STATUS_STYLES = {
    approved: 'bg-green-50 text-green-600',
    pending: 'bg-amber-50 text-amber-600',
    suspended: 'bg-red-50 text-red-600',
    rejected: 'bg-slate-100 text-slate-500',
}

export default function ShopListPage() {
    usePageTitle('All Shops')
    const [shops, setShops] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    const loadShops = () => {
        setLoading(true)
        axiosClient.get('/platform-admin/shops/')
            .then((res) => setShops(res.data.results ?? res.data))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadShops()
    }, [])

    const filtered = shops.filter((s) =>
        s.business_name.toLowerCase().includes(search.toLowerCase()) ||
        s.owner_name.toLowerCase().includes(search.toLowerCase())
    )

    const toggleStatus = async (shop) => {
        const action = shop.status === 'suspended' ? 'activate' : 'suspend'
        try {
            await axiosClient.post(`/platform-admin/shops/${shop.id}/${action}/`)
            loadShops()
        } catch {
            // could add error state
        }
    }

    return (
        <AppLayout title="All Shops">
            <div className="relative w-full sm:w-80 mb-6">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    placeholder="Search shops or owners..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand transition"
                />
            </div>

            {loading ? (
                <LoadingSpinner label="Loading shops…" />
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="text-left px-5 py-3 font-medium text-slate-500">Shop</th>
                                <th className="text-left px-5 py-3 font-medium text-slate-500">Owner</th>
                                <th className="text-left px-5 py-3 font-medium text-slate-500">Joined</th>
                                <th className="text-left px-5 py-3 font-medium text-slate-500">Status</th>
                                <th className="text-right px-5 py-3 font-medium text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s, i) => (
                                <motion.tr
                                    key={s.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2, delay: i * 0.03 }}
                                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                                >
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                                                <Store size={14} className="text-brand" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">{s.business_name}</p>
                                                <p className="text-xs text-slate-400">{s.business_type}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <p className="text-slate-700">{s.owner_name}</p>
                                        <p className="text-xs text-slate-400">{s.owner_email}</p>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{s.created_at?.slice(0, 10)}</td>
                                    <td className="px-5 py-3">
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[s.status]}`}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        {(s.status === 'approved' || s.status === 'suspended') && (
                                            <button
                                                onClick={() => toggleStatus(s)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${s.status === 'suspended'
                                                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                    }`}
                                            >
                                                {s.status === 'suspended' ? <PlayCircle size={13} /> : <PauseCircle size={13} />}
                                                {s.status === 'suspended' ? 'Activate' : 'Suspend'}
                                            </button>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                    </div>

                    {filtered.length === 0 && (
                        <EmptyState
                            icon={Store}
                            title={search ? 'No shops match your search' : 'No shops yet'}
                            description={search ? 'Try a different shop or owner name.' : 'Approved shops will appear here once they register.'}
                        />
                    )}
                </div>
            )}
        </AppLayout>
    )
}