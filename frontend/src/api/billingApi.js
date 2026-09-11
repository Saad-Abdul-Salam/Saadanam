import axiosClient from './axiosClient.js'

export const finalizeSale = (data) => axiosClient.post('/billing/finalize-sale/', data)
export const getSales = () => axiosClient.get('/billing/sales/')
export const getSaleDetail = (id) => axiosClient.get(`/billing/sales/${id}/`)
export const deleteSale = (id) => axiosClient.delete(`/billing/sales/${id}/`)