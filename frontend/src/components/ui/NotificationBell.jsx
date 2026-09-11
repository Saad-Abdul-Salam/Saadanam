import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import * as notificationApi from '../../api/notificationApi.js'
import * as feedbackApi from '../../api/feedbackApi.js'

export default function NotificationBell() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const isAdmin = user?.role === 'platform_admin'
    const [count, setCount] = useState(0)

    const loadCount = () => {
        if (isAdmin) {
            // Bell dot lights up only when a new (unseen) feedback message arrives
            feedbackApi.getUnseenCount().then((res) => setCount(res.data.unseen)).catch(() => { })
        } else {
            notificationApi.getUnreadCount().then((res) => setCount(res.data.unread)).catch(() => { })
        }
    }

    useEffect(() => {
        loadCount()
        const interval = setInterval(loadCount, 30000) // poll every 30s
        return () => clearInterval(interval)
    }, [isAdmin])

    const handleClick = () => {
        navigate(isAdmin ? '/admin/feedback' : '/shop/notifications')
    }

    return (
        <button
            onClick={handleClick}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
            title={isAdmin ? 'Open feedback tickets' : 'Notifications'}
        >
            <Bell size={17} />
            {count > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
        </button>
    )
}