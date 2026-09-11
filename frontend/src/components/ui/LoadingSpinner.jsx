/**
 * Small reusable spinner with an optional message — used in list pages
 * while data loads. Pure CSS animation (no JS cost).
 */
export default function LoadingSpinner({ label = 'Loading…' }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-14">
            <div className="w-8 h-8 rounded-full border-[3px] border-brand/20 border-t-brand animate-spin" />
            <p className="text-sm text-slate-400">{label}</p>
        </div>
    )
}
