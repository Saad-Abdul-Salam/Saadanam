/**
 * In-memory demo API server for the free "Try the Saadanam Demo" experience.
 *
 * While demo mode is active, axiosClient routes every request here instead of
 * the real Django backend. All state lives in plain JS objects in this module,
 * so:
 *   - nothing is ever written to the database
 *   - nothing is sent to the web server
 *   - everything evaporates as soon as the page is reloaded
 *
 * The handlers mirror the real API's response shapes so the REAL shop pages
 * render exactly as they do for a signed-in shop owner.
 */

import {
    DEMO_USER, DEMO_SHOP, DEMO_PRODUCTS, DEMO_CUSTOMERS, DEMO_SUPPLIERS,
    DEMO_PURCHASES, DEMO_EXPENSES, DEMO_NOTIFICATIONS, DEMO_FEEDBACK_TICKETS,
} from './demoData.js'

/* ------------------------------------------------------------------ */
/*  Demo mode flag + state singleton (lives until the page reloads)    */
/* ------------------------------------------------------------------ */

let demoActive = false
let state = null

export const isDemoMode = () => demoActive

export function enterDemoMode() {
    demoActive = true
    if (!state) state = createDemoState()
}

export function exitDemoMode() {
    demoActive = false
    state = null // drop everything so re-entering starts from fresh seed data
}

export function resetDemoState() {
    state = createDemoState()
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

class DemoHttpError extends Error {
    constructor(status, data) {
        super('Demo HTTP error')
        this.status = status
        this.data = data
    }
}
const fail = (status, data) => { throw new DemoHttpError(status, data) }
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100
const todayISO = () => new Date().toISOString().slice(0, 10)

const csv = (rows) => rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n')

const taxInfo = (shop, afterDiscount) => {
    const rate = Number(shop.tax_rate || 0)
    if (shop.tax_mode === 'inclusive') {
        const grandTotal = afterDiscount
        const subtotal = grandTotal / (1 + rate / 100)
        return { subtotal, taxAmount: grandTotal - subtotal, grandTotal }
    }
    const subtotal = afterDiscount
    const taxAmount = subtotal * (rate / 100)
    return { subtotal, taxAmount, grandTotal: subtotal + taxAmount }
}

/* ------------------------------------------------------------------ */
/*  State seeding                                                      */
/* ------------------------------------------------------------------ */

function createDemoState() {
    const s = {
        user: { ...DEMO_USER },
        shop: { ...DEMO_SHOP },
        products: DEMO_PRODUCTS.map((p) => ({ ...p })),
        customers: DEMO_CUSTOMERS.map((c) => ({ ...c })),
        suppliers: DEMO_SUPPLIERS.map((x) => ({ ...x })),
        purchases: DEMO_PURCHASES.map((p) => ({ ...p, items: p.items.map((i) => ({ ...i })) })),
        expenses: DEMO_EXPENSES.map((e) => ({ ...e })),
        notifications: DEMO_NOTIFICATIONS.map((n) => ({ ...n })),
        feedback: DEMO_FEEDBACK_TICKETS.map((t) => ({ ...t, replies: (t.replies ?? []).map((r) => ({ ...r })) })),
        devices: [
            { id: 'demo-session-1', device: 'This browser — demo session', ip: '127.0.0.1', lastActive: new Date().toISOString() },
        ],
        sales: [],
        saleSeq: 1,
        invoiceSeq: 1,
        uid: 5000,
    }
    seedSales(s)
    return s
}

function seedSales(s) {
    const mk = (dayOffset, customerId, payment, lines, receivedOverride) => {
        const cust = s.customers.find((c) => c.id === customerId)
        const items = lines.map(([pid, qty], i) => {
            const p = s.products.find((pr) => pr.id === pid)
            return { id: s.saleSeq * 1000 + i, product: p.id, productName: p.name, qty, price: Number(p.price), cost: Number(p.cost || 0) }
        })
        const rawTotal = items.reduce((sum, it) => sum + it.price * it.qty, 0)
        const { subtotal, taxAmount, grandTotal } = taxInfo(s.shop, rawTotal)
        const received = receivedOverride !== undefined ? receivedOverride : grandTotal
        const balance = grandTotal - received
        const when = new Date()
        when.setDate(when.getDate() - dayOffset)
        when.setHours(9 + (s.sales.length % 8), 20, 0, 0)

        s.sales.push({
            id: s.saleSeq++,
            invoice_no: `${s.shop.invoice_prefix}-${String(s.invoiceSeq++).padStart(4, '0')}`,
            created_at: when.toISOString(),
            customer: cust.id,
            customerName: cust.name,
            customerPhone: cust.phone,
            customerAddress: cust.address,
            isWalkin: !!cust.is_walkin,
            items,
            subtotal: subtotal.toFixed(2),
            discount: '0.00',
            tax_amount: taxAmount.toFixed(2),
            total: grandTotal.toFixed(2),
            balance: balance.toFixed(2),
            payment_method: payment,
            received_amount: received.toFixed(2),
            profit: round2(items.reduce((sum, it) => sum + (it.price - it.cost) * it.qty, 0)),
        })
    }

    mk(6, 901, 'cash', [[101, 1], [106, 2]])
    mk(5, 900, 'upi', [[110, 2], [114, 1]])
    mk(4, 902, 'card', [[104, 1], [108, 2]])
    mk(3, 900, 'cash', [[103, 2], [107, 1]])
    mk(2, 903, 'upi', [[102, 3]])
    mk(1, 900, 'cash', [[111, 1], [115, 2], [116, 1]], undefined) // walk-in, partially paid
    // make the last walk-in sale underpaid so "Pending Payments" has a value
    const lastSale = s.sales[s.sales.length - 1]
    lastSale.received_amount = (Number(lastSale.total) - 85).toFixed(2)
    lastSale.balance = '85.00'
    mk(0, 901, 'upi', [[101, 1], [109, 1], [113, 1]])

    s.sales.reverse() // newest first, like the real API
}

/* ------------------------------------------------------------------ */
/*  Request plumbing                                                   */
/* ------------------------------------------------------------------ */

const parseUrl = (config = {}) => {
    let raw = config.url || '/'
    const query = {}
    const qIndex = raw.indexOf('?')
    if (qIndex !== -1) {
        new URLSearchParams(raw.slice(qIndex + 1)).forEach((v, k) => { query[k] = v })
        raw = raw.slice(0, qIndex)
    }
    if (config.params) {
        Object.entries(config.params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) query[k] = v
        })
    }
    raw = raw.replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '')
    if (!raw.startsWith('/')) raw = `/${raw}`
    return { path: raw, query }
}

const parseBody = (config = {}) => {
    let data = config.data
    if (typeof data === 'string') {
        try { data = JSON.parse(data) } catch { data = {} }
    }
    if (data instanceof FormData) return { formData: data, body: {} }
    return { formData: null, body: data || {} }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Axios adapter replacement. Resolves an axios-like response object.
 */
export async function demoRequest(config) {
    const method = (config.method || 'get').toLowerCase()
    const { path, query } = parseUrl(config)
    const { body, formData } = parseBody(config)

    // tiny latency so loading states feel like the real thing
    await sleep(120 + Math.random() * 180)

    try {
        let data = await route(method, path, query, body, formData)
        // CSV export endpoints return strings — wrap in a Blob for downloadCsv()
        if (typeof data === 'string') data = new Blob([data], { type: 'text/csv' })
        return { data, status: 200, statusText: 'OK', headers: {}, config, request: {} }
    } catch (err) {
        if (err instanceof DemoHttpError) {
            throw { __demoError: true, message: 'Request failed', response: { status: err.status, data: err.data }, config }
        }
        console.error('[demo server]', err)
        throw { __demoError: true, message: 'Demo server error', response: { status: 500, data: { error: 'Something went wrong in the demo.' } }, config }
    }
}

/* ------------------------------------------------------------------ */
/*  Routing                                                            */
/* ------------------------------------------------------------------ */

async function route(method, path, query, body, formData) {
    const s = state
    let m

    /* ---------------- PRODUCTS ---------------- */
    if (path === '/products/bulk-import/' && method === 'post') {
        const file = formData?.get('file')
        if (!file) fail(400, { error: 'No file provided.' })
        const text = await file.text()
        const lines = text.split(/\r?\n/).filter((l) => l.trim())
        const errors = []
        let createdCount = 0
        lines.slice(1).forEach((line, idx) => {
            const [name, price, stock, minStock, cost] = line.split(',').map((c) => c?.trim())
            if (!name || isNaN(Number(price))) {
                errors.push(`Row ${idx + 2}: invalid name or price.`)
                return
            }
            const p = Number(price)
            const c = Number(cost || 0)
            s.products.push({
                id: s.uid++,
                name,
                price: p,
                cost: c,
                stock: Number(stock || 0),
                minStock: Number(minStock || 0),
                margin: p > 0 ? Number((((p - c) / p) * 100).toFixed(1)) : 0,
            })
            createdCount++
        })
        return { createdCount, errors }
    }

    if ((m = path.match(/^\/products\/(\d+)\/quick-price\/$/)) && method === 'patch') {
        const product = s.products.find((p) => p.id === Number(m[1]))
        if (!product) fail(404, { error: 'Product not found.' })
        product.price = Number(body.price)
        product.margin = Number(product.price) > 0
            ? Number((((product.price - Number(product.cost || 0)) / product.price) * 100).toFixed(1))
            : 0
        return product
    }

    if (path === '/products/' && method === 'get') return s.products

    if (path === '/products/' && method === 'post') {
        const price = Number(body.price || 0)
        const cost = Number(body.cost || 0)
        const product = {
            id: s.uid++,
            name: body.name,
            price,
            cost,
            stock: Number(body.stock || 0),
            minStock: Number(body.minStock || 0),
            margin: price > 0 ? Number((((price - cost) / price) * 100).toFixed(1)) : 0,
        }
        s.products.push(product)
        return product
    }

    if ((m = path.match(/^\/products\/(\d+)\/$/))) {
        const product = s.products.find((p) => p.id === Number(m[1]))
        if (!product) fail(404, { error: 'Product not found.' })
        if (method === 'patch') {
            Object.assign(product, {
                name: body.name ?? product.name,
                price: Number(body.price ?? product.price),
                cost: Number(body.cost ?? product.cost),
                stock: Number(body.stock ?? product.stock),
                minStock: Number(body.minStock ?? product.minStock),
            })
            product.margin = Number(product.price) > 0
                ? Number((((product.price - Number(product.cost || 0)) / product.price) * 100).toFixed(1))
                : 0
            return product
        }
        if (method === 'delete') {
            s.products = s.products.filter((p) => p.id !== product.id)
            return { ok: true }
        }
    }

    /* ---------------- CUSTOMERS ---------------- */
    if (path === '/customers/walkin/' && method === 'get') {
        return s.customers.find((c) => c.is_walkin) ?? fail(404, { error: 'No walk-in customer.' })
    }

    if (path === '/customers/export/' && method === 'get') {
        return csv([
            ['Name', 'Phone', 'Address', 'Credit Limit', 'Outstanding'],
            ...s.customers.map((c) => [c.name, c.phone, c.address, c.creditLimit, c.outstanding]),
        ])
    }

    if ((m = path.match(/^\/customers\/(\d+)\/adjust-balance\/$/)) && method === 'post') {
        const customer = s.customers.find((c) => c.id === Number(m[1]))
        if (!customer) fail(404, { error: 'Customer not found.' })
        const amount = Number(body.amount || 0)
        customer.outstanding = body.entry_type === 'charge'
            ? round2(Number(customer.outstanding) + amount)
            : round2(Math.max(0, Number(customer.outstanding) - amount))
        return customer
    }

    if (path === '/customers/' && method === 'get') return s.customers

    if (path === '/customers/' && method === 'post') {
        const customer = {
            id: s.uid++,
            name: body.name,
            phone: body.phone,
            address: body.address || '',
            creditLimit: Number(body.creditLimit || 0),
            outstanding: round2(body.outstanding || 0),
            is_walkin: false,
        }
        s.customers.push(customer)
        return customer
    }

    if ((m = path.match(/^\/customers\/(\d+)\/$/))) {
        const customer = s.customers.find((c) => c.id === Number(m[1]))
        if (!customer) fail(404, { error: 'Customer not found.' })
        if (method === 'patch') {
            customer.name = body.name ?? customer.name
            customer.phone = body.phone ?? customer.phone
            customer.address = body.address ?? customer.address
            customer.creditLimit = Number(body.creditLimit ?? customer.creditLimit)
            return customer
        }
        if (method === 'delete') {
            s.customers = s.customers.filter((c) => c.id !== customer.id)
            return { ok: true }
        }
    }

    /* ---------------- SUPPLIERS ---------------- */
    if (path === '/suppliers/export/' && method === 'get') {
        return csv([
            ['Name', 'Phone', 'GST', 'Outstanding'],
            ...s.suppliers.map((x) => [x.name, x.phone, x.gst, x.outstanding]),
        ])
    }

    if ((m = path.match(/^\/suppliers\/(\d+)\/adjust-balance\/$/)) && method === 'post') {
        const supplier = s.suppliers.find((x) => x.id === Number(m[1]))
        if (!supplier) fail(404, { error: 'Supplier not found.' })
        const amount = Number(body.amount || 0)
        supplier.outstanding = body.entry_type === 'charge'
            ? round2(Number(supplier.outstanding) + amount)
            : round2(Math.max(0, Number(supplier.outstanding) - amount))
        return supplier
    }

    if (path === '/suppliers/' && method === 'get') return s.suppliers

    if (path === '/suppliers/' && method === 'post') {
        const supplier = { id: s.uid++, name: body.name, phone: body.phone, gst: body.gst || '', outstanding: 0 }
        s.suppliers.push(supplier)
        return supplier
    }

    if ((m = path.match(/^\/suppliers\/(\d+)\/$/))) {
        const supplier = s.suppliers.find((x) => x.id === Number(m[1]))
        if (!supplier) fail(404, { error: 'Supplier not found.' })
        if (method === 'patch') {
            supplier.name = body.name ?? supplier.name
            supplier.phone = body.phone ?? supplier.phone
            supplier.gst = body.gst ?? supplier.gst
            return supplier
        }
        if (method === 'delete') {
            s.suppliers = s.suppliers.filter((x) => x.id !== supplier.id)
            return { ok: true }
        }
    }

    /* ---------------- EXPENSES ---------------- */
    if (path === '/expenses/' && method === 'get') return s.expenses

    if (path === '/expenses/' && method === 'post') {
        const expense = { id: s.uid++, category: body.category, amount: round2(body.amount).toFixed(2), date: body.date, note: body.note || '' }
        s.expenses.unshift(expense)
        return expense
    }

    if ((m = path.match(/^\/expenses\/(\d+)\/$/)) && method === 'delete') {
        const expense = s.expenses.find((e) => e.id === Number(m[1]))
        if (!expense) fail(404, { error: 'Expense not found.' })
        if (expense.purchaseId) fail(400, { error: 'This expense is linked to a purchase. Delete it from the Purchases page.' })
        s.expenses = s.expenses.filter((e) => e.id !== expense.id)
        return { ok: true }
    }

    /* ---------------- PURCHASES ---------------- */
    if (path === '/purchases/' && method === 'get') return s.purchases

    if (path === '/purchases/' && method === 'post') {
        const supplier = s.suppliers.find((x) => x.id === Number(body.supplier))
        const purchase = {
            id: s.uid++,
            supplier: Number(body.supplier),
            supplierName: supplier ? supplier.name : `Supplier #${body.supplier}`,
            date: body.date,
            items: [],
            total: '0.00',
            status: 'Received',
        }
        applyPurchaseItems(s, purchase, body.items || [])
        s.purchases.unshift(purchase)
        syncPurchaseExpense(s, purchase)
        return purchase
    }

    if ((m = path.match(/^\/purchases\/(\d+)\/$/))) {
        const purchase = s.purchases.find((p) => p.id === Number(m[1]))
        if (!purchase) fail(404, { error: 'Purchase not found.' })
        if (method === 'patch') {
            purchase.items.forEach((it) => adjustStock(s, it.product, -Number(it.qty)))
            const supplier = s.suppliers.find((x) => x.id === Number(body.supplier))
            purchase.supplier = Number(body.supplier)
            purchase.supplierName = supplier ? supplier.name : purchase.supplierName
            purchase.date = body.date
            purchase.items = []
            applyPurchaseItems(s, purchase, body.items || [])
            syncPurchaseExpense(s, purchase)
            return purchase
        }
        if (method === 'delete') {
            purchase.items.forEach((it) => adjustStock(s, it.product, -Number(it.qty)))
            s.purchases = s.purchases.filter((p) => p.id !== purchase.id)
            s.expenses = s.expenses.filter((e) => e.purchaseId !== purchase.id)
            return { ok: true }
        }
    }

    /* ---------------- BILLING / SALES ---------------- */
    if (path === '/billing/finalize-sale/' && method === 'post') {
        const customer = s.customers.find((c) => c.id === Number(body.customer))
        if (!customer) fail(400, { error: 'Customer not found.' })

        const cleanItems = []
        for (const it of body.items || []) {
            const product = s.products.find((p) => p.id === Number(it.product))
            const qty = Number(it.qty)
            if (!product) fail(400, { items: [`Product #${it.product} not found.`] })
            if (!(qty > 0)) fail(400, { items: ['Quantity must be greater than zero.'] })
            if (qty > Number(product.stock)) fail(400, { items: [`Only ${product.stock} in stock for ${product.name}.`] })
            cleanItems.push({ product, qty })
        }

        const rawTotal = cleanItems.reduce((sum, { product, qty }) => sum + Number(product.price) * qty, 0)
        const discount = Number(body.discount || 0)
        const { subtotal, taxAmount, grandTotal } = taxInfo(s.shop, Math.max(0, rawTotal - discount))
        const received = Number(body.received_amount || 0)
        const balance = round2(grandTotal - received)

        cleanItems.forEach(({ product, qty }) => adjustStock(s, product.id, -qty))

        const sale = {
            id: s.saleSeq++,
            invoice_no: `${s.shop.invoice_prefix || 'INV'}-${String(s.invoiceSeq++).padStart(4, '0')}`,
            created_at: new Date().toISOString(),
            customer: customer.id,
            customerName: customer.name,
            customerPhone: customer.phone,
            customerAddress: customer.address,
            isWalkin: !!customer.is_walkin,
            items: cleanItems.map(({ product, qty }, i) => ({
                id: s.saleSeq * 100 + i,
                product: product.id,
                productName: product.name,
                qty,
                price: Number(product.price),
                cost: Number(product.cost || 0),
            })),
            subtotal: subtotal.toFixed(2),
            discount: discount.toFixed(2),
            tax_amount: taxAmount.toFixed(2),
            total: grandTotal.toFixed(2),
            balance: balance.toFixed(2),
            payment_method: body.payment_method || 'cash',
            received_amount: received.toFixed(2),
            profit: round2(cleanItems.reduce((sum, { product, qty }) => sum + (Number(product.price) - Number(product.cost || 0)) * qty, 0) - discount),
        }
        s.sales.unshift(sale)
        return sale
    }

    if (path === '/billing/sales/export/' && method === 'get') {
        return csv([
            ['Invoice', 'Customer', 'Date', 'Payment', 'Total'],
            ...s.sales.map((sale) => [sale.invoice_no, sale.customerName, sale.created_at.slice(0, 10), sale.payment_method, sale.total]),
        ])
    }

    if (path === '/billing/sales/' && method === 'get') return s.sales

    if ((m = path.match(/^\/billing\/sales\/(\d+)\/$/))) {
        const sale = s.sales.find((x) => x.id === Number(m[1]))
        if (!sale) fail(404, { error: 'Sale not found.' })
        if (method === 'get') return sale
        if (method === 'delete') {
            sale.items.forEach((it) => adjustStock(s, it.product, Number(it.qty)))
            if (Number(sale.balance) > 0 && !sale.isWalkin) {
                const cust = s.customers.find((c) => c.id === Number(sale.customer))
                if (cust) cust.outstanding = round2(Math.max(0, Number(cust.outstanding) - Number(sale.balance)))
            }
            s.sales = s.sales.filter((x) => x.id !== sale.id)
            return { ok: true }
        }
    }

    /* ---------------- REPORTS ---------------- */
    if (path === '/reports/today-stats/' && method === 'get') {
        const today = todayISO()
        const todaySales = s.sales.filter((sale) => sale.created_at.slice(0, 10) === today)
        return {
            todaySales: round2(todaySales.reduce((sum, sale) => sum + Number(sale.total), 0)),
            todayProfit: round2(todaySales.reduce((sum, sale) => sum + (sale.profit || 0), 0)),
            invoiceCount: todaySales.length,
            stockValue: round2(s.products.reduce((sum, p) => sum + Number(p.stock) * Number(p.cost || 0), 0)),
            pendingPayments: round2(
                s.customers.reduce((sum, c) => sum + Number(c.outstanding || 0), 0) +
                s.sales.filter((sale) => sale.isWalkin && Number(sale.balance) > 0).reduce((sum, sale) => sum + Number(sale.balance), 0)
            ),
            lowStockCount: s.products.filter((p) => Number(p.stock) <= Number(p.minStock || 0)).length,
            recentSales: s.sales.slice(0, 5).map((sale) => ({
                id: sale.id,
                invoiceNo: sale.invoice_no,
                customerName: sale.customerName,
                total: Number(sale.total),
            })),
        }
    }

    if (path === '/reports/sales/export/' && method === 'get') {
        const inRange = filterByRange(s.sales, query.start, query.end)
        return csv([
            ['Date', 'Invoice', 'Total', 'Profit'],
            ...inRange.map((sale) => [sale.created_at.slice(0, 10), sale.invoice_no, sale.total, sale.profit.toFixed?.(2) ?? sale.profit]),
        ])
    }

    if (path === '/reports/sales/' && method === 'get') {
        const inRange = filterByRange(s.sales, query.start, query.end)
        const daily = []
        if (query.start || query.end) {
            const begin = query.start || query.end
            const finish = query.end || query.start
            const cursor = new Date(`${begin}T00:00:00Z`)
            const last = new Date(`${finish}T00:00:00Z`)
            let guard = 0
            while (cursor <= last && guard < 62) {
                const key = cursor.toISOString().slice(0, 10)
                const daySales = inRange.filter((sale) => sale.created_at.slice(0, 10) === key)
                daily.push({
                    day: key,
                    sales: round2(daySales.reduce((sum, sale) => sum + Number(sale.total), 0)),
                    profit: round2(daySales.reduce((sum, sale) => sum + (sale.profit || 0), 0)),
                })
                cursor.setUTCDate(cursor.getUTCDate() + 1)
                guard++
            }
        }
        return {
            totalSales: round2(inRange.reduce((sum, sale) => sum + Number(sale.total), 0)),
            totalProfit: round2(inRange.reduce((sum, sale) => sum + (sale.profit || 0), 0)),
            totalInvoices: inRange.length,
            daily,
        }
    }

    /* ---------------- SHOP & PROFILE ---------------- */
    if (path === '/shops/me/' && method === 'get') return s.shop

    if (path === '/shops/me/' && method === 'patch') {
        if (formData) {
            const logo = formData.get('logo')
            if (logo && typeof logo !== 'string') {
                // preview the logo in memory only — never uploaded anywhere
                if (s.shop.logo_url?.startsWith?.('blob:')) URL.revokeObjectURL(s.shop.logo_url)
                s.shop.logo_url = URL.createObjectURL(logo)
            }
        } else {
            Object.assign(s.shop, body)
        }
        return s.shop
    }

    if (path === '/auth/me/' && method === 'get') return s.user

    if (path === '/auth/me/' && method === 'patch') {
        s.user.full_name = body.full_name ?? s.user.full_name
        s.user.phone = body.phone ?? s.user.phone
        return s.user
    }

    /* ---------------- NOTIFICATIONS ---------------- */
    if (path === '/notifications/unread-count/' && method === 'get') {
        return { unread: s.notifications.filter((n) => !n.read).length }
    }

    if (path === '/notifications/mark-all-read/' && method === 'post') {
        s.notifications.forEach((n) => { n.read = true })
        return { ok: true }
    }

    if (path === '/notifications/' && method === 'get') return s.notifications

    if ((m = path.match(/^\/notifications\/(\d+)\/read\/$/)) && method === 'post') {
        const n = s.notifications.find((x) => x.id === Number(m[1]))
        if (n) n.read = true
        return { ok: true }
    }

    /* ---------------- FEEDBACK ---------------- */
    if (path === '/feedback/unseen-count/' && method === 'get') return { unseen: 0 }

    if (path === '/feedback/' && method === 'get') return s.feedback

    if (path === '/feedback/' && method === 'post') {
        const ticket = {
            id: s.uid++,
            subject: body.subject,
            message: body.message,
            status: 'open',
            date: todayISO(),
            replies: [],
        }
        s.feedback.unshift(ticket)
        return ticket
    }

    if ((m = path.match(/^\/feedback\/(\d+)\/reply\/$/)) && method === 'post') {
        const ticket = s.feedback.find((t) => t.id === Number(m[1]))
        if (!ticket) fail(404, { error: 'Ticket not found.' })
        const reply = {
            id: s.uid++,
            senderRole: 'shop_owner',
            senderName: s.user.full_name,
            message: body.message,
            created_at: new Date().toISOString(),
        }
        ticket.replies = [...(ticket.replies ?? []), reply]
        return reply
    }

    /* ---------------- DEVICES ---------------- */
    if (path === '/devices/my-devices/' && method === 'get') return s.devices

    if ((m = path.match(/^\/devices\/([^/]+)\/logout\/$/)) && method === 'post') {
        s.devices = s.devices.filter((d) => String(d.id) !== m[1])
        return { ok: true }
    }

    console.warn(`[demo server] no handler for ${method.toUpperCase()} ${path}`)
    return fail(404, { error: `Demo endpoint not found: ${method.toUpperCase()} ${path}` })
}

/* ------------------------------------------------------------------ */
/*  Purchase / stock helpers                                           */
/* ------------------------------------------------------------------ */

function adjustStock(s, productId, delta) {
    const product = s.products.find((p) => p.id === Number(productId))
    if (product) product.stock = round2(Number(product.stock) + delta)
}

function applyPurchaseItems(s, purchase, lines) {
    purchase.items = lines
        .filter((l) => l.product && l.qty && l.cost)
        .map((l) => {
            const product = s.products.find((p) => p.id === Number(l.product))
            adjustStock(s, l.product, Number(l.qty))
            return {
                product: Number(l.product),
                productName: product ? product.name : `Product #${l.product}`,
                qty: Number(l.qty),
                cost: Number(l.cost),
            }
        })
    purchase.total = round2(purchase.items.reduce((sum, it) => sum + it.qty * it.cost, 0)).toFixed(2)
}

function syncPurchaseExpense(s, purchase) {
    let expense = s.expenses.find((e) => e.purchaseId === purchase.id)
    if (!expense) {
        expense = { id: s.uid++, purchaseId: purchase.id }
        s.expenses.unshift(expense)
    }
    Object.assign(expense, {
        category: 'Purchase',
        amount: purchase.total,
        date: purchase.date,
        note: `Purchase from ${purchase.supplierName}`,
    })
}

function filterByRange(sales, start, end) {
    return sales.filter((sale) => {
        const d = sale.created_at.slice(0, 10)
        if (start && d < start) return false
        if (end && d > end) return false
        return true
    })
}
