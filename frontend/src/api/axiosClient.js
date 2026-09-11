import axios from 'axios'
import { isDemoMode, demoRequest } from '../demo/demoServer.js'

// Production builds set VITE_API_BASE_URL (e.g. https://saadanam-api.onrender.com/api)
// at build time; local dev falls back to the Django runserver address.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
})

// While the free landing-page demo is active, every request is served by an
// in-memory demo server — nothing touches the real backend or database.
axiosClient.defaults.adapter = async (config) => {
    if (isDemoMode()) return demoRequest(config)
    // fall back to axios' default adapters (xhr / http)
    const defaultAdapter = axios.getAdapter(axios.defaults.adapter)
    return defaultAdapter(config)
}

// attach access token to every request
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// auto-refresh access token on 401
let isRefreshing = false
let refreshQueue = []

const AUTH_ENDPOINTS = ['/auth/login/', '/auth/register/', '/auth/refresh/']

axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => originalRequest.url?.includes(path))

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            const refreshToken = localStorage.getItem('refresh_token')
            if (!refreshToken) {
                localStorage.clear()
                window.location.href = '/login'
                return Promise.reject(error)
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    refreshQueue.push({ resolve, reject })
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`
                    return axiosClient(originalRequest)
                })
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                const res = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
                    refresh: refreshToken
                })
                const newAccess = res.data.access
                localStorage.setItem('access_token', newAccess)
                refreshQueue.forEach(({ resolve }) => resolve(newAccess))
                refreshQueue = []
                originalRequest.headers.Authorization = `Bearer ${newAccess}`
                return axiosClient(originalRequest)
            } catch (refreshError) {
                refreshQueue.forEach(({ reject }) => reject(refreshError))
                refreshQueue = []
                localStorage.clear()
                window.location.href = '/login'
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

export default axiosClient