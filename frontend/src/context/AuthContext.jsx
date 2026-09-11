import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as authApi from '../api/authApi.js'
import { isDemoMode } from '../demo/demoServer.js'
import { DEMO_USER } from '../demo/demoData.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const navigate = useNavigate()
    const [user, setUser] = useState(() => {
        // Demo mode signs in a fake user held purely in memory — nothing is
        // written to localStorage and no API call is made.
        if (isDemoMode()) {
            return { ...DEMO_USER }
        }
        const stored = localStorage.getItem('user')
        return stored ? JSON.parse(stored) : null
    })

    const loginUser = async (email, password) => {
        const res = await authApi.login(email, password)
        const { access, refresh, user: userData } = res.data

        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh)
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)

        if (userData.role === 'platform_admin') {
            navigate('/admin/dashboard')
        } else {
            navigate('/shop/dashboard')
        }
    }

    const logoutUser = () => {
        authApi.logout()
        setUser(null)
        navigate('/login')
    }

    const updateUser = (patch) => {
        const next = { ...user, ...patch }
        setUser(next)
        // In demo mode there is no real account — keep the demo user in
        // memory only so localStorage stays untouched.
        if (!isDemoMode()) {
            localStorage.setItem('user', JSON.stringify(next))
        }
    }

    return (
        <AuthContext.Provider value={{ user, loginUser, logoutUser, updateUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)