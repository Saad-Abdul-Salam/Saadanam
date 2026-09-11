import axiosClient from './axiosClient.js'

export const getMyDevices = () => axiosClient.get('/devices/my-devices/')
export const logoutDevice = (sessionId) => axiosClient.post(`/devices/${sessionId}/logout/`)
export const getShopDevices = () => axiosClient.get('/devices/shop-devices/')
export const forceLogoutDevice = (sessionId) => axiosClient.post(`/devices/${sessionId}/force-logout/`)