import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { Compass, ArrowLeft, Store } from 'lucide-react'
import Logo from '../components/ui/Logo.jsx'
import usePageTitle from '../hooks/usePageTitle.js'

export default function NotFoundPage() {
    usePageTitle('Page Not Found')
    const location = useLocation()
    const cameFromApp = location.pathname.startsWith('/shop') || location.pathname.startsWith('/admin')

    return (
        <div className="relative min-h-screen w-full bg-[#f7f4ee] text-[#1b3b2b] dark:bg-[#0a120c] dark:text-[#e8f0e9] flex items-center justify-center px-6 py-12 overflow-hidden">
            {/* Soft ambient background blobs */}
            <div aria-hidden className="pointer-events-none absolute -top-40 -right-24 w-[520px] h-[520px] rounded-full bg-[#1b3b2b]/5 dark:bg-[#2c5c42]/10 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute bottom-0 -left-40 w-[440px] h-[440px] rounded-full bg-[#2c7a4b]/5 dark:bg-[#2c5c42]/10 blur-3xl" />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 text-center max-w-md"
            >
                <Link to="/" className="inline-block mb-8">
                    <Logo className="h-11" />
                </Link>

                <div className="mx-auto w-20 h-20 rounded-3xl bg-[#1b3b2b] dark:bg-[#16281d] flex items-center justify-center mb-6 shadow-xl shadow-[#1b3b2b]/20">
                    <Compass size={36} className="text-[#7ec99a]" />
                </div>

                <h1 className="font-serif font-semibold text-6xl tracking-tight">404</h1>
                <h2 className="mt-2 font-serif text-2xl font-semibold">This page took a day off</h2>
                <p className="mt-3 text-[#4c6654] dark:text-[#a9bfae] leading-relaxed">
                    The page <span className="font-mono text-sm bg-[#ece6d8] dark:bg-[#16281d] px-2 py-0.5 rounded-lg break-all">{location.pathname}</span> doesn't exist
                    or was moved. Let's get you back to business.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    {cameFromApp ? (
                        <Link
                            to="/shop/dashboard"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1b3b2b] dark:bg-[#2c5c42] text-white font-medium hover:bg-[#2c5c42] dark:hover:bg-[#3a7052] transition"
                        >
                            <ArrowLeft size={16} /> Back to Dashboard
                        </Link>
                    ) : (
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1b3b2b] dark:bg-[#2c5c42] text-white font-medium hover:bg-[#2c5c42] dark:hover:bg-[#3a7052] transition"
                        >
                            <ArrowLeft size={16} /> Back to Home
                        </Link>
                    )}
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#1b3b2b]/20 dark:border-white/15 font-medium hover:bg-[#f2ede1] dark:hover:bg-[#1e3a2a] transition"
                    >
                        <Store size={16} /> Sign In
                    </Link>
                </div>

                <p className="mt-8 text-sm text-[#64796a] dark:text-[#a9bfae]">
                    Think this is a mistake?{' '}
                    <a href="mailto:support@saadanam.app" className="font-medium text-[#1b3b2b] dark:text-[#e8f0e9] underline underline-offset-2 hover:text-[#2c7a4b] dark:hover:text-[#7ec99a] transition">
                        support@saadanam.app
                    </a>
                </p>
            </motion.div>
        </div>
    )
}
