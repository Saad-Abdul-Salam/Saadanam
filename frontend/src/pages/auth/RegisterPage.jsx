import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Mail, Phone, Lock, MapPin, Tag, Percent } from 'lucide-react'
import { registerShop } from '../../api/authApi.js'
import Logo from '../../components/ui/Logo.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'

const BUSINESS_TYPES = [
    'Grocery Store', 'Supermarket', 'Hardware Store', 'Electronics Shop',
    'Mobile Shop', 'Medical Store', 'Bakery', 'Garment Store',
    'Book Shop', 'Wholesale Dealer', 'Other'
]

const TAX_MODES = [
    { value: 'inclusive', label: 'Inclusive (tax already in price)' },
    { value: 'exclusive', label: 'Exclusive (tax added on top)' }
]

const TAX_TYPES = ['GST', 'VAT', 'Sales Tax', 'Service Tax', 'Other']

const FIELD_CLASS = 'w-full px-3 py-3 rounded-xl border border-[#ddd6c4] dark:border-[#24402f] bg-[#f4f0e6] dark:bg-[#16281d] text-[#1b3b2b] dark:text-[#e8f0e9] text-sm placeholder-[#8b9a8e] focus:outline-none focus:ring-2 focus:ring-brand transition'
const ICON_FIELD_CLASS = 'w-full pl-10 pr-3 py-3 rounded-xl border border-[#ddd6c4] dark:border-[#24402f] bg-[#f4f0e6] dark:bg-[#16281d] text-[#1b3b2b] dark:text-[#e8f0e9] text-sm placeholder-[#8b9a8e] focus:outline-none focus:ring-2 focus:ring-brand transition'
const ICON_COLOR = 'text-[#8b9a8e] dark:text-[#6f8a76]'

export default function RegisterPage() {
    usePageTitle('Register Your Shop')
    const navigate = useNavigate()
    const [form, setForm] = useState({
        businessName: '',
        ownerName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        address: '',
        businessType: BUSINESS_TYPES[0],
        gst: '',
        taxMode: 'inclusive',
        taxRate: '',
        taxType: 'GST',
        taxLabelCustom: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)
        try {
            await registerShop({
                email: form.email,
                password: form.password,
                full_name: form.ownerName,
                phone: form.phone,
                business_name: form.businessName,
                business_type: form.businessType,
                address: form.address,
                gst_number: form.gst,
                tax_mode: form.taxMode,
                tax_rate: form.taxRate || 0,
                tax_label: form.taxType === 'Other' ? (form.taxLabelCustom || 'Tax') : form.taxType
            })
            navigate('/login')
        } catch (err) {
            const msg = err.response?.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Something went wrong. Please try again.'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen w-full bg-[#f7f4ee] text-[#1b3b2b] dark:bg-[#0a120c] dark:text-[#e8f0e9] overflow-hidden">
            {/* Soft ambient background blobs */}
            <div aria-hidden className="pointer-events-none absolute -top-40 -right-24 w-[520px] h-[520px] rounded-full bg-[#1b3b2b]/5 dark:bg-[#2c5c42]/10 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute bottom-0 -left-40 w-[440px] h-[440px] rounded-full bg-[#2c7a4b]/5 dark:bg-[#2c5c42]/10 blur-3xl" />

            <div className="relative z-10 min-h-screen flex items-start justify-center px-6 py-12">
                <div className="w-full max-w-lg">
                    <div className="flex flex-col items-center mb-8">
                        <Link to="/" className="mb-4">
                            <Logo className="h-12" />
                        </Link>
                        <h1 className="text-2xl font-semibold font-serif">Register your shop</h1>
                        <p className="text-[#64796a] dark:text-[#a9bfae] text-sm mt-1">
                            Your account will be reviewed before you can log in.
                        </p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="rounded-2xl bg-white dark:bg-[#101d15] border border-[#e0d9c8] dark:border-[#24402f] p-8 shadow-xl shadow-[#1b3b2b]/5"
                    >
                        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                            <div className="relative">
                                <Tag size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${ICON_COLOR}`} />
                                <input
                                    required placeholder="Business name" value={form.businessName}
                                    onChange={update('businessName')}
                                    className={ICON_FIELD_CLASS}
                                />
                            </div>

                            <input
                                required placeholder="Owner full name" value={form.ownerName}
                                onChange={update('ownerName')}
                                className={FIELD_CLASS}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <Phone size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${ICON_COLOR}`} />
                                    <input
                                        required type="tel" placeholder="Phone" value={form.phone}
                                        onChange={update('phone')}
                                        className={ICON_FIELD_CLASS}
                                    />
                                </div>
                                <div className="relative">
                                    <Mail size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${ICON_COLOR}`} />
                                    <input
                                        required type="email" placeholder="Email" value={form.email}
                                        onChange={update('email')}
                                        className={ICON_FIELD_CLASS}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <Lock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${ICON_COLOR}`} />
                                    <input
                                        required type="password" placeholder="Password" value={form.password}
                                        onChange={update('password')}
                                        className={ICON_FIELD_CLASS}
                                    />
                                </div>
                                <div className="relative">
                                    <Lock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${ICON_COLOR}`} />
                                    <input
                                        required type="password" placeholder="Confirm password" value={form.confirmPassword}
                                        onChange={update('confirmPassword')}
                                        className={ICON_FIELD_CLASS}
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <MapPin size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${ICON_COLOR}`} />
                                <input
                                    required placeholder="Business address" value={form.address}
                                    onChange={update('address')}
                                    className={ICON_FIELD_CLASS}
                                />
                            </div>

                            <select
                                value={form.businessType}
                                onChange={update('businessType')}
                                className={FIELD_CLASS}
                            >
                                {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>

                            <div className="relative">
                                <Tag size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${ICON_COLOR}`} />
                                <input
                                    placeholder="GST number (optional)" value={form.gst}
                                    onChange={update('gst')}
                                    className={ICON_FIELD_CLASS}
                                />
                            </div>

                            <div className="pt-2 pb-1">
                                <p className="text-xs font-medium text-[#8b9a8e] dark:text-[#6f8a76] uppercase tracking-wide">Tax Settings</p>
                            </div>

                            <select
                                value={form.taxMode}
                                onChange={update('taxMode')}
                                className={FIELD_CLASS}
                            >
                                {TAX_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>

                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    value={form.taxType}
                                    onChange={update('taxType')}
                                    className={FIELD_CLASS}
                                >
                                    {TAX_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>

                                <div className="relative">
                                    <Percent size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${ICON_COLOR}`} />
                                    <input
                                        type="number" step="0.01" min="0" max="100"
                                        placeholder="Tax rate %" value={form.taxRate}
                                        onChange={update('taxRate')}
                                        className={ICON_FIELD_CLASS}
                                    />
                                </div>
                            </div>

                            {form.taxType === 'Other' && (
                                <input
                                    placeholder="Custom tax name" value={form.taxLabelCustom}
                                    onChange={update('taxLabelCustom')}
                                    className={FIELD_CLASS}
                                />
                            )}

                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="mt-2 w-full py-3 rounded-xl bg-brand text-white font-medium text-sm hover:bg-brand-light transition disabled:opacity-60"
                            >
                                {loading ? 'Submitting...' : 'Create Account'}
                            </motion.button>
                        </form>
                    </motion.div>

                    <p className="text-sm text-[#64796a] dark:text-[#a9bfae] mt-8 text-center">
                        Already registered?{' '}
                        <Link to="/login" className="text-[#1b3b2b] dark:text-[#e8f0e9] font-medium hover:underline">Log in</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
