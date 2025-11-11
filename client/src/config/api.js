/**
 * Centralized API Configuration
 * Single source of truth for all API endpoints
 * Eliminates duplicate API_URL configuration across stores and hooks
 */

export const BASE_URL =
  import.meta.env.MODE === 'development' ? 'http://localhost:8000' : ''

/**
 * Get full API URL for an endpoint
 * @param {string} endpoint - The endpoint path (e.g., '/api/auth/login')
 * @returns {string} - Full API URL
 */
export const getApiUrl = (endpoint) => {
  return `${BASE_URL}${endpoint}`
}

/**
 * API Endpoints
 * Centralized endpoint definitions for easy maintenance
 */
export const API = {
  // Auth Endpoints
  AUTH: {
    SIGNUP: '/api/auth/signup',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    VERIFY_EMAIL: '/api/auth/verify-email',
    VERIFY_TOKEN: '/api/auth/verify-token',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    UPDATE_PROFILE: '/api/auth/update-profile',
    DELETE_ACCOUNT: '/api/auth/delete-account',
    UPLOAD_PROFILE_IMAGE: '/api/auth/upload-profile-image',
  },

  // Message/Chat Endpoints
  MESSAGES: {
    GET_ALL: '/api/messages',
    GET_CONVERSATION: '/api/messages/conversation',
    SEND: '/api/messages/send',
    MARK_READ: '/api/messages/mark-read',
  },

  // Payment Endpoints
  PAYMENTS: {
    GET_PACKAGES: '/api/payments/packages',
    CREATE_CHECKOUT: '/api/payments/create-checkout-session',
    GET_SUBSCRIPTION: '/api/payments/subscription',
    CANCEL_SUBSCRIPTION: '/api/payments/cancel-subscription',
    GET_TRANSACTIONS: '/api/payments/transactions',
    UPDATE_PAYMENT_METHOD: '/api/payments/update-payment-method',
    WEBHOOK: '/api/payments/webhook',
  },

  // Admin Endpoints
  ADMIN: {
    GET_USERS: '/api/admin/users',
    GET_USER_DETAILS: '/api/admin/users',
    DELETE_USER: '/api/admin/users',
  },
}

/**
 * Get full URL for an API endpoint
 * @param {string} endpoint - Endpoint key or path
 * @returns {string} - Full API URL
 *
 * Usage:
 *   getApiUrl(API.AUTH.LOGIN) => 'http://localhost:8000/api/auth/login'
 *   getApiUrl('/api/auth/login') => 'http://localhost:8000/api/auth/login'
 */
export const getFullApiUrl = (endpoint) => {
  return `${BASE_URL}${endpoint}`
}

export default API
