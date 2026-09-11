import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
    ArrowRight, Sparkles, CheckCircle2, PlayCircle,
    Sun, Moon, FileCheck, Box, Users, BarChart3, Sprout,
    Store, ShoppingCart, Package, Menu, X
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'
import Logo from '../../components/ui/Logo.jsx'

const FEATURES = [
    {
        icon: FileCheck,
        title: 'Smart Billing',
        description: 'Create invoices in seconds and get paid faster.'
    },
    {
        icon: Box,
        title: 'Stock Control',
        description: 'Track stock in real-time and never run out.'
    },
    {
        icon: Users,
        title: 'Customer Management',
        description: 'Keep customer details, history and follow-ups organized.'
    },
    {
        icon: BarChart3,
        title: 'Reports & Insights',
        description: 'Make better decisions with powerful business reports.'
    }
]

const PRICING_PERKS = [
    'Unlimited billing & invoices',
    'Real-time stock & purchase tracking',
    'Customers, suppliers & expenses',
    'Reports & insights',
    'Works on any device — phone, tablet, desktop'
]

const ABOUT_POINTS = [
    'Purpose-built for small shops and local businesses',
    'Create bills and invoices in seconds',
    'Track stock, purchases and expenses in real time',
    'Keep customers and suppliers organized',
    'Understand your business with clear reports'
]

const ABOUT_CARDS = [
    { icon: Store, label: 'For every kind of shop' },
    { icon: ShoppingCart, label: 'Billing & POS' },
    { icon: Package, label: 'Stock & purchases' },
    { icon: BarChart3, label: 'Reports & insights' }
]

export default function LandingPage() {
    const { dark, toggleDark } = useTheme()
    const [menuOpen, setMenuOpen] = useState(false)

    // Full page load into demo mode: main.jsx detects ?demo and mounts the
    // in-memory demo app. Nothing is saved — data lives until reload/exit.
    const startDemo = () => {
        window.location.href = '/?demo'
    }

    return (
        <div className="relative min-h-screen w-full bg-[#f7f4ee] text-[#1b3b2b] dark:bg-[#0a120c] dark:text-[#e8f0e9] overflow-hidden scroll-smooth">
            {/* Soft ambient background blobs */}
            <div aria-hidden className="pointer-events-none absolute -top-40 -right-24 w-[520px] h-[520px] rounded-full bg-[#1b3b2b]/5 dark:bg-[#2c5c42]/10 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute top-1/2 -left-44 w-[440px] h-[440px] rounded-full bg-[#2c7a4b]/5 dark:bg-[#2c5c42]/10 blur-3xl" />

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* NAV */}
                <nav className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-10 py-4 sm:py-6 flex items-center justify-between gap-2">
                    <Link to="/" className="flex items-center shrink-0">
                        <Logo className="h-9 sm:h-10 md:h-11" />
                    </Link>

                    <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#4c6654] dark:text-[#a9bfae]">
                        <a href="#features" className="hover:text-[#1b3b2b] dark:hover:text-white transition">Features</a>
                        <a href="#pricing" className="hover:text-[#1b3b2b] dark:hover:text-white transition">Pricing</a>
                        <a href="#about" className="hover:text-[#1b3b2b] dark:hover:text-white transition">About</a>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={startDemo}
                            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium text-[#2c7a4b] dark:text-[#7ec99a] border border-[#2c7a4b]/30 dark:border-[#7ec99a]/30 hover:bg-[#dce8dc] dark:hover:bg-[#16281d] transition"
                        >
                            <PlayCircle size={15} />
                            Try Demo
                        </button>

                        <button
                            onClick={toggleDark}
                            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                            className="w-9 h-9 rounded-full flex items-center justify-center border border-[#1b3b2b]/15 bg-white/70 dark:bg-[#16281d] dark:border-white/10 text-[#1b3b2b] dark:text-[#e8f0e9] hover:bg-[#ece6d8] dark:hover:bg-[#1e3a2a] transition"
                        >
                            {dark ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        <Link
                            to="/login"
                            className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-sm font-medium bg-[#e5e0d5] dark:bg-[#16281d] border border-[#1b3b2b]/20 dark:border-white/15 text-[#1b3b2b] dark:text-[#e8f0e9] hover:bg-[#ddd6c4] dark:hover:bg-[#1e3a2a] transition"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/register"
                            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-[#1b3b2b] dark:bg-[#2c5c42] text-white hover:bg-[#2c5c42] dark:hover:bg-[#3a7052] transition"
                        >
                            Get Started
                            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                <ArrowRight size={11} />
                            </span>
                        </Link>

                        {/* Hamburger — phones only */}
                        <button
                            onClick={() => setMenuOpen(true)}
                            className="sm:hidden w-9 h-9 rounded-full flex items-center justify-center border border-[#1b3b2b]/15 bg-white/70 text-[#1b3b2b] hover:bg-[#ece6d8] transition"
                            aria-label="Open menu"
                        >
                            <Menu size={18} />
                        </button>
                    </div>
                </nav>

                {/* MOBILE MENU — phones only */}
                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="sm:hidden fixed inset-0 z-50 bg-[#f7f4ee] dark:bg-[#0a120c] flex flex-col"
                        >
                            <div className="flex items-center justify-between px-4 py-4">
                                <Logo className="h-9" />
                                <button
                                    onClick={() => setMenuOpen(false)}
                                    className="w-9 h-9 rounded-full flex items-center justify-center border border-[#1b3b2b]/15 bg-white/70 text-[#1b3b2b] hover:bg-[#ece6d8] transition"
                                    aria-label="Close menu"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex-1 flex flex-col justify-center px-8 gap-2">
                                {[['#features', 'Features'], ['#pricing', 'Pricing'], ['#about', 'About']].map(([href, label]) => (
                                    <a
                                        key={href}
                                        href={href}
                                        onClick={() => setMenuOpen(false)}
                                        className="py-3 font-serif text-3xl font-semibold text-[#1b3b2b] dark:text-[#e8f0e9] border-b border-[#1b3b2b]/10 dark:border-white/10"
                                    >
                                        {label}
                                    </a>
                                ))}
                            </div>
                            <div className="px-8 pb-10 flex flex-col gap-3">
                                <button
                                    onClick={() => { setMenuOpen(false); startDemo() }}
                                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full border-2 border-[#2c7a4b]/40 bg-white/60 text-[#1b3b2b] font-medium"
                                >
                                    <PlayCircle size={18} className="text-[#2c7a4b]" /> Try the Demo
                                </button>
                                <Link
                                    to="/login"
                                    onClick={() => setMenuOpen(false)}
                                    className="w-full inline-flex justify-center py-3.5 rounded-full bg-[#e5e0d5] border border-[#1b3b2b]/20 text-[#1b3b2b] font-medium"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setMenuOpen(false)}
                                    className="w-full inline-flex justify-center py-3.5 rounded-full bg-[#1b3b2b] text-white font-medium"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* HERO */}
                <main className="mx-auto w-full max-w-7xl px-6 md:px-10 flex-1 flex flex-col justify-center py-14 lg:py-20">
                    <div className="grid lg:grid-cols-[1.05fr_1fr] gap-16 lg:gap-20 items-center">
                        {/* LEFT CONTENT */}
                        <div>
                            <motion.span
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide text-[#1b3b2b] dark:text-[#e8f0e9] bg-[#dce8dc] dark:bg-[#16281d] border border-[#1b3b2b]/10 dark:border-white/10"
                            >
                                <Sparkles size={13} />
                                All-in-one business management
                            </motion.span>

                            <motion.h1
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="mt-6 font-serif font-semibold text-5xl md:text-6xl xl:text-7xl leading-[1.05] tracking-tight"
                            >
                                Every sale.
                                <br />
                                Every stock.
                                <br />
                                <em className="font-script font-normal italic text-[#2c7a4b] dark:text-[#7ec99a]">
                                    Every insight.
                                </em>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="mt-6 text-lg md:text-xl text-[#4c6654] dark:text-[#a9bfae] max-w-xl leading-relaxed"
                            >
                                Saadanam helps you run your business smoothly — from billing
                                and stock to reports and everything in between.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                            >
                                <Link
                                    to="/register"
                                    className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#1b3b2b] dark:bg-[#2c5c42] text-white font-medium hover:bg-[#2c5c42] dark:hover:bg-[#3a7052] transition"
                                >
                                    Get Started Free
                                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition" />
                                </Link>

                                <button
                                    onClick={startDemo}
                                    className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-[#2c7a4b]/40 dark:border-[#7ec99a]/40 bg-white/60 dark:bg-[#16281d] text-[#1b3b2b] dark:text-[#e8f0e9] font-medium hover:border-[#2c7a4b] dark:hover:border-[#7ec99a] hover:bg-white dark:hover:bg-[#1e3a2a] transition"
                                >
                                    <PlayCircle size={19} className="text-[#2c7a4b] dark:text-[#7ec99a] group-hover:scale-110 transition" />
                                    Try the Saadanam Demo
                                </button>
                            </motion.div>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.45 }}
                                className="mt-8 flex items-center gap-2 text-sm text-[#64796a] dark:text-[#a9bfae]"
                            >
                                <CheckCircle2 size={16} className="text-[#2c7a4b] dark:text-[#7ec99a]" />
                                Free demo — no sign-up, nothing saved. Your data is safe with us. Always.
                            </motion.p>
                        </div>

                        {/* RIGHT VISUAL — tabletop product shot */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.25 }}
                            className="relative mx-auto w-full max-w-[520px] py-8"
                        >
                            {/* curved dark green backdrop panel */}
                            <div aria-hidden className="absolute -top-4 right-2 w-52 h-52 rounded-full bg-[#1b3b2b] dark:bg-[#2c5c42] rotate-12" />

                            {/* wooden stand */}
                            <div aria-hidden className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[88%] h-8 rounded-b-2xl rounded-t-lg bg-[#c8a06a] dark:bg-[#8a5a2b] shadow-xl" />

                            {/* tablet with dashboard mockup */}
                            <div className="relative rounded-[1.8rem] bg-white dark:bg-[#101d15] border border-[#e0d9c8] dark:border-[#24402f] shadow-2xl shadow-[#1b3b2b]/20 p-4">
                                <div className="rounded-2xl overflow-hidden bg-[#f7f4ee] dark:bg-[#0a120c] border border-[#eae4d6] dark:border-[#1e3a2a]">
                                    {/* window bar */}
                                    <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#eae4d6] dark:border-[#1e3a2a]">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#e5a1a1]" />
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#e8cf9a]" />
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#a8cfa6]" />
                                        <span className="ml-2 text-[10px] font-medium text-[#8b9a8e]">Saadanam · Dashboard</span>
                                    </div>

                                    <div className="flex">
                                        {/* mini sidebar */}
                                        <div className="w-14 bg-[#1b3b2b] dark:bg-[#16281d] p-2 space-y-2">
                                            <div className="h-5 rounded bg-[#2c5c42]" />
                                            <div className="h-2 rounded bg-white/25" />
                                            <div className="h-2 rounded bg-white/25" />
                                            <div className="h-2 rounded bg-white/25" />
                                            <div className="h-2 rounded bg-white/25" />
                                        </div>

                                        {/* content */}
                                        <div className="flex-1 p-3 space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="rounded-lg bg-white dark:bg-[#101d15] border border-[#eae4d6] dark:border-[#1e3a2a] p-2">
                                                    <div className="h-1.5 w-8 rounded bg-[#cbd5c0] dark:bg-[#24402f]" />
                                                    <div className="mt-1.5 h-2.5 w-11 rounded bg-[#1b3b2b] dark:bg-[#e8f0e9]" />
                                                </div>
                                                <div className="rounded-lg bg-white dark:bg-[#101d15] border border-[#eae4d6] dark:border-[#1e3a2a] p-2">
                                                    <div className="h-1.5 w-8 rounded bg-[#cbd5c0] dark:bg-[#24402f]" />
                                                    <div className="mt-1.5 h-2.5 w-11 rounded bg-[#2c7a4b] dark:bg-[#7ec99a]" />
                                                </div>
                                            </div>

                                            <div className="rounded-lg bg-white dark:bg-[#101d15] border border-[#eae4d6] dark:border-[#1e3a2a] p-3">
                                                <div className="flex items-end gap-1.5 h-14">
                                                    {[40, 65, 50, 80, 60, 95, 75].map((h, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex-1 rounded-t bg-[#2c5c42] dark:bg-[#3a7052]"
                                                            style={{ height: `${h}%` }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                {[92, 74, 58].map((w) => (
                                                    <div key={w} className="flex items-center gap-2">
                                                        <div className="h-2 rounded bg-[#e0d9c8] dark:bg-[#1e3a2a]" style={{ width: `${w}%` }} />
                                                        <div className="h-2 w-8 rounded-full bg-[#2c7a4b] dark:bg-[#7ec99a] ml-auto" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* potted plant */}
                            <div className="absolute -left-3 md:-left-10 bottom-6 rotate-[-8deg]">
                                <div className="w-16 h-16 rounded-full bg-[#2c7a4b]/20 dark:bg-[#2c5c42]/30 flex items-center justify-center">
                                    <Sprout size={34} className="text-[#2c7a4b] dark:text-[#7ec99a]" />
                                </div>
                                <div className="mx-auto -mt-1 w-11 h-9 rounded-b-xl bg-[#b87333] dark:bg-[#8a5a2b] border border-[#a05f28] dark:border-[#6e4520]" />
                            </div>

                            {/* wooden block with S */}
                            <div className="absolute -left-2 md:-left-6 top-12 rotate-[-6deg] w-12 h-12 rounded-xl bg-[#e5d8bd] dark:bg-[#3a2e1d] border border-[#d3c4a2] dark:border-[#55442a] flex items-center justify-center font-serif italic text-xl text-[#1b3b2b] dark:text-[#e8f0e9] shadow-lg">
                                S
                            </div>

                            {/* spiral notebook with pen */}
                            <div className="absolute -right-3 md:-right-8 bottom-0 rotate-6">
                                <div className="w-24 h-16 rounded-lg bg-[#1b3b2b] dark:bg-[#16281d] relative shadow-xl">
                                    <div className="absolute inset-x-2 top-1.5 h-1 rounded bg-white/25" />
                                    <div className="absolute inset-x-2 top-3.5 space-y-1">
                                        <div className="h-0.5 w-3/4 rounded bg-white/20" />
                                        <div className="h-0.5 w-1/2 rounded bg-white/20" />
                                    </div>
                                    <div className="absolute -top-1 right-1 w-14 h-1.5 rounded-full bg-[#cfd4d8] dark:bg-[#9aa5ab] rotate-[-20deg]" />
                                </div>
                            </div>

                            {/* decorative vases */}
                            <div className="absolute -right-4 md:-right-6 top-4 flex items-end gap-1.5">
                                <div className="w-6 h-10 rounded-t-full rounded-b-sm bg-[#2c5c42] dark:bg-[#2c5c42] opacity-80" />
                                <div className="w-4 h-7 rounded-t-full rounded-b-sm bg-[#2c7a4b] dark:bg-[#7ec99a] opacity-70" />
                            </div>
                        </motion.div>
                    </div>

                    {/* FEATURE BANNER */}
                    <motion.section
                        id="features"
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.6 }}
                        className="mt-20 lg:mt-24 rounded-3xl bg-[#1b3b2b] dark:bg-[#101d15] border border-[#1b3b2b] dark:border-[#24402f] px-8 py-12 md:px-14 md:py-16 shadow-xl shadow-[#1b3b2b]/10"
                    >
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
                            {FEATURES.map(({ icon: Icon, title, description }) => (
                                <div key={title}>
                                    <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-4">
                                        <Icon size={22} className="text-white" />
                                    </div>
                                    <h3 className="font-semibold text-white text-lg">{title}</h3>
                                    <p className="mt-1.5 text-sm leading-relaxed text-[#bcd0c2] dark:text-[#a9bfae]">
                                        {description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.section>

                    {/* PRICING — currently free of cost */}
                    <motion.section
                        id="pricing"
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.6 }}
                        className="mt-24 lg:mt-28"
                    >
                        <div className="text-center max-w-2xl mx-auto">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide text-[#1b3b2b] dark:text-[#e8f0e9] bg-[#dce8dc] dark:bg-[#16281d] border border-[#1b3b2b]/10 dark:border-white/10">
                                <Sparkles size={13} />
                                Pricing
                            </span>
                            <h2 className="mt-5 font-serif font-semibold text-4xl md:text-5xl tracking-tight">
                                Currently free of cost
                            </h2>
                            <p className="mt-4 text-lg text-[#4c6654] dark:text-[#a9bfae] leading-relaxed">
                                Saadanam is free to use right now — no plans, no hidden charges.
                                Create your shop and start billing in minutes.
                            </p>
                        </div>

                        <div className="mt-12 mx-auto max-w-lg rounded-3xl bg-white dark:bg-[#101d15] border border-[#e0d9c8] dark:border-[#24402f] p-8 md:p-10 shadow-xl shadow-[#1b3b2b]/5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-[#8b9a8e]">Current plan</p>
                                    <div className="mt-1 flex items-baseline gap-2">
                                        <span className="font-serif text-5xl font-semibold">₹0</span>
                                        <span className="text-sm text-[#64796a] dark:text-[#a9bfae]">/ forever</span>
                                    </div>
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#dce8dc] text-[#1b3b2b] dark:bg-[#16281d] dark:text-[#e8f0e9]">Free</span>
                            </div>

                            <ul className="mt-7 space-y-3">
                                {PRICING_PERKS.map((perk) => (
                                    <li key={perk} className="flex items-center gap-3 text-sm text-[#33503c] dark:text-[#cddcd0]">
                                        <CheckCircle2 size={16} className="text-[#2c7a4b] dark:text-[#7ec99a] shrink-0" />
                                        {perk}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
                                <Link
                                    to="/register"
                                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-[#1b3b2b] dark:bg-[#2c5c42] text-white font-medium hover:bg-[#2c5c42] dark:hover:bg-[#3a7052] transition"
                                >
                                    Get Started Free
                                    <ArrowRight size={16} />
                                </Link>
                                <button
                                    onClick={startDemo}
                                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full border border-[#1b3b2b]/20 dark:border-white/15 text-[#1b3b2b] dark:text-[#e8f0e9] font-medium hover:bg-[#f2ede1] dark:hover:bg-[#1e3a2a] transition"
                                >
                                    <PlayCircle size={17} className="text-[#2c7a4b] dark:text-[#7ec99a]" />
                                    Try the Demo First
                                </button>
                            </div>
                            <p className="mt-4 text-center text-xs text-[#8b9a8e]">
                                No credit card required. Early shops stay free when paid plans arrive.
                            </p>
                        </div>
                    </motion.section>

                    {/* ABOUT */}
                    <motion.section
                        id="about"
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.6 }}
                        className="mt-24 lg:mt-28 grid lg:grid-cols-2 gap-14 lg:gap-20 items-center"
                    >
                        <div>
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide text-[#1b3b2b] dark:text-[#e8f0e9] bg-[#dce8dc] dark:bg-[#16281d] border border-[#1b3b2b]/10 dark:border-white/10">
                                <Sparkles size={13} />
                                About Saadanam
                            </span>
                            <h2 className="mt-5 font-serif font-semibold text-4xl md:text-5xl tracking-tight leading-tight">
                                The one stop to run your shop, the simple way.
                            </h2>
                            <p className="mt-5 text-lg text-[#4c6654] dark:text-[#a9bfae] leading-relaxed">
                                Saadanam is a simple business management platform built for everyday
                                shops. Whether you run a kirana store, supermarket, hardware shop,
                                medical store or any local business, Saadanam brings your entire
                                business into one place — so you spend less time on paperwork and
                                more time serving your customers.
                            </p>
                            <p className="mt-4 text-lg text-[#4c6654] dark:text-[#a9bfae] leading-relaxed">
                                From creating a bill in seconds to knowing exactly what's in your
                                stock, Saadanam gives every shop owner one simple dashboard to manage
                                billing, stock, purchases, customers, expenses and reports.
                            </p>
                            <ul className="mt-6 space-y-3">
                                {ABOUT_POINTS.map((point) => (
                                    <li key={point} className="flex items-center gap-3 text-sm text-[#33503c] dark:text-[#cddcd0]">
                                        <CheckCircle2 size={16} className="text-[#2c7a4b] dark:text-[#7ec99a] shrink-0" />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-3xl bg-[#1b3b2b] dark:bg-[#101d15] border border-[#1b3b2b] dark:border-[#24402f] p-8 md:p-10 shadow-xl shadow-[#1b3b2b]/10">
                            <p className="font-serif text-2xl text-white leading-snug">
                                "Everything a shop needs — billing, stock, customers and reports —
                                in one simple place."
                            </p>
                            <div className="mt-8 grid sm:grid-cols-2 gap-5">
                                {ABOUT_CARDS.map(({ icon: Icon, label }) => (
                                    <div key={label} className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                                            <Icon size={18} className="text-white" />
                                        </div>
                                        <span className="text-sm font-medium text-[#e8f0e9]">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.section>
                </main>
            </div>
        </div>
    )
}
