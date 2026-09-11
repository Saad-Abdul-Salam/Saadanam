import { useState } from 'react'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

export default function AppLayout({ title, children }) {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
            <div className="print-hide">
                <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <div className="print-hide">
                    <Topbar title={title} onOpenMobileMenu={() => setMobileOpen(true)} />
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</div>
            </div>
        </div>
    )
}