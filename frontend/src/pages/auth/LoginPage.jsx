import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { User, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import Logo from '../../components/ui/Logo.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'

export default function LoginPage() {
    usePageTitle('Sign In')
    const { loginUser } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [remember, setRemember] = useState(true)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await loginUser(email, password)
        } catch (err) {
            const msg = err.response?.data?.detail || 'Invalid email or password.'
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

            <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    <div className="flex flex-col items-center mb-8">
                        <Link to="/" className="mb-4">
                            <Logo className="h-12" />
                        </Link>
                        <h1 className="text-2xl font-semibold font-serif">Welcome back</h1>
                        <p className="text-[#64796a] dark:text-[#a9bfae] text-sm mt-1">Log in to manage your shop.</p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="rounded-2xl bg-white dark:bg-[#101d15] border border-[#e0d9c8] dark:border-[#24402f] p-8 shadow-xl shadow-[#1b3b2b]/5"
                    >
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9a8e]" />
                                <input
                                    type="email"
                                    required
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-[#ddd6c4] dark:border-[#24402f] bg-[#f4f0e6] dark:bg-[#16281d] text-[#1b3b2b] dark:text-[#e8f0e9] text-sm placeholder-[#8b9a8e] focus:outline-none focus:ring-2 focus:ring-brand transition"
                                />
                            </div>

                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9a8e]" />
                                <input
                                    type="password"
                                    required
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-[#ddd6c4] dark:border-[#24402f] bg-[#f4f0e6] dark:bg-[#16281d] text-[#1b3b2b] dark:text-[#e8f0e9] text-sm placeholder-[#8b9a8e] focus:outline-none focus:ring-2 focus:ring-brand transition"
                                />
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-[#64796a] dark:text-[#a9bfae] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={remember}
                                        onChange={(e) => setRemember(e.target.checked)}
                                        className="rounded border-[#d3cbb6] bg-[#f4f0e6] text-brand focus:ring-brand"
                                    />
                                    Remember me
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-[#1b3b2b] dark:text-[#e8f0e9] hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            {error && <p className="text-sm text-red-500">{error}</p>}

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="mt-2 w-full py-3 rounded-xl bg-brand text-white font-medium text-sm hover:bg-brand-light transition disabled:opacity-60"
                            >
                                {loading ? 'Logging in...' : 'Log In'}
                            </motion.button>
                        </form>
                    </motion.div>

                    <p className="text-sm text-[#64796a] dark:text-[#a9bfae] mt-8 text-center">
                        Don't have a shop account?{' '}
                        <Link to="/register" className="text-[#1b3b2b] dark:text-[#e8f0e9] font-medium hover:underline">Register here</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
