import { motion, AnimatePresence } from 'motion/react'
import { X, Printer } from 'lucide-react'
import InvoiceDocument from './InvoiceDocument.jsx'

export default function InvoiceModal({ sale, shop, onClose }) {
    return (
        <AnimatePresence>
            {sale && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-slate-900/40 flex items-start justify-center overflow-y-auto py-10 px-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden print-area"
                    >
                        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 print-hide">
                            <h3 className="font-semibold text-slate-800">Invoice {sale.invoice_no}</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-medium hover:bg-indigo-700 transition">
                                    <Printer size={13} /> Print
                                </button>
                                <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                            </div>
                        </div>
                        <InvoiceDocument sale={sale} shop={shop} />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}