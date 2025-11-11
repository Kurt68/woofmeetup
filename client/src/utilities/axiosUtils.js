/**
 * Centralized Axios Error Handling Utility
 * Extracts error messages from axios responses consistently
 * DRY principle - replaces repeated error.response?.data?.message pattern
 */

/**
 * Extract error message from axios error object
 * @param {Error} error - The axios error object
 * @param {string} defaultMsg - Fallback message if extraction fails
 * @returns {string} - The extracted or default error message
 */
export const getErrorMessage = (error, defaultMsg = 'An error occurred') => {
  // Priority: API response message > first validation error > error message > default message

  // Check for validation errors and extract first error message
  if (
    error?.response?.data?.errors &&
    Array.isArray(error.response.data.errors)
  ) {
    const firstError = error.response.data.errors[0]
    if (firstError?.msg) {
      return firstError.msg
    }
  }

  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  if (error?.response?.data?.error) {
    return error.response.data.error
  }
  if (error?.message) {
    return error.message
  }
  return defaultMsg
}

/**
 * Check if error is due to network/connection issues
 * @param {Error} error - The axios error object
 * @returns {boolean}
 */
export const isNetworkError = (error) => {
  return !error?.response || error.message === 'Network Error'
}

/**
 * Check if error is a 401 Unauthorized (auth failure)
 * @param {Error} error - The axios error object
 * @returns {boolean}
 */
export const isAuthError = (error) => {
  return error?.response?.status === 401
}

/**
 * Check if error is a 403 Forbidden (insufficient permissions)
 * @param {Error} error - The axios error object
 * @returns {boolean}
 */
export const isForbiddenError = (error) => {
  return error?.response?.status === 403
}

/**
 * Check if error is a rate limit (429 Too Many Requests)
 * @param {Error} error - The axios error object
 * @returns {boolean}
 */
export const isRateLimitError = (error) => {
  return error?.response?.status === 429
}
