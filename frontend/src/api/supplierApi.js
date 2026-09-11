import axiosClient from './axiosClient.js'

export const getSuppliers = () => axiosClient.get('/suppliers/')
export const createSupplier = (data) => axiosClient.post('/suppliers/', data)
export const updateSupplier = (id, data) => axiosClient.patch(`/suppliers/${id}/`, data)
export const deleteSupplier = (id) => axiosClient.delete(`/suppliers/${id}/`)
export const adjustSupplierBalance = (id, entryType, amount) =>
    axiosClient.post(`/suppliers/${id}/adjust-balance/`, { entry_type: entryType, amount })