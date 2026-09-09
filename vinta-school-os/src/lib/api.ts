/**
 * Vinta School OS — API Client
 * Axios instance with interceptors for JWT auth and academy scoping
 */

import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL, TOKEN_KEY, REFRESH_TOKEN_KEY, ACADEMY_ID_KEY } from './constants'

// ============================================
// Token Storage Helpers
// ============================================

export const tokenStorage = {
  getAccessToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },

  setAccessToken: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // Storage full or unavailable
    }
  },

  getRefreshToken: (): string | null => {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY)
    } catch {
      return null
    }
  },

  setRefreshToken: (token: string): void => {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token)
    } catch {
      // Storage full or unavailable
    }
  },

  getAcademyId: (): string | null => {
    try {
      return localStorage.getItem(ACADEMY_ID_KEY)
    } catch {
      return null
    }
  },

  setAcademyId: (id: string): void => {
    try {
      localStorage.setItem(ACADEMY_ID_KEY, id)
    } catch {
      // Storage full or unavailable
    }
  },

  clear: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(ACADEMY_ID_KEY)
    } catch {
      // Ignore
    }
  },
}

// ============================================
// Create Axios Instance
// ============================================

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ============================================
// Request Interceptor
// ============================================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add JWT token
    const token = tokenStorage.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add Academy ID header when available (backend ignores it if not needed)
    const academyId = tokenStorage.getAcademyId()
    if (academyId) {
      config.headers['X-Academy-Id'] = academyId
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ============================================
// Response Interceptor
// ============================================

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized — clear tokens and redirect to login
    // Backend has no refresh endpoint; re-authentication is required
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      // Don't redirect if already on login page
      if (currentPath !== '/' && currentPath !== '/login') {
        tokenStorage.clear()
        window.location.href = '/'
      }
    }

    return Promise.reject(error)
  }
)

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T
  status: number
  statusText: string
}

export interface ApiError {
  error: string
  message?: string
  status?: number
}

// ============================================
// Helper to extract data from Axios response
// ============================================

export function extractData<T>(response: { data: T }): T {
  return response.data
}

export default api
