import axiosClient from './axiosClient.js'

export const getCustomers = () => axiosClient.get('/customers/')
export const getWalkinCustomer = () => axiosClient.get('/customers/walkin/')
export const createCustomer = (data) => axiosClient.post('/customers/', data)
export const updateCustomer = (id, data) => axiosClient.patch(`/customers/${id}/`, data)
export const deleteCustomer = (id) => axiosClient.delete(`/customers/${id}/`)
export const adjustBalance = (id, entryType, amount) =>
    axiosClient.post(`/customers/${id}/adjust-balance/`, { entry_type: entryType, amount })