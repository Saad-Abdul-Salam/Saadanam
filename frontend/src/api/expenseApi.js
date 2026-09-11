import axiosClient from './axiosClient.js'

export const getExpenses = () => axiosClient.get('/expenses/')
export const createExpense = (data) => axiosClient.post('/expenses/', data)
export const deleteExpense = (id) => axiosClient.delete(`/expenses/${id}/`)