/**
 * Centralized Axios Instance with Interceptors
 * Handles consistent request/response processing and error handling
 * Single point of configuration for all API calls
 */

import axios from 'axios'
import { BASE_URL } from './api.js'
import { getCsrfToken, ensureCsrfToken, refreshCsrfToken } from '../services/csrfService.js'

/**
 * Create a centralized axios instance
 * Pre-configured with credentials and consistent defaults
 */
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 45000, // 45 second timeout (image uploads need time for OpenAI nudity detection)
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request Interceptor
 * Logs outgoing requests, ensures consistent headers, and adds CSRF tokens
 * Now async to ensure CSRF token is available before sending
 */
axiosInstance.interceptors.request.use(
  async (config) => {
    // Log request in development
    if (import.meta.env.MODE === 'development') {
      console.log(`📤 [${config.method.toUpperCase()}] ${config.url}`)
    }

    // SECURITY FIX: Handle FormData for multipart file uploads
    // When sending FormData, axios must NOT have Content-Type set
    // This allows axios to auto-generate the proper multipart/form-data header with boundary
    if (config.data instanceof FormData) {
      // Delete Content-Type to let axios auto-set it with proper boundary
      delete config.headers['Content-Type']
      if (import.meta.env.MODE === 'development') {
        console.log(
          '📁 FormData detected - letting axios auto-set Content-Type with boundary'
        )
      }
    }

    // Security Fix #3: Add CSRF token to state-changing requests
    // CSRF protection applies to POST, PUT, PATCH, DELETE requests
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method.toUpperCase())
    ) {
      const csrfToken = await ensureCsrfToken()
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken
        if (import.meta.env.MODE === 'development') {
          console.log('🔐 CSRF token added to request header')
        }
      } else {
        console.error('❌ CSRF token could not be fetched for', config.url)
      }
    }

    return config
  },
  (error) => {
    console.error('❌ Request error:', error.message)
    return Promise.reject(error)
  }
)

// Track retry count to prevent infinite loops
const retryCountMap = new Map()

/**
 * Response Interceptor
 * Logs responses, handles errors consistently, and manages CSRF failures
 */
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (import.meta.env.MODE === 'development') {
      console.log(`✅ [${response.status}] ${response.config.url}`)
    }
    // Clear retry count on success
    retryCountMap.delete(response.config.url)
    return response
  },
  async (error) => {
    // Log error with status code
    const status = error.response?.status
    const message = error.response?.data?.message || error.message
    const errorCode = error.response?.data?.code
    console.error(
      `🔴 [${status || 'Network'}] ${error.config?.url}: ${message}`
    )

    // Add custom error properties for easier handling
    error.isNetworkError = !error.response
    error.isAuthError = status === 401
    error.isForbiddenError = status === 403
    error.isRateLimitError = status === 429
    error.isClientError = status >= 400 && status < 500
    error.isServerError = status >= 500

    // Security Fix #3: Handle CSRF token failures with automatic retry
    if (status === 403 && errorCode === 'CSRF_TOKEN_INVALID') {
      error.isCsrfError = true
      console.error('🔐 CSRF token validation failed - attempting recovery')

      // Prevent infinite retry loops
      const retryKey = error.config.url
      const retryCount = retryCountMap.get(retryKey) || 0

      if (retryCount < 2) {
        // Only retry up to 2 times
        retryCountMap.set(retryKey, retryCount + 1)

        try {
          // Refresh the CSRF token
          console.log('🔄 Refreshing CSRF token...')
          const newToken = await refreshCsrfToken()

          if (newToken) {
            // Update the request with the new token
            error.config.headers['X-CSRF-Token'] = newToken
            console.log('🔐 CSRF token refreshed, retrying request...')

            // Retry the request with the new token
            return axiosInstance.request(error.config)
          }
        } catch (refreshError) {
          console.error('❌ Failed to refresh CSRF token:', refreshError)
        }
      } else {
        console.error('❌ CSRF token retry limit exceeded')
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
