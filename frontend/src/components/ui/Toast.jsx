import { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

// Global toast notifications — success + error messages that auto-dismiss.
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])
    const idRef = useRef(0)

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const push = useCallback((type, message) => {
        const id = ++idRef.current
        setToasts((prev) => [...prev.slice(-3), { id, type, message }])
        setTimeout(() => dismiss(id), 4000)
    }, [dismiss])

    // Stable identity so consumers' useCallback/useEffect deps don't churn
    const toast = useMemo(() => ({
        success: (msg) => push('success', msg),
        error: (msg) => push('error', msg),
        info: (msg) => push('info', msg),
    }), [push])

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {/* Toast stack — fixed so it never affects page layout or scroll */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-2 items-center w-full max-w-sm px-4 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: -16, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -16, scale: 0.96 }}
                            className={`pointer-events-auto w-full flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm ${t.type === 'success'
                                ? 'bg-white text-green-700 border-green-200'
                                : t.type === 'error'
                                    ? 'bg-white text-red-600 border-red-200'
                                    : 'bg-white text-slate-700 border-slate-200'
                                }`}
                        >
                            {t.type === 'success' && <CheckCircle2 size={17} className="text-green-500 shrink-0 mt-0.5" />}
                            {t.type === 'error' && <AlertCircle size={17} className="text-red-500 shrink-0 mt-0.5" />}
                            {t.type === 'info' && <Info size={17} className="text-brand shrink-0 mt-0.5" />}
                            <span className="flex-1 leading-snug">{t.message}</span>
                            <button onClick={() => dismiss(t.id)} className="text-slate-300 hover:text-slate-500 shrink-0" aria-label="Dismiss">
                                <X size={15} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)
    // Fail-safe: if a page forgets the provider (e.g. demo mode), no-op instead of crashing
    if (!ctx) return { success: () => { }, error: () => { }, info: () => { } }
    return ctx
}
