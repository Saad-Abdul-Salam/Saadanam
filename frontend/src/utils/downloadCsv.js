import axiosClient from '../api/axiosClient.js'

/**
 * Fetch a CSV endpoint (with the auth token attached) and trigger a browser download.
 * @param {string} url  API path, e.g. '/billing/sales/export/'
 * @param {string} filename  e.g. 'sales.csv'
 */
export default async function downloadCsv(url, filename) {
    const res = await axiosClient.get(url, { responseType: 'blob' })
    const blobUrl = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(blobUrl)
}