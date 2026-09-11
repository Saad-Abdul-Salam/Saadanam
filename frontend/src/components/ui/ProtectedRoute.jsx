import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ProtectedRoute({ children, allowedRole }) {
    const { user } = useAuth()

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (allowedRole && user.role !== allowedRole) {
        // wrong role trying to access the other portal
        const fallback = user.role === 'platform_admin' ? '/admin/dashboard' : '/shop/dashboard'
        return <Navigate to={fallback} replace />
    }

    return children
}