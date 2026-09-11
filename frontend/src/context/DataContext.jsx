import { createContext, useContext, useState } from 'react'

const DataContext = createContext(null)

const MOCK_PURCHASES = [
    {
        id: 1,
        supplier: 'Kerala Wholesale Traders',
        date: '2026-07-28',
        items: [
            { product: 'Basmati Rice (5kg)', qty: 10, cost: 380 },
            { product: 'Toor Dal (1kg)', qty: 20, cost: 110 },
        ],
        total: 6000,
        status: 'Received',
        expenseId: 101,
    },
    {
        id: 2,
        supplier: 'Malabar Distributors',
        date: '2026-07-25',
        items: [
            { product: 'Sunflower Oil (1L)', qty: 15, cost: 150 },
        ],
        total: 2250,
        status: 'Received',
        expenseId: 102,
    },
]

const MOCK_EXPENSES = [
    { id: 101, category: 'Purchase', amount: 6000, date: '2026-07-28', note: 'Purchase from Kerala Wholesale Traders', purchaseId: 1 },
    { id: 102, category: 'Purchase', amount: 2250, date: '2026-07-25', note: 'Purchase from Malabar Distributors', purchaseId: 2 },
    { id: 1, category: 'Rent', amount: 12000, date: '2026-07-01', note: 'Monthly shop rent' },
    { id: 2, category: 'Electricity', amount: 2400, date: '2026-07-05', note: 'July bill' },
    { id: 3, category: 'Transport', amount: 800, date: '2026-07-20', note: 'Delivery van fuel' },
    { id: 4, category: 'Salary', amount: 15000, date: '2026-07-01', note: 'Staff salary' },
]

export function DataProvider({ children }) {
    const [purchases, setPurchases] = useState(MOCK_PURCHASES)
    const [expenses, setExpenses] = useState(MOCK_EXPENSES)

    const addPurchase = (purchase) => {
        const purchaseId = Date.now()
        const expenseId = purchaseId + 1

        setPurchases((prev) => [
            { id: purchaseId, ...purchase, status: 'Received', expenseId },
            ...prev
        ])

        setExpenses((prev) => [
            {
                id: expenseId,
                category: 'Purchase',
                amount: purchase.total,
                date: purchase.date,
                note: `Purchase from ${purchase.supplier}`,
                purchaseId,
            },
            ...prev
        ])
    }

    const updatePurchase = (id, updated) => {
        setPurchases((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)))
        setExpenses((prev) =>
            prev.map((e) =>
                e.purchaseId === id
                    ? { ...e, amount: updated.total, date: updated.date, note: `Purchase from ${updated.supplier}` }
                    : e
            )
        )
    }

    const deletePurchase = (id) => {
        setPurchases((prev) => prev.filter((p) => p.id !== id))
        setExpenses((prev) => prev.filter((e) => e.purchaseId !== id))
    }

    const addExpense = (expense) => {
        setExpenses((prev) => [{ id: Date.now(), ...expense }, ...prev])
    }

    return (
        <DataContext.Provider value={{ purchases, expenses, addPurchase, updatePurchase, deletePurchase, addExpense }}>
            {children}
        </DataContext.Provider>
    )
}

export const useData = () => useContext(DataContext)