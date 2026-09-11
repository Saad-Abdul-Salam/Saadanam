import { Inbox } from 'lucide-react'

/**
 * Reusable empty state: friendly icon + message (+ optional call-to-action).
 * Used across list pages so "nothing here yet" never looks broken.
 */
export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-14 px-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Icon size={24} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p>
            {description && (
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}
