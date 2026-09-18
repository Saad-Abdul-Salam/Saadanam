import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Mail, Lock, ShieldCheck, KeyRound, Eye, EyeOff } from 'lucide-react'
import {
    requestPasswordReset,
    verifyPasswordResetOtp,
    confirmPasswordReset,
} from '../../api/passwordReset.js'
import Logo from '../../components/ui/Logo.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'

// Same field styling used across LoginPage / RegisterPage.
const FIELD_CLASS = 'w-full px-3 py-3 rounded-xl border border-[#ddd6c4] dark:border-[#24402f] bg-[#f4f0e6] dark:bg-[#16281d] text-[#1b3b2b] dark:text-[#e8f0e9] text-sm placeholder-[#8b9a8e] focus:outline-none focus:ring-2 focus:ring-brand transition'
const ICON_FIELD_CLASS = 'w-full pl-10 pr-3 py-3 rounded-xl border border-[#ddd6c4] dark:border-[#24402f] bg-[#f4f0e6] dark:bg-[#16281d] text-[#1b3b2b] dark:text-[#e8f0e9] text-sm placeholder-[#8b9a8e] focus:outline-none focus:ring-2 focus:ring-brand transition'
const ICON_COLOR = 'text-[#8b9a8e] dark:text-[#6f8a76]'
const BUTTON_CLASS = 'mt-2 w-full py-3 rounded-xl bg-brand text-white font-medium text-sm hover:bg-brand-light transition disabled:opacity-60'

const STEPS = ['Email', 'Verify code', 'New password']

export default function ForgotPasswordPage() {
    usePageTitle('Reset Password')
    const navigate = useNavigate()

    const [step, setStep] = useState(1)
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const extractError = (err, fallback) =>
        err.response?.data?.error || err.response?.data?.detail || fallback

    /* ---------------- Step 1: request OTP ---------------- */
    const handleRequestOtp = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await requestPasswordReset(email)
            setStep(2)
        } catch (err) {
            setError(extractError(err, 'Could not send the reset email. Please try again.'))
        } finally {
            setLoading(false)
        }
    }

    /* ---------------- Step 2: verify OTP ---------------- */
    const handleVerifyOtp = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await verifyPasswordResetOtp(email, otp)
            setStep(3)
        } catch (err) {
            setError(extractError(err, 'Invalid or expired code.'))
        } finally {
            setLoading(false)
        }
    }

    /* ---------------- Step 3: set new password ---------------- */
    const handleConfirmReset = async (e) => {
        e.preventDefault()
        setError('')

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)
        try {
            await confirmPasswordReset(email, otp, newPassword, confirmPassword)
            navigate('/login', {
                state: { resetSuccess: true },
                replace: true,
            })
        } catch (err) {
            setError(extractError(err, 'Could not reset your password. Please try again.'))
        } finally {
            setLoading(false)
        }
    }

    const resendCode = async () => {
        setError('')
        setLoading(true)
        try {
            await requestPasswordReset(email)
            setError('')
            // Reuse step 2 with a fresh code sent; inform the user.
            setError('sent')
        } catch (err) {
            setError(extractError(err, 'Could not resend the code. Please try again.'))
        } finally {
            setLoading(false)
        }
    }

    const backToEmail = () => {
        setStep(1)
        setOtp('')
        setError('')
    }

    return (
        <div className="relative min-h-screen w-full bg-[#f7f4ee] text-[#1b3b2b] dark:bg-[#0a120c] dark:text-[#e8f0e9] overflow-hidden">
            {/* Soft ambient background blobs */}
            <div aria-hidden className="pointer-events-none absolute -top-40 -right-24 w-[520px] h-[520px] rounded-full bg-[#1b3b2b]/5 dark:bg-[#2c5c42]/10 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute bottom-0 -left-40 w-[440px] h-[440px] rounded-full bg-[#2c7a4b]/5 dark:bg-[#2c5c42]/10 blur-3xl" />

            <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    <div className="flex flex-col items-center mb-8">
                        <Link to="/" className="mb-4">
                            <Logo className="h-12" />
                        </Link>
                        <h1 className="text-2xl font-semibold font-serif">Reset your password</h1>
                        <p className="text-[#64796a] dark:text-[#a9bfae] text-sm mt-1">
                            {step === 1 && "We'll email you a 6-digit code."}
                            {step === 2 && `Enter the code we sent to ${email}.`}
                            {step === 3 && 'Choose a new password for your account.'}
                        </p>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center justify-center gap-2 mb-6" aria-hidden>
                        {STEPS.map((label, i) => {
                            const n = i + 1
                            const active = step === n
                            const done = step > n
                            return (
                                <div key={label} className="flex items-center gap-2">
                                    <span
                                        className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center border transition ${
                                            done
                                                ? 'bg-brand border-brand text-white'
                                                : active
                                                    ? 'border-brand text-brand bg-[#dce8dc] dark:bg-[#16281d]'
                                                    : 'border-[#ddd6c4] dark:border-[#24402f] text-[#8b9a8e]'
                                        }`}
                                    >
                                        {done ? '✓' : n}
                                    </span>
                                    <span className={`text-xs ${active ? 'text-[#1b3b2b] dark:text-[#e8f0e9] font-medium' : 'text-[#8b9a8e]'}`}>
                                        {label}
                                    </span>
                                    {n < STEPS.length && <span className="w-6 h-px bg-[#ddd6c4] dark:bg-[#24402f]" />}
                                </div>
                            )
                        })}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="rounded-2xl bg-white dark:bg-[#101d15] border border-[#e0d9c8] dark:border-[#24402f] p-8 shadow-xl shadow-[#1b3b2b]/5"
                    >
                        {step === 1 && (
                            <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
                                <div className="relative">
                                    <Mail size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${ICON_COLOR}`} />
                                    <input
                                        type="email"
                                        required
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={ICON_FIELD_CLASS}
                                    />
                                </div>

                                {error && <p className="text-sm text-red-500">{error}</p>}

                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className={BUTTON_CLASS}
                                >
                                    {loading ? 'Sending code...' : 'Send Reset Code'}
                                </motion.button>

                                <Link to="/login" className="text-center text-sm text-[#64796a] dark:text-[#a9bfae] hover:underline">
                                    Back to login
                                </Link>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                                <div className="relative">
                                    <ShieldCheck size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${ICON_COLOR}`} />
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="\d{6}"
                                        maxLength={6}
                                        required
                                        autoComplete="one-time-code"
                                        placeholder="6-digit code"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className={`${ICON_FIELD_CLASS} tracking-[0.5em] text-center font-semibold`}
                                    />
                                </div>

                                {error && (
                                    <p className={`text-sm ${error === 'sent' ? 'text-[#2c7a4b] dark:text-[#7ec99a]' : 'text-red-500'}`}>
                                        {error === 'sent' ? 'A new code has been sent.' : error}
                                    </p>
                                )}

                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className={BUTTON_CLASS}
                                >
                                    {loading ? 'Verifying...' : 'Verify Code'}
                                </motion.button>

                                <div className="flex items-center justify-between text-sm">
                                    <button type="button" onClick={backToEmail} className="text-[#64796a] dark:text-[#a9bfae] hover:underline">
                                        Change email
                                    </button>
                                    <button type="button" onClick={resendCode} disabled={loading} className="text-[#1b3b2b] dark:text-[#e8f0e9] hover:underline disabled:opacity-60">
                                        Resend code
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 3 && (
                            <form onSubmit={handleConfirmReset} className="flex flex-col gap-4">
                                <div className="relative">
                                    <KeyRound size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${ICON_COLOR}`} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={8}
                                        placeholder="New password (min 8 characters)"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className={ICON_FIELD_CLASS}
                                    />
                                </div>

                                <div className="relative">
                                    <Lock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${ICON_COLOR}`} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={8}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`${ICON_FIELD_CLASS} pr-10`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b9a8e] hover:text-[#1b3b2b] dark:hover:text-[#e8f0e9]"
                                        aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>

                                {error && <p className="text-sm text-red-500">{error}</p>}

                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className={BUTTON_CLASS}
                                >
                                    {loading ? 'Saving...' : 'Reset Password'}
                                </motion.button>

                                <button
                                    type="button"
                                    onClick={() => { setStep(2); setError('') }}
                                    className="text-center text-sm text-[#64796a] dark:text-[#a9bfae] hover:underline"
                                >
                                    Back to code verification
                                </button>
                            </form>
                        )}
                    </motion.div>

                    <p className="text-sm text-[#64796a] dark:text-[#a9bfae] mt-8 text-center">
                        Remembered it?{' '}
                        <Link to="/login" className="text-[#1b3b2b] dark:text-[#e8f0e9] font-medium hover:underline">Log in</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
