import { LogOut, LogIn, Moon, Sun, User, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import NotificationBell from './NotificationBell.jsx'
import { useDemo } from '../../demo/DemoContext.jsx'

export default function Topbar({ title, onOpenMobileMenu }) {
    const { user, logoutUser } = useAuth()
    const { dark, toggleDark } = useTheme()
    const demo = useDemo()
    const isDemo = user?.demo

    return (
        <div className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 px-4 sm:px-8 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
                {/* Hamburger — phones only */}
                {onOpenMobileMenu && (
                    <button
                        onClick={onOpenMobileMenu}
                        className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
                        aria-label="Open menu"
                    >
                        <Menu size={20} />
                    </button>
                )}
                <h1 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">{title}</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <button
                    onClick={toggleDark}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {dark ? <Sun size={17} /> : <Moon size={17} />}
                </button>
                <NotificationBell />

                {isDemo && (
                    <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Demo Mode — nothing is saved
                    </span>
                )}

                <div className="hidden sm:flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <User size={15} className="text-slate-500" />
                    </div>
                    <div className="text-sm">
                        <p className="font-medium text-slate-700 leading-tight">{user?.full_name}</p>
                        <p className="text-xs text-slate-400 leading-tight capitalize">
                            {user?.role?.replace('_', ' ')}
                        </p>
                    </div>
                </div>
                {isDemo ? (
                    <button
                        onClick={demo.exitDemo}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-light transition"
                    >
                        <LogIn size={15} /> <span className="hidden sm:inline">Exit Demo</span>
                    </button>
                ) : (
                    <button
                        onClick={logoutUser}
                        className="flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition"
                        title="Log out"
                    >
                        <LogOut size={15} /> <span className="hidden sm:inline">Logout</span>
                    </button>
                )}
            </div>
        </div>
    )
}