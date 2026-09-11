export default function InvoiceDocument({ sale, shop }) {
    if (!sale || !shop) return null

    const balance = Number(sale.balance)
    const isWalkin = sale.isWalkin

    return (
        <div className="bg-white p-10 text-slate-800">
            <div className="flex justify-between items-start mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{shop.business_name}</h1>
                    <p className="text-sm text-slate-500 whitespace-pre-line mt-1">{shop.address}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-semibold text-slate-900">Invoice {sale.invoice_no}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Tax Invoice</p>
                </div>
            </div>

            <div className="flex justify-between mb-8 text-sm">
                <div>
                    {!isWalkin && <p className="font-semibold text-slate-700 mb-1.5 text-xs tracking-wide">BILL TO</p>}
                    {isWalkin ? (
                        <p className="text-slate-300 text-sm italic">Walk-in sale</p>
                    ) : (
                        <>
                            <p className="text-slate-800">{sale.customerName}</p>
                            {sale.customerPhone && <p className="text-slate-500">{sale.customerPhone}</p>}
                            {sale.customerAddress && <p className="text-slate-500 whitespace-pre-line">{sale.customerAddress}</p>}
                        </>
                    )}
                </div>
                <div className="text-right">
                    <p><span className="text-slate-400">Issue date: </span>{new Date(sale.created_at).toLocaleDateString()}</p>
                    <p><span className="text-slate-400">Reference: </span>{sale.invoice_no}</p>
                </div>
            </div>

            <table className="w-full text-sm mb-8">
                <thead>
                    <tr className="border-b-2 border-slate-800">
                        <th className="text-left py-2 font-semibold text-slate-700">Description</th>
                        <th className="text-right py-2 font-semibold text-slate-700">Quantity</th>
                        <th className="text-right py-2 font-semibold text-slate-700">Unit Price</th>
                        <th className="text-right py-2 font-semibold text-slate-700">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100">
                            <td className="py-2.5 text-slate-700">{item.productName}</td>
                            <td className="py-2.5 text-right text-slate-500">{item.qty}</td>
                            <td className="py-2.5 text-right text-slate-500">₹{Number(item.price).toFixed(2)}</td>
                            <td className="py-2.5 text-right text-slate-700 font-medium">₹{(item.qty * Number(item.price)).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="invoice-bottom flex justify-end mb-12">
                <div className="w-64 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Subtotal</span><span>₹{Number(sale.subtotal).toFixed(2)}</span>
                    </div>
                    {Number(sale.discount) > 0 && (
                        <div className="flex justify-between">
                            <span className="text-slate-500">Discount</span><span>-₹{Number(sale.discount).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-slate-500 italic">{shop.tax_label} {Number(shop.tax_rate)}%</span>
                        <span>₹{Number(sale.tax_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-800">
                        <span>Total</span><span>₹{Number(sale.total).toFixed(2)}</span>
                    </div>
                    {balance < 0 && (
                        <div className="flex justify-between text-green-600 font-medium">
                            <span>Change Due</span><span>₹{Math.abs(balance).toFixed(2)}</span>
                        </div>
                    )}
                    {balance > 0 && (
                        <div className="flex justify-between text-red-500 font-medium">
                            <span>Balance Due</span><span>₹{balance.toFixed(2)}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end mb-10">
                <div className="text-center">
                    <div className="h-16 border-b border-slate-400 w-48 mb-1" />
                    <p className="text-xs text-slate-400">Issued by, signature</p>
                </div>
            </div>

            <div className="border-t border-slate-200 pt-4 text-xs text-slate-400 flex justify-between">
                <span>{shop.owner_phone}</span>
                <span>{shop.owner_email}</span>
            </div>
        </div>
    )
}