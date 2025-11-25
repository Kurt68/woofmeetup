/**
 * CSRF Token Management Service
 * Handles fetching, storing, and retrieving CSRF tokens
 * Tokens are stored in memory and in cookies (httpOnly from server)
 *
 * SECURITY FIX: Prevent race conditions by ensuring token is available
 * before state-changing requests (signup/login) are submitted
 */

import { BASE_URL } from '../config/api.js'

let csrfToken = null
let csrfTokenPromise = null
let lastFetchTime = null
const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000 // Refresh every 50 minutes (1 hour max age)

/**
 * Fetch CSRF token from the server
 * Called on app initialization and periodically to keep token fresh
 * Uses promise caching to prevent duplicate requests
 * @param {boolean} force - Force refresh even if cached
 * @returns {Promise<string>} - The CSRF token
 */
export const fetchCsrfToken = async (force = false) => {
  // If a request is already in flight, wait for it instead of making another
  if (csrfTokenPromise) {
    return csrfTokenPromise
  }

  // If token is already cached and fresh, return it immediately
  if (csrfToken && !force && lastFetchTime) {
    const age = Date.now() - lastFetchTime
    if (age < TOKEN_REFRESH_INTERVAL) {
      return csrfToken
    }
  }

  // Create a promise for this fetch operation
  csrfTokenPromise = (async () => {
    try {
      const csrfUrl =
        import.meta.env.MODE === 'development'
          ? `${BASE_URL}/api/csrf-token`
          : '/api/csrf-token'

      const response = await fetch(csrfUrl, {
        method: 'GET',
        credentials: 'include', // Include cookies in request
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`)
      }

      const data = await response.json()
      csrfToken = data.csrfToken
      lastFetchTime = Date.now()
      return csrfToken
    } catch (error) {
      console.error('❌ Failed to fetch CSRF token:', error)
      csrfTokenPromise = null // Reset promise on error so we can retry
      lastFetchTime = null
      return null
    } finally {
      csrfTokenPromise = null
    }
  })()

  return csrfTokenPromise
}

/**
 * Get the stored CSRF token
 * @returns {string|null} - The CSRF token or null if not set
 */
export const getCsrfToken = () => {
  return csrfToken
}

/**
 * Ensure CSRF token is loaded before making authenticated requests
 * Waits for token to be fetched if it's still loading
 * Automatically refreshes if token is stale
 * SECURITY FIX: Always fetch fresh token for each request to sync with server cookies
 * @returns {Promise<string|null>} - The CSRF token or null if failed
 */
export const ensureCsrfToken = async () => {
  // Always fetch a fresh token to ensure it matches the current CSRF cookie
  // This prevents token/cookie mismatch that causes validation failures
  return fetchCsrfToken(true)
}

/**
 * Force refresh CSRF token (call this if you get a CSRF error)
 * @returns {Promise<string|null>} - The new CSRF token
 */
export const refreshCsrfToken = async () => {
  csrfToken = null
  lastFetchTime = null
  csrfTokenPromise = null
  return fetchCsrfToken(true)
}

/**
 * Set CSRF token manually (for testing or alternative flows)
 * @param {string} token - The CSRF token to set
 */
export const setCsrfToken = (token) => {
  csrfToken = token
  lastFetchTime = Date.now()
  csrfTokenPromise = null
}

/**
 * Clear CSRF token (on logout)
 */
export const clearCsrfToken = () => {
  csrfToken = null
  lastFetchTime = null
  csrfTokenPromise = null
}
