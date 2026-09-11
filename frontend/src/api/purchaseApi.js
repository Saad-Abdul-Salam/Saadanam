import axiosClient from './axiosClient.js'

export const getPurchases = () => axiosClient.get('/purchases/')
export const createPurchase = (data) => axiosClient.post('/purchases/', data)
export const updatePurchase = (id, data) => axiosClient.patch(`/purchases/${id}/`, data)
export const deletePurchase = (id) => axiosClient.delete(`/purchases/${id}/`)