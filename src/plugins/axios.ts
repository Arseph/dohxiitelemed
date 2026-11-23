import type { AxiosInstance } from 'axios'
import axios from 'axios'
import { globals } from '@/globals'
import { getAuthToken } from '@/utils/authStorage'

const API_URL = `${globals.api}`

const axiosIns: AxiosInstance = axios.create({
  baseURL: `${API_URL}/`,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  withCredentials: true,
})

const axiosJson: AxiosInstance = axios.create({
  baseURL: `${API_URL}/`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

const axiosPdf: AxiosInstance = axios.create({
  baseURL: `${API_URL}/`,
  headers: {
    'Content-Type': 'application/pdf',
  },
  withCredentials: true,
})

const axiosExcel: AxiosInstance = axios.create({
  baseURL: `${API_URL}/`,
  headers: {
    Accept: 'application/vnd.ms-excel',
  },
  withCredentials: true,
})

// Read the token per request, not once at import: it changes on login/logout
// without a page reload, and may live in localStorage or sessionStorage.
for (const instance of [axiosIns, axiosJson, axiosPdf, axiosExcel]) {
  instance.interceptors.request.use(config => {
    const token = getAuthToken()
    if (token)
      config.headers.Authorization = `Bearer ${token}`

    return config
  })
}

export { axiosExcel, axiosIns, axiosJson, axiosPdf }
