import axiosClient from './axiosClient.js'

export const getSalesReport = (start, end) =>
    axiosClient.get('/reports/sales/', { params: { start, end } })
export const getTodayStats = () => axiosClient.get('/reports/today-stats/')
export const getPlatformAnalytics = () => axiosClient.get('/reports/platform-analytics/')

export const exportSalesReportUrl = (start, end) =>
    `/reports/sales/export/?start=${start}&end=${end}`