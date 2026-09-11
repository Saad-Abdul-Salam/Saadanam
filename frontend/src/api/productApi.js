import axiosClient from './axiosClient.js'

export const getProducts = () => axiosClient.get('/products/')
export const createProduct = (data) => axiosClient.post('/products/', data)
export const updateProduct = (id, data) => axiosClient.patch(`/products/${id}/`, data)
export const deleteProduct = (id) => axiosClient.delete(`/products/${id}/`)
export const quickUpdatePrice = (id, price) =>
  axiosClient.patch(`/products/${id}/quick-price/`, { price })

export const bulkImportProducts = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return axiosClient.post('/products/bulk-import/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}