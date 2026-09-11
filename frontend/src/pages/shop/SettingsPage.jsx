import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Store, Percent, Lock, ImageUp, User, Check, X } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import * as shopApi from '../../api/shopApi.js'
import * as authApi from '../../api/authApi.js'
import { useAuth } from '../../context/AuthContext.jsx'

const TABS = ['Business Info', 'Tax Settings', 'Password']
const TAX_MODES = [
    { value: 'inclusive', label: 'Inclusive (tax already in price)' },
    { value: 'exclusive', label: 'Exclusive (tax added on top)' },
]

export default function SettingsPage() {
    usePageTitle('Shop Settings')
    const { user, updateUser } = useAuth()
    const [activeTab, setActiveTab] = useState(TABS[0])
    const [shop, setShop] = useState(null)
    const [form, setForm] = useState({})
    const [saving, setSaving] = useState(false)
    const [savedMsg, setSavedMsg] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    // profile
    const [profile, setProfile] = useState({ full_name: user?.full_name || '', phone: user?.phone || '' })
    const [savingProfile, setSavingProfile] = useState(false)

    // logo
    const [logoFile, setLogoFile] = useState(null)
    const [logoPreview, setLogoPreview] = useState(null)
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const logoInputRef = useRef(null)

    // password
    const [pw, setPw] = useState({ old_password: '', new_password: '', confirm: '' })
    const [pwMsg, setPwMsg] = useState({ ok: false, text: '' })
    const [savingPw, setSavingPw] = useState(false)

    useEffect(() => {
        shopApi.getMyShop().then((res) => {
            setShop(res.data)
            setForm(res.data)
        })
    }, [])

    const flashSaved = (msg) => {
        setSavedMsg(msg)
        setErrorMsg('')
        setTimeout(() => setSavedMsg(''), 2500)
    }
    const flashError = (msg) => {
        setErrorMsg(msg)
        setSavedMsg('')
    }

    const handleSave = async (fields) => {
        setSaving(true)
        setSavedMsg('')
        try {
            const res = await shopApi.updateMyShop(fields)
            setShop(res.data)
            setForm((prev) => ({ ...prev, ...res.data }))
            flashSaved('Saved successfully.')
        } catch {
            flashError('Failed to save.')
        } finally {
            setSaving(false)
        }
    }

    const handleProfileSave = async (e) => {
        e.preventDefault()
        setSavingProfile(true)
        try {
            const res = await authApi.updateProfile({ full_name: profile.full_name, phone: profile.phone })
            updateUser(res.data)
            flashSaved('Profile updated.')
        } catch {
            flashError('Failed to update profile.')
        } finally {
            setSavingProfile(false)
        }
    }

    const onLogoSelected = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setLogoFile(file)
        setLogoPreview(URL.createObjectURL(file))
    }

    const uploadLogo = async () => {
        if (!logoFile) return
        setUploadingLogo(true)
        try {
            const res = await shopApi.uploadShopLogo(logoFile)
            setShop(res.data)
            setForm((prev) => ({ ...prev, ...res.data }))
            setLogoFile(null)
            setLogoPreview(null)
            flashSaved('Logo updated.')
        } catch {
            flashError('Failed to upload logo.')
        } finally {
            setUploadingLogo(false)
        }
    }

    const handlePasswordChange = async (e) => {
        e.preventDefault()
        setPwMsg({ ok: false, text: '' })
        if (pw.new_password !== pw.confirm) {
            setPwMsg({ ok: false, text: 'New passwords do not match.' })
            return
        }
        if (pw.new_password.length < 8) {
            setPwMsg({ ok: false, text: 'New password must be at least 8 characters.' })
            return
        }
        setSavingPw(true)
        try {
            await authApi.changePassword(pw.old_password, pw.new_password)
            setPw({ old_password: '', new_password: '', confirm: '' })
            setPwMsg({ ok: true, text: 'Password changed successfully.' })
        } catch (err) {
            const detail = err.response?.data?.error
            setPwMsg({ ok: false, text: detail || 'Failed to change password.' })
        } finally {
            setSavingPw(false)
        }
    }

    if (!shop) {
        return (
            <AppLayout title="Shop Settings">
                <LoadingSpinner label="Loading settings…" />
            </AppLayout>
        )
    }

    const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand'
    const currentLogo = shop.logo_url

    return (
        <AppLayout title="Shop Settings">
            <div className="flex gap-1 mb-6 bg-white border border-slate-200 rounded-xl p-1 w-fit max-w-full overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-brand text-white' : 'text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {(savedMsg || errorMsg) && (
                <p className={`text-sm mb-4 ${savedMsg ? 'text-green-600' : 'text-red-500'}`}>{savedMsg || errorMsg}</p>
            )}

            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-2xl border border-slate-200 p-6 max-w-xl space-y-6"
            >
                {activeTab === 'Business Info' && (
                    <>
                        {/* LOGO */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <ImageUp size={17} className="text-brand" />
                                <h3 className="font-semibold text-slate-800">Shop Logo</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                {logoPreview || currentLogo ? (
                                    <img
                                        src={logoPreview || currentLogo}
                                        alt="Shop logo"
                                        className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300">
                                        <Store size={22} />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <input ref={logoInputRef} type="file" accept="image/*" onChange={onLogoSelected} className="hidden" />
                                    <button
                                        type="button"
                                        onClick={() => logoInputRef.current?.click()}
                                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition"
                                    >
                                        Choose image
                                    </button>
                                    {logoFile && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={uploadLogo}
                                                disabled={uploadingLogo}
                                                className="px-3 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60"
                                            >
                                                {uploadingLogo ? 'Uploading...' : 'Save logo'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                                                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                                            >
                                                <X size={15} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* PROFILE */}
                        <form onSubmit={handleProfileSave} className="space-y-3">
                            <div className="flex items-center gap-2">
                                <User size={17} className="text-brand" />
                                <h3 className="font-semibold text-slate-800">Profile</h3>
                            </div>
                            <input placeholder="Full name" value={profile.full_name}
                                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                className={inputClass} />
                            <input placeholder="Phone" value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                className={inputClass} />
                            <button type="submit" disabled={savingProfile} className="px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
                                {savingProfile ? 'Saving...' : 'Update Profile'}
                            </button>
                        </form>

                        {/* BUSINESS DETAILS */}
                        <form onSubmit={(e) => { e.preventDefault(); handleSave({ business_name: form.business_name, address: form.address, invoice_prefix: form.invoice_prefix }) }} className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                <Store size={17} className="text-brand" />
                                <h3 className="font-semibold text-slate-800">Business Details</h3>
                            </div>
                            <input placeholder="Business name" value={form.business_name || ''}
                                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                                className={inputClass} />
                            <input placeholder="Address" value={form.address || ''}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                className={inputClass} />
                            <input placeholder="Invoice prefix" value={form.invoice_prefix || ''}
                                onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })}
                                className={inputClass} />
                            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </>
                )}

                {activeTab === 'Tax Settings' && (
                    <form onSubmit={(e) => { e.preventDefault(); handleSave({ tax_mode: form.tax_mode, tax_rate: form.tax_rate, tax_label: form.tax_label }) }} className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Percent size={17} className="text-brand" />
                            <h3 className="font-semibold text-slate-800">Tax Configuration</h3>
                        </div>
                        <select value={form.tax_mode || 'inclusive'}
                            onChange={(e) => setForm({ ...form, tax_mode: e.target.value })}
                            className={inputClass}>
                            {TAX_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-3">
                            <input placeholder="Tax label (e.g. GST)" value={form.tax_label || ''}
                                onChange={(e) => setForm({ ...form, tax_label: e.target.value })}
                                className={inputClass} />
                            <input type="number" step="0.01" placeholder="Tax rate %" value={form.tax_rate || ''}
                                onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                                className={inputClass} />
                        </div>
                        <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                )}

                {activeTab === 'Password' && (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Lock size={17} className="text-brand" />
                            <h3 className="font-semibold text-slate-800">Change Password</h3>
                        </div>
                        <input required type="password" placeholder="Current password" value={pw.old_password}
                            onChange={(e) => setPw({ ...pw, old_password: e.target.value })}
                            className={inputClass} />
                        <input required type="password" placeholder="New password (min 8 characters)" value={pw.new_password}
                            onChange={(e) => setPw({ ...pw, new_password: e.target.value })}
                            className={inputClass} />
                        <input required type="password" placeholder="Confirm new password" value={pw.confirm}
                            onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                            className={inputClass} />
                        {pwMsg.text && (
                            <p className={`flex items-center gap-1.5 text-sm ${pwMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                                {pwMsg.ok ? <Check size={14} /> : <X size={14} />} {pwMsg.text}
                            </p>
                        )}
                        <button type="submit" disabled={savingPw} className="px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
                            {savingPw ? 'Updating...' : 'Change Password'}
                        </button>
                    </form>
                )}
            </motion.div>
        </AppLayout>
    )
}