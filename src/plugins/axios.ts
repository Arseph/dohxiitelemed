import { globals } from '@/globals';
import type { AxiosInstance } from 'axios';
import axios from 'axios';
const token = localStorage.getItem('auth_token');
const API_URL = `${globals.api}`
const axiosIns: AxiosInstance = axios.create({
  baseURL: `${API_URL}/`,
  headers: {
    'Content-Type': 'multipart/form-data',
    'Authorization': `Bearer ${token}`
  },
  withCredentials: true,
});

const axiosJson: AxiosInstance = axios.create({
  baseURL: `${API_URL}/`,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,  // Proper template literal syntax
  },
  withCredentials: true,
});

const axiosPdf: AxiosInstance = axios.create({
  baseURL: `${API_URL}/`,
  headers: {
    'Content-Type': 'application/pdf',
    'Authorization': `Bearer ${token}`,  // Proper template literal syntax
  },
  withCredentials: true,
});

const axiosExcel: AxiosInstance = axios.create({
  baseURL: `${API_URL}/`,
  headers: {
    'Accept': 'application/vnd.ms-excel',
    'Authorization': `Bearer ${token}`,
  },
  withCredentials: true,
});

axiosIns.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export { axiosExcel, axiosIns, axiosJson, axiosPdf };

