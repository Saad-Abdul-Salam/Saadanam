import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Search, Check } from 'lucide-react'
import * as productApi from '../../api/productApi.js'

export default function QuickPriceUpdateModal({ open, onClose }) {
    const [products, setProducts] = useState([])
    const [search, setSearch] = useState('')
    const [highlightIndex, setHighlightIndex] = useState(0)
    const [selected, setSelected] = useState(null)
    const [priceInput, setPriceInput] = useState('')
    const [savedFlash, setSavedFlash] = useState(false)

    const searchRef = useRef(null)
    const priceRef = useRef(null)

    const filtered = search.trim()
        ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
        : products

    useEffect(() => {
        if (open) {
            setSearch('')
            setSelected(null)
            setSavedFlash(false)
            productApi.getProducts().then((res) => setProducts(res.data.results ?? res.data)).catch(() => { })
            setTimeout(() => searchRef.current?.focus(), 50)
        }
    }, [open])

    useEffect(() => {
        if (selected && priceRef.current) {
            priceRef.current.focus()
            priceRef.current.select()
        }
    }, [selected])

    const pickProduct = (product) => {
        setSelected(product)
        setPriceInput(String(product.price))
    }

    const handleSearchKeyDown = (e) => {
        if (selected) return
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlightIndex((i) => Math.max(i - 1, 0))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            const product = filtered[highlightIndex]
            if (product) pickProduct(product)
        } else if (e.key === 'Escape') {
            onClose()
        }
    }

    const savePrice = async () => {
        const newPrice = parseFloat(priceInput)
        if (isNaN(newPrice) || newPrice < 0) return
        try {
            await productApi.quickUpdatePrice(selected.id, newPrice)
            setProducts((prev) => prev.map((p) => (p.id === selected.id ? { ...p, price: newPrice } : p)))
            setSavedFlash(true)
            setTimeout(() => {
                setSelected(null)
                setSearch('')
                searchRef.current?.focus()
            }, 500)
        } catch {
            // silently ignore for now, or add error state if you want it shown
        }
    }

    const handlePriceKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            savePrice()
        } else if (e.key === 'Escape') {
            setSelected(null)
            searchRef.current?.focus()
        }
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-slate-900/40 flex items-start justify-center pt-28"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <h3 className="font-semibold text-slate-800">Quick Price Update</h3>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5">
                            {!selected ? (
                                <>
                                    <div className="relative mb-2">
                                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            ref={searchRef}
                                            placeholder="Search product... (↓ to browse, Enter to select)"
                                            value={search}
                                            onChange={(e) => { setSearch(e.target.value); setHighlightIndex(0) }}
                                            onKeyDown={handleSearchKeyDown}
                                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                        />
                                    </div>

                                    <div className="max-h-64 overflow-y-auto -mx-1">
                                        {filtered.map((p, idx) => (
                                            <button
                                                key={p.id}
                                                onMouseEnter={() => setHighlightIndex(idx)}
                                                onClick={() => pickProduct(p)}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition ${idx === highlightIndex ? 'bg-brand text-white' : 'hover:bg-slate-50 text-slate-700'
                                                    }`}
                                            >
                                                <span className="font-medium">{p.name}</span>
                                                <span className={idx === highlightIndex ? 'text-white/80' : 'text-slate-400'}>
                                                    ₹{Number(p.price).toFixed(2)}
                                                </span>
                                            </button>
                                        ))}
                                        {filtered.length === 0 && (
                                            <p className="text-sm text-slate-400 text-center py-6">No products match.</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Updating price for</p>
                                    <p className="font-semibold text-slate-800 mb-4">{selected.name}</p>

                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 text-sm">₹</span>
                                        <input
                                            ref={priceRef}
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={priceInput}
                                            onChange={(e) => setPriceInput(e.target.value)}
                                            onKeyDown={handlePriceKeyDown}
                                            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-brand"
                                        />
                                        <button
                                            onClick={savePrice}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition"
                                        >
                                            <Check size={15} /> Save
                                        </button>
                                    </div>

                                    {savedFlash && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-sm text-green-600 mt-3 font-medium"
                                        >
                                            ✓ Price updated
                                        </motion.p>
                                    )}

                                    <button
                                        onClick={() => { setSelected(null); searchRef.current?.focus() }}
                                        className="text-xs text-slate-400 hover:text-slate-600 mt-3"
                                    >
                                        ← Pick a different product
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}