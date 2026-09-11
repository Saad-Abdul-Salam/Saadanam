import axiosClient from './axiosClient.js'

export const getMyTickets = () => axiosClient.get('/feedback/')
export const createTicket = (data) => axiosClient.post('/feedback/', data)
export const getAllTickets = () => axiosClient.get('/feedback/all/')
export const getUnseenCount = () => axiosClient.get('/feedback/unseen-count/')
export const replyToTicket = (id, message) => axiosClient.post(`/feedback/${id}/reply/`, { message })
export const resolveTicket = (id) => axiosClient.post(`/feedback/${id}/resolve/`)