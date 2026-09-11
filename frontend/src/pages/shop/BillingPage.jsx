import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Plus, Minus, Trash2, ShoppingCart, Banknote, Smartphone, CreditCard, CornerDownLeft, UserPlus, Printer, X, PlusCircle, Clock } from 'lucide-react'
import AppLayout from '../../components/ui/AppLayout.jsx'
import InvoiceDocument from '../../components/invoice/InvoiceDocument.jsx'
import * as productApi from '../../api/productApi.js'
import * as customerApi from '../../api/customerApi.js'
import * as billingApi from '../../api/billingApi.js'
import * as shopApi from '../../api/shopApi.js'
import { useToast } from '../../components/ui/Toast.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx'

const WALKIN_NAME = 'Walk-in Customer'

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'upi', label: 'UPI', icon: Smartphone },
    { value: 'card', label: 'Card', icon: CreditCard },
]

// ---------- localStorage-persisted billing tabs ----------
// Each tab is an independent "holding bill": one customer can wait while you
// ring up the next person. Tabs survive page refreshes so no input is lost.
const TABS_KEY = 'saadanam_billing_tabs_v1'
const MAX_TABS = 6

const emptyTabState = () => ({
    cart: [],
    customerId: '',
    discount: 0,
    paymentMethod: '',
    receivedAmount: '',
})

const newTab = (customerId) => ({ id: crypto.randomUUID(), name: 'New Bill', ...emptyTabState(), customerId })

function loadPersistedTabs(fallbackCustomerId) {
    try {
        const raw = localStorage.getItem(TABS_KEY)
        if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Backfill missing fields so data saved by older versions still works
                return parsed.map((t) => ({ ...newTab(fallbackCustomerId), ...emptyTabState(), ...t }))
            }
        }
    } catch { /* corrupted storage — fall through to a fresh tab */ }
    return [newTab(fallbackCustomerId)]
}

export default function BillingPage() {
    const toast = useToast()
    usePageTitle('Sales & POS')

    const [products, setProducts] = useState([])
    const [customers, setCustomers] = useState([])
    const [walkInId, setWalkInId] = useState(null)
    const [shop, setShop] = useState(null)
    const [shopTax, setShopTax] = useState({ mode: 'inclusive', rate: 0, label: 'GST' })
    const [loadingData, setLoadingData] = useState(true)

    const [tabs, setTabs] = useState(null) // null until persisted tabs are loaded
    const [activeTabId, setActiveTabId] = useState(null)

    const [search, setSearch] = useState('')
    const [highlightIndex, setHighlightIndex] = useState(0)
    const [pendingProduct, setPendingProduct] = useState(null)
    const [qtyInput, setQtyInput] = useState('1')

    const [invoiceResult, setInvoiceResult] = useState(null) // { sale, tabId }
    const [finalizing, setFinalizing] = useState(false)
    const [qtyError, setQtyError] = useState('')

    const [showAddCustomerPrompt, setShowAddCustomerPrompt] = useState(false)
    const [showAddCustomerForm, setShowAddCustomerForm] = useState(false)
    const [pendingInvoice, setPendingInvoice] = useState(null) // holds the completed sale while we ask about tracking
    const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', address: '' })
    const [addingCustomer, setAddingCustomer] = useState(false)

    const searchInputRef = useRef(null)
    const qtyInputRef = useRef(null)

    // ---------- data loading ----------
    const loadInitialData = useCallback(async () => {
        setLoadingData(true)
        try {
            const [prodRes, custRes, shopRes, walkinRes] = await Promise.all([
                productApi.getProducts(), customerApi.getCustomers(), shopApi.getMyShop(), customerApi.getWalkinCustomer()
            ])
            setProducts(prodRes.data.results ?? prodRes.data)
            setCustomers(custRes.data.results ?? custRes.data)
            setWalkInId(walkinRes.data.id)
            setShop(shopRes.data)
            setShopTax({
                mode: shopRes.data.tax_mode,
                rate: Number(shopRes.data.tax_rate),
                label: shopRes.data.tax_label,
            })
            return walkinRes.data.id
        } catch {
            toast.error('Could not load billing data. Please refresh the page.')
            return null
        } finally {
            setLoadingData(false)
        }
    }, [toast])

    // One-time boot: load API data AND any persisted held bills together
    useEffect(() => {
        let cancelled = false
        loadInitialData().then((walkin) => {
            if (cancelled) return
            const persisted = loadPersistedTabs(walkin ?? '')
            setTabs(persisted)
            setActiveTabId(persisted[0].id)
        })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Persist held bills on every change so a refresh never loses them
    useEffect(() => {
        if (!tabs) return
        try {
            localStorage.setItem(TABS_KEY, JSON.stringify(tabs))
        } catch { /* storage unavailable — bills just won't persist */ }
    }, [tabs])

    const activeTab = tabs?.find((t) => t.id === activeTabId) ?? null

    const updateActiveTab = useCallback((patch) => {
        setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, ...patch } : t)))
    }, [activeTabId])

    // Current tab's billing fields
    const cart = activeTab?.cart ?? []
    const customerId = activeTab?.customerId ?? ''
    const discount = activeTab?.discount ?? 0
    const paymentMethod = activeTab?.paymentMethod ?? ''
    const receivedAmount = activeTab?.receivedAmount ?? ''

    // ---------- held-bill tab management ----------
    const addTab = () => {
        if (!tabs) return
        if (tabs.length >= MAX_TABS) {
            toast.error(`You can hold up to ${MAX_TABS} bills at a time.`)
            return
        }
        const tab = newTab(walkInId ? String(walkInId) : '')
        setTabs((prev) => [...prev, tab])
        setActiveTabId(tab.id)
        setPendingProduct(null)
        setSearch('')
        toast.success('New bill started — your other bill is saved below.')
    }

    const closeTab = (tabId) => {
        if (!tabs) return
        const hadItems = tabs.find((t) => t.id === tabId)?.cart.length > 0
        const remaining = tabs.filter((t) => t.id !== tabId)
        if (remaining.length === 0) {
            // always keep one empty bill alive
            const fresh = newTab(walkInId ? String(walkInId) : '')
            setTabs([fresh])
            setActiveTabId(fresh.id)
        } else {
            setTabs(remaining)
            if (activeTabId === tabId) setActiveTabId(remaining[remaining.length - 1].id)
        }
        if (hadItems) toast.info('Held bill discarded.')
    }

    const clearActiveTab = () => {
        if (!activeTab) return
        updateActiveTab(emptyTabState())
        setPendingProduct(null)
        setSearch('')
        setQtyError('')
        toast.success('Bill cleared.')
    }

    // Auto-label tabs so they read like "Rice 5kg" / "Rice 5kg +2 more"
    useEffect(() => {
        if (!activeTab) return
        const label = activeTab.cart.length === 0
            ? 'New Bill'
            : activeTab.cart.length === 1
                ? activeTab.cart[0].name
                : `${activeTab.cart[0].name} +${activeTab.cart.length - 1} more`
        if (activeTab.name !== label) {
            setTabs((prev) => prev.map((t) => (t.id === activeTab.id ? { ...t, name: label } : t)))
        }
    }, [activeTab])

    const filteredProducts = search.trim()
        ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
        : []

    const dropdownOpen = filteredProducts.length > 0 && !pendingProduct

    useEffect(() => {
        if (pendingProduct && qtyInputRef.current) {
            qtyInputRef.current.focus()
            qtyInputRef.current.select()
        }
    }, [pendingProduct])

    const selectProduct = (product) => {
        if (product.stock <= 0) return
        setPendingProduct(product)
        setQtyInput('1')
        setSearch('')
        setHighlightIndex(0)
        setQtyError('')
    }
    const handleSearchKeyDown = (e) => {
        if (!dropdownOpen) return
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlightIndex((i) => Math.min(i + 1, filteredProducts.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlightIndex((i) => Math.max(i - 1, 0))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            const product = filteredProducts[highlightIndex]
            if (product) selectProduct(product)
        } else if (e.key === 'Escape') {
            setSearch('')
        }
    }

    const confirmAddToCart = () => {
        const qty = parseFloat(qtyInput)
        if (!pendingProduct || isNaN(qty) || qty <= 0) return

        const alreadyInCart = cart.find((item) => item.id === pendingProduct.id)?.qty || 0
        const totalRequested = alreadyInCart + qty

        if (totalRequested > pendingProduct.stock) {
            setQtyError(`Only ${pendingProduct.stock} in stock${alreadyInCart > 0 ? ` (${alreadyInCart} already in cart)` : ''}.`)
            return
        }

        setQtyError('')
        updateActiveTab({
            cart: (() => {
                const existing = cart.find((item) => item.id === pendingProduct.id)
                if (existing) {
                    return cart.map((item) =>
                        item.id === pendingProduct.id ? { ...item, qty: item.qty + qty } : item
                    )
                }
                return [...cart, { ...pendingProduct, qty }]
            })(),
        })

        setPendingProduct(null)
        setQtyInput('1')
        searchInputRef.current?.focus()
    }

    const handleQtyKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            confirmAddToCart()
        } else if (e.key === 'Escape') {
            setPendingProduct(null)
            searchInputRef.current?.focus()
        }
    }

    const updateQty = (id, delta) => {
        updateActiveTab({
            cart: cart
                .map((item) => (item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item))
                .filter((item) => item.qty > 0),
        })
    }

    const removeFromCart = (id) => updateActiveTab({ cart: cart.filter((item) => item.id !== id) })

    const totals = useMemo(() => {
        const rawTotal = cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0)
        const afterDiscount = Math.max(0, rawTotal - Number(discount || 0))

        let subtotal, taxAmount, grandTotal
        if (shopTax.mode === 'inclusive') {
            grandTotal = afterDiscount
            subtotal = grandTotal / (1 + shopTax.rate / 100)
            taxAmount = grandTotal - subtotal
        } else {
            subtotal = afterDiscount
            taxAmount = subtotal * (shopTax.rate / 100)
            grandTotal = subtotal + taxAmount
        }

        return { rawTotal, subtotal, taxAmount, grandTotal }
    }, [cart, discount, shopTax])

    const selectPaymentMethod = (method) => {
        updateActiveTab({ paymentMethod: method, receivedAmount: totals.grandTotal.toFixed(2) })
    }

    const handleFinalizeSale = async () => {
        if (cart.length === 0 || !customerId || !paymentMethod || !activeTab) return
        setFinalizing(true)
        try {
            const res = await billingApi.finalizeSale({
                customer: Number(customerId),
                items: cart.map((item) => ({ product: item.id, qty: item.qty })),
                discount,
                payment_method: paymentMethod,
                received_amount: receivedAmount || 0,
            })

            const sale = res.data
            const balance = Number(sale.balance) // positive = customer owes us, negative = change due
            const soldFromTabId = activeTab.id

            if (balance > 0) {
                if (Number(customerId) === walkInId) {
                    // random buyer underpaid — ask if we should start tracking them
                    setPendingInvoice({ sale, tabId: soldFromTabId })
                    setNewCustomerForm({ name: '', phone: '', address: '' })
                    setShowAddCustomerPrompt(true)
                } else {
                    // already a tracked customer — add the shortfall to their running balance automatically
                    try {
                        await customerApi.adjustBalance(Number(customerId), 'charge', balance)
                    } catch {
                        // non-fatal, sale itself still succeeded
                    }
                    setInvoiceResult({ sale, tabId: soldFromTabId })
                }
            } else {
                setInvoiceResult({ sale, tabId: soldFromTabId })
            }
        } catch (err) {
            const data = err.response?.data
            const msg = data?.items
                ? (Array.isArray(data.items) ? data.items.join(' ') : data.items)
                : data?.error || 'Failed to complete sale.'
            toast.error(msg)
        } finally {
            setFinalizing(false)
        }
    }

    const declineAddCustomer = () => {
        setInvoiceResult(pendingInvoice)
        setPendingInvoice(null)
        setShowAddCustomerPrompt(false)
    }

    const acceptAddCustomer = () => {
        setShowAddCustomerPrompt(false)
        setShowAddCustomerForm(true)
    }

    const handleCreateTrackedCustomer = async (e) => {
        e.preventDefault()
        if (!newCustomerForm.name || !newCustomerForm.phone) return
        setAddingCustomer(true)
        try {
            const balance = Number(pendingInvoice.sale.balance)
            await customerApi.createCustomer({
                name: newCustomerForm.name,
                phone: newCustomerForm.phone,
                address: newCustomerForm.address,
                creditLimit: 0,
                outstanding: balance,
            })
            setInvoiceResult(pendingInvoice)
            setPendingInvoice(null)
            setShowAddCustomerForm(false)
            toast.success(`${newCustomerForm.name} was added to your customers.`)
        } catch {
            toast.error('Failed to add customer.')
        } finally {
            setAddingCustomer(false)
        }
    }

    // Called by "New Sale" on the invoice screen: clears the bill that produced
    // this invoice (other held bills stay) and returns to billing.
    const startNewSale = async () => {
        const soldTabId = invoiceResult?.tabId
        setInvoiceResult(null)
        await loadInitialData() // refresh products (stock) + customers (new one may have been added)
        if (!tabs) return
        const remaining = tabs.filter((t) => t.id !== soldTabId)
        if (remaining.length === 0) {
            const fresh = newTab(walkInId ? String(walkInId) : '')
            setTabs([fresh])
            setActiveTabId(fresh.id)
        } else {
            setTabs(remaining)
            setActiveTabId(remaining[remaining.length - 1].id)
        }
    }

    // ---------- INVOICE SUCCESS SCREEN ----------
    if (invoiceResult) {
        return (
            <AppLayout title="Sales & POS">
                <div className="max-w-2xl mx-auto mt-4">
                    <div className="flex justify-end gap-3 mb-4 print-hide">
                        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                            <Printer size={15} /> Print Invoice
                        </button>
                        <button onClick={startNewSale} className="px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition">
                            New Sale
                        </button>
                    </div>
                    <div className="print-area border border-slate-200 rounded-2xl overflow-hidden">
                        <InvoiceDocument sale={invoiceResult.sale} shop={shop} />
                    </div>
                </div>
            </AppLayout>
        )
    }

    // ---------- LOADING STATE ----------
    if (loadingData || !tabs || !activeTab) {
        return (
            <AppLayout title="Sales & POS">
                <LoadingSpinner label="Loading billing…" />
            </AppLayout>
        )
    }

    return (
        <AppLayout title="Sales & POS">
            {/* ADD-TO-CUSTOMER-LIST PROMPT */}
            <AnimatePresence>
                {showAddCustomerPrompt && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6 text-center"
                        >
                            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                                <UserPlus size={20} className="text-amber-500" />
                            </div>
                            <h3 className="font-semibold text-slate-800 mb-1">Customer didn't pay in full</h3>
                            <p className="text-sm text-slate-400 mb-6">
                                They still owe <span className="font-medium text-slate-600">₹{Number(pendingInvoice?.sale?.balance).toFixed(2)}</span>.
                                Add them to your customer list to keep track of it?
                            </p>
                            <div className="flex gap-3">
                                <button onClick={declineAddCustomer} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                                    No, skip
                                </button>
                                <button onClick={acceptAddCustomer} className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-indigo-700 transition">
                                    Yes, add them
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* QUICK ADD CUSTOMER FORM */}
            <AnimatePresence>
                {showAddCustomerForm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="px-5 py-4 border-b border-slate-100">
                                <h3 className="font-semibold text-slate-800">Add Customer</h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    They'll be recorded as owing ₹{Number(pendingInvoice?.sale?.balance).toFixed(2)}
                                </p>
                            </div>
                            <form onSubmit={handleCreateTrackedCustomer} className="p-5 space-y-3">
                                <input required autoFocus placeholder="Full name" value={newCustomerForm.name}
                                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                                <input required placeholder="Phone" value={newCustomerForm.phone}
                                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                                <input placeholder="Address (optional)" value={newCustomerForm.address}
                                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                                <button type="submit" disabled={addingCustomer} className="w-full py-3 rounded-xl bg-brand text-white font-medium text-sm hover:bg-indigo-700 transition disabled:opacity-60">
                                    {addingCustomer ? 'Saving...' : 'Add Customer'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* LEFT: product search + grid */}
                <div className="lg:col-span-2 min-w-0">
                    <div className="relative mb-4">
                        {pendingProduct ? (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 py-3 rounded-xl border-2 border-brand bg-brand/5"
                            >
                                <span className="text-sm font-medium text-slate-700 flex-1 min-w-[8rem] truncate">
                                    {pendingProduct.name} <span className="text-slate-400">· ₹{Number(pendingProduct.price).toFixed(2)} each</span>
                                </span>
                                <span className="text-xs text-slate-400 whitespace-nowrap">Qty:</span>
                                <input
                                    ref={qtyInputRef}
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={qtyInput}
                                    onChange={(e) => { setQtyInput(e.target.value); setQtyError('') }}
                                    onKeyDown={handleQtyKeyDown}
                                    className={`w-20 px-2 py-1.5 rounded-lg border text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand ${qtyError ? 'border-red-400' : 'border-slate-300'}`}
                                />
                                <button
                                    onClick={confirmAddToCart}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-medium hover:bg-indigo-700 transition"
                                >
                                    <CornerDownLeft size={13} /> Add
                                </button>
                                <button
                                    onClick={() => { setPendingProduct(null); setQtyError(''); searchInputRef.current?.focus() }}
                                    className="text-xs text-slate-400 hover:text-slate-600 px-1"
                                >
                                    Cancel
                                </button>
                                {qtyError && (
                                    <span className="basis-full text-xs text-red-500">{qtyError}</span>
                                )}
                            </motion.div>
                        ) : (
                            <>
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                                <input
                                    ref={searchInputRef}
                                    autoFocus
                                    placeholder="Search products…"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setHighlightIndex(0) }}
                                    onKeyDown={handleSearchKeyDown}
                                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand transition"
                                />

                                {dropdownOpen && (
                                    <div className="absolute z-20 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
                                        {filteredProducts.map((p, idx) => {
                                            const outOfStock = p.stock <= 0
                                            return (
                                                <button
                                                    key={p.id}
                                                    onMouseEnter={() => !outOfStock && setHighlightIndex(idx)}
                                                    onClick={() => selectProduct(p)}
                                                    disabled={outOfStock}
                                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition ${outOfStock
                                                        ? 'opacity-40 cursor-not-allowed'
                                                        : idx === highlightIndex ? 'bg-brand text-white' : 'hover:bg-slate-50 text-slate-700'
                                                        }`}
                                                >
                                                    <span className="font-medium">{p.name}</span>
                                                    <span className={!outOfStock && idx === highlightIndex ? 'text-white/80' : 'text-slate-400'}>
                                                        {outOfStock ? 'Out of stock' : `₹${Number(p.price).toFixed(2)} · ${p.stock} in stock`}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                        {products.map((p) => {
                            const outOfStock = p.stock <= 0
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => selectProduct(p)}
                                    disabled={outOfStock}
                                    className={`bg-white rounded-xl border p-3 sm:p-4 text-left transition ${outOfStock
                                        ? 'border-slate-100 opacity-50 cursor-not-allowed'
                                        : 'border-slate-200 hover:border-brand hover:shadow-sm'
                                        }`}
                                >
                                    <p className="font-medium text-slate-800 text-sm mb-1 truncate">{p.name}</p>
                                    <p className="text-brand font-semibold">₹{Number(p.price).toFixed(2)}</p>
                                    <p className={`text-xs mt-1 ${outOfStock ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                                        {outOfStock ? 'Out of stock' : `${p.stock} in stock`}
                                    </p>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* RIGHT: cart card with held-bill tabs built into its top */}
                <div className="bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden min-w-0">
                    {/* BILL TABS — one tab per waiting customer, inside the cart card */}
                    <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-slate-100 bg-slate-50/70 overflow-x-auto">
                        {tabs.map((t, i) => {
                            const isActive = t.id === activeTabId
                            const itemCount = t.cart.reduce((s, item) => s + Number(item.qty || 0), 0)
                            return (
                                <div key={t.id} className="relative shrink-0">
                                    <button
                                        onClick={() => { setActiveTabId(t.id); setPendingProduct(null); setSearch('') }}
                                        className={`flex items-center gap-1.5 pl-2.5 pr-6 py-1.5 rounded-lg text-xs font-medium transition border max-w-40 ${isActive
                                            ? 'bg-white text-slate-800 border-slate-200 shadow-sm'
                                            : 'bg-transparent text-slate-400 border-transparent hover:bg-white/70 hover:text-slate-600'
                                            }`}
                                    >
                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${isActive ? 'bg-brand text-white' : 'bg-slate-200 text-slate-500'}`}>
                                            {i + 1}
                                        </span>
                                        <span className="truncate max-w-20">{t.name}</span>
                                        {itemCount > 0 && (
                                            <span className={`px-1.5 rounded-full text-[10px] font-semibold shrink-0 ${isActive ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-400'}`}>
                                                {itemCount}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => closeTab(t.id)}
                                        title="Discard this bill"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-300 hover:text-red-500 transition"
                                    >
                                        <X size={11} />
                                    </button>
                                </div>
                            )
                        })}
                        <button
                            onClick={addTab}
                            disabled={tabs.length >= MAX_TABS}
                            title="Start a bill for the next customer"
                            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white hover:text-brand transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <PlusCircle size={15} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <ShoppingCart size={17} className="text-slate-600" />
                            <h3 className="font-semibold text-slate-800">Cart ({cart.length})</h3>
                        </div>
                        {tabs.some((t) => t.cart.length > 0) && (
                            <span className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Clock size={12} />
                                {tabs.filter((t) => t.cart.length > 0).length} waiting
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 min-h-[100px] max-h-[38vh] lg:max-h-none">
                        <AnimatePresence>
                            {cart.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-8">Cart is empty. Search or click a product to add.</p>
                            ) : (
                                cart.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-700 truncate">{item.name}</p>
                                            <p className="text-xs text-slate-400">₹{Number(item.price).toFixed(2)} each</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                                                <Minus size={12} />
                                            </button>
                                            <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                                            <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                                                <Plus size={12} />
                                            </button>
                                            <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-md flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 ml-1">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="border-t border-slate-100 px-5 py-4 space-y-3">
                        <select
                            value={customerId}
                            onChange={(e) => updateActiveTab({ customerId: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                        >
                            {walkInId && <option value={walkInId}>{WALKIN_NAME}</option>}
                            {customers.filter((c) => c.id !== walkInId).map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        <div className="flex items-center justify-between text-sm gap-2">
                            <label className="text-slate-500">Discount (₹)</label>
                            <input
                                type="number" min="0" value={discount}
                                onChange={(e) => updateActiveTab({ discount: e.target.value })}
                                className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 text-right text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                            {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    onClick={() => selectPaymentMethod(value)}
                                    className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition ${paymentMethod === value ? 'bg-brand text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                        }`}
                                >
                                    <Icon size={15} />
                                    {label}
                                </button>
                            ))}
                        </div>

                        {paymentMethod && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-center justify-between text-sm gap-2">
                                <label className="text-slate-500">Received (₹)</label>
                                <input
                                    type="number" min="0" value={receivedAmount}
                                    onChange={(e) => updateActiveTab({ receivedAmount: e.target.value })}
                                    className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 text-right text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                />
                            </motion.div>
                        )}

                        <div className="pt-2 border-t border-slate-100 space-y-1 text-sm">
                            <div className="flex justify-between text-slate-400">
                                <span>Subtotal</span><span>₹{totals.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>{shopTax.label} ({shopTax.rate}%)</span><span>₹{totals.taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-semibold text-slate-800 text-base pt-1">
                                <span>Total</span><span>₹{totals.grandTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleFinalizeSale}
                            disabled={cart.length === 0 || !customerId || !paymentMethod || finalizing}
                            className="w-full py-3 rounded-xl bg-brand text-white font-medium text-sm hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {finalizing ? 'Processing…' : !paymentMethod ? 'Select a payment method' : 'Complete Sale'}
                        </button>

                        {(cart.length > 0 || Number(discount) > 0) && (
                            <button
                                onClick={clearActiveTab}
                                className="w-full py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-medium hover:bg-slate-50 hover:text-red-500 transition"
                            >
                                Clear this bill
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}