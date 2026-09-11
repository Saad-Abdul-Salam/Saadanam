import axiosClient from './axiosClient.js'

export const getMyShop = () => axiosClient.get('/shops/me/')
export const updateMyShop = (data) => axiosClient.patch('/shops/me/', data)

export const uploadShopLogo = (file) => {
    const formData = new FormData()
    formData.append('logo', file)
    return axiosClient.patch('/shops/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}