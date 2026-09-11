/**
 * Demo seed data.
 *
 * These objects mirror the EXACT shapes the real Django API returns, so the
 * real shop pages render identically in demo mode. Everything here lives in
 * browser memory only — nothing is sent to the backend and nothing survives
 * a page reload.
 */

const nowISO = () => new Date().toISOString()
const daysAgoISODate = (n) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d.toISOString().slice(0, 10)
}

export const DEMO_USER = {
    id: 999,
    email: 'demo@saadanam.app',
    full_name: 'Demo Shop Owner',
    phone: '+91 98765 43210',
    role: 'shop_owner',
    demo: true,
}

export const DEMO_SHOP = {
    id: 999,
    business_name: 'Demo Super Market',
    address: '12, Market Road,\nKochi, Kerala 682001',
    owner_email: 'demo@saadanam.app',
    owner_phone: '+91 98765 43210',
    invoice_prefix: 'DEMO',
    tax_mode: 'inclusive',
    tax_rate: '5.00',
    tax_label: 'GST',
    logo_url: null,
}

let productSeq = 101
const P = (name, price, cost, stock, minStock) => ({
    id: productSeq++,
    name,
    price,
    cost,
    stock,
    minStock,
    margin: price > 0 ? Number((((price - cost) / price) * 100).toFixed(1)) : 0,
})

export const DEMO_PRODUCTS = [
    P('Basmati Rice (5kg)', 480, 380, 42, 10),
    P('Toor Dal (1kg)', 145, 110, 65, 15),
    P('Sunflower Oil (1L)', 172, 150, 28, 12),
    P('Wheat Atta (5kg)', 235, 195, 33, 8),
    P('Tea Powder (500g)', 165, 128, 2, 10),
    P('Sugar (1kg)', 52, 44, 80, 20),
    P('Coconut Oil (500ml)', 118, 96, 24, 10),
    P('Milk (1L)', 27, 24, 50, 20),
    P('Bread', 42, 32, 18, 6),
    P('Eggs (Tray of 10)', 78, 65, 12, 6),
    P('Detergent Powder (1kg)', 210, 175, 16, 5),
    P('Toothpaste', 95, 72, 0, 8),
    P('Shampoo (340ml)', 240, 198, 9, 5),
    P('Biscuits (Family Pack)', 60, 47, 44, 15),
    P('Green Chilli (500g)', 24, 18, 6, 5),
    P('Tomato (1kg)', 32, 25, 40, 10),
]

export const DEMO_CUSTOMERS = [
    {
        id: 901,
        name: 'Ramesh Kumar',
        phone: '+91 98450 11223',
        address: 'Palarivattom, Kochi',
        creditLimit: 5000,
        outstanding: '340.00',
        is_walkin: false,
    },
    {
        id: 902,
        name: 'Fathima S',
        phone: '+91 99860 44556',
        address: 'Kaloor, Kochi',
        creditLimit: 2000,
        outstanding: '0.00',
        is_walkin: false,
    },
    {
        id: 903,
        name: 'Suresh Menon',
        phone: '+91 97390 77889',
        address: 'Kadavanthra, Kochi',
        creditLimit: 3000,
        outstanding: '1250.00',
        is_walkin: false,
    },
    {
        id: 900,
        name: 'Walk-in Customer',
        phone: '',
        address: '',
        creditLimit: 0,
        outstanding: '0.00',
        is_walkin: true,
    },
]

export const DEMO_SUPPLIERS = [
    {
        id: 801,
        name: 'Kerala Wholesale Traders',
        phone: '+91 94470 12345',
        gst: '32ABCDE1234F1Z5',
        outstanding: '0.00',
    },
    {
        id: 802,
        name: 'Malabar Distributors',
        phone: '+91 94470 98765',
        gst: '32XYZAB9876K1Z2',
        outstanding: '2250.00',
    },
]

export const DEMO_PURCHASES = [
    {
        id: 701,
        supplier: 801,
        supplierName: 'Kerala Wholesale Traders',
        date: daysAgoISODate(4),
        items: [
            { product: 101, productName: 'Basmati Rice (5kg)', qty: 10, cost: 380 },
            { product: 102, productName: 'Toor Dal (1kg)', qty: 20, cost: 110 },
        ],
        total: '6000.00',
        status: 'Received',
    },
    {
        id: 702,
        supplier: 802,
        supplierName: 'Malabar Distributors',
        date: daysAgoISODate(7),
        items: [
            { product: 103, productName: 'Sunflower Oil (1L)', qty: 15, cost: 150 },
        ],
        total: '2250.00',
        status: 'Received',
    },
]

export const DEMO_EXPENSES = [
    { id: 601, category: 'Purchase', amount: '6000.00', date: daysAgoISODate(4), note: 'Purchase from Kerala Wholesale Traders', purchaseId: 701 },
    { id: 602, category: 'Purchase', amount: '2250.00', date: daysAgoISODate(7), note: 'Purchase from Malabar Distributors', purchaseId: 702 },
    { id: 603, category: 'Rent', amount: '12000.00', date: daysAgoISODate(10), note: 'Monthly shop rent' },
    { id: 604, category: 'Salary', amount: '15000.00', date: daysAgoISODate(10), note: 'Staff salary' },
    { id: 605, category: 'Electricity', amount: '2400.00', date: daysAgoISODate(6), note: 'Monthly bill' },
    { id: 606, category: 'Transport', amount: '800.00', date: daysAgoISODate(2), note: 'Delivery van fuel' },
]

export const DEMO_NOTIFICATIONS = [
    {
        id: 1,
        type: 'feature',
        title: 'Welcome to the demo!',
        message: 'This is a fully interactive demo of a Saadanam shop. Everything you do here stays in your browser and disappears when you leave or reload.',
        time: nowISO(),
        read: false,
    },
    {
        id: 2,
        type: 'announcement',
        title: 'Saadanam is free right now',
        message: 'Create your own shop free of cost — no plans, no hidden charges.',
        time: nowISO(),
        read: false,
    },
    {
        id: 3,
        type: 'maintenance',
        title: 'Demo data resets automatically',
        message: 'Products, bills, customers and expenses in the demo are sample data. Refresh the page to start fresh.',
        time: nowISO(),
        read: true,
    },
]

export const DEMO_FEEDBACK_TICKETS = [
    {
        id: 1,
        subject: 'How do I set my shop logo?',
        message: 'Loved the demo — where do I upload my own logo when I sign up?',
        status: 'resolved',
        date: daysAgoISODate(3),
        replies: [
            {
                id: 1,
                senderRole: 'platform_admin',
                senderName: 'Saadanam Support',
                message: 'Head to Settings → Business Info → Shop Logo. You can upload it right after registering!',
                created_at: nowISO(),
            },
        ],
    },
]
