import axiosClient from './axiosClient.js'

export const getMyNotifications = () => axiosClient.get('/notifications/')
export const getUnreadCount = () => axiosClient.get('/notifications/unread-count/')
export const markNotificationRead = (id) => axiosClient.post(`/notifications/${id}/read/`)
export const markAllNotificationsRead = () => axiosClient.post('/notifications/mark-all-read/')
export const getSentNotifications = () => axiosClient.get('/notifications/broadcast/')
export const sendNotification = (data) => axiosClient.post('/notifications/broadcast/', data)