import axiosClient from './axiosClient.js'

export const registerShop = (payload) =>
    axiosClient.post('/auth/register/', payload)

export const login = (email, password) =>
    axiosClient.post('/auth/login/', { email, password })

export const getMe = () => axiosClient.get('/auth/me/')

export const updateProfile = (data) =>
    axiosClient.patch('/auth/me/', data)

export const changePassword = (oldPassword, newPassword) =>
    axiosClient.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
    })

export const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
}