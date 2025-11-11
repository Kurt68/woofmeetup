/**
 * Standardized API Response Wrapper
 * Ensures all API endpoints return consistent response format
 * Eliminates response format inconsistencies across controllers
 *
 * Standard Format:
 * {
 *   success: boolean,
 *   data?: any,
 *   message?: string,
 *   errors?: array,
 *   timestamp: ISO string,
 *   pagination?: { page, limit, total, pages }
 * }
 */

import { sanitizeErrorMessage } from '../utilities/errorSanitizer.js'
import { logError } from '../utilities/logger.js'

/**
 * Send successful response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Optional message
 * @param {number} statusCode - HTTP status code (default 200)
 */
export const sendSuccess = (res, data, message = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
    timestamp: new Date().toISOString(),
  })
}

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {number} page - Current page (1-indexed)
 * @param {number} limit - Items per page
 * @param {number} total - Total items count
 * @param {string} message - Optional message
 */
export const sendPaginated = (
  res,
  data,
  page,
  limit,
  total,
  message = null
) => {
  const pages = Math.ceil(total / limit)

  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages,
      hasNextPage: page < pages,
      hasPrevPage: page > 1,
    },
    ...(message && { message }),
    timestamp: new Date().toISOString(),
  })
}

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message (non-sensitive)
 * @param {number} statusCode - HTTP status code
 * @param {Array} errors - Optional validation errors array
 */
export const sendError = (res, message, statusCode = 400, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString(),
  })
}

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array} validationErrors - express-validator errors array
 * @param {string} message - Optional override message
 */
export const sendValidationError = (
  res,
  validationErrors,
  message = 'Validation failed'
) => {
  return sendError(res, message, 400, validationErrors)
}

/**
 * Send internal server error response (sanitized)
 * @param {Object} res - Express response object
 * @param {Error} error - Original error object (will be sanitized)
 * @param {Object} context - Context for logging { method, path, userId }
 */
export const sendInternalError = (res, error, context = {}) => {
  // Log full error server-side for debugging
  logError(
    'ApiResponse',
    `Internal server error [${context.method} ${context.path}]`,
    error
  )

  // Sanitize message before sending to client (prevent info disclosure)
  const sanitizedMessage = sanitizeErrorMessage(error)

  return sendError(res, sanitizedMessage, 500)
}

/**
 * Send unauthorized error response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message (default: 'Unauthorized')
 */
export const sendUnauthorized = (res, message = 'Unauthorized') => {
  return sendError(res, message, 401)
}

/**
 * Send forbidden error response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message (default: 'Access denied')
 */
export const sendForbidden = (res, message = 'Access denied') => {
  return sendError(res, message, 403)
}

/**
 * Send not found error response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name that wasn't found
 */
export const sendNotFound = (res, resource = 'Resource') => {
  return sendError(res, `${resource} not found`, 404)
}

/**
 * Send conflict error response (e.g., user already exists)
 * @param {Object} res - Express response object
 * @param {string} message - Custom message
 */
export const sendConflict = (res, message) => {
  return sendError(res, message, 409)
}

/**
 * Send rate limit error response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message
 * @param {number} retryAfter - Seconds to wait before retrying (optional)
 */
export const sendRateLimitError = (res, message, retryAfter = null) => {
  const response = res.status(429).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
  })

  if (retryAfter) {
    res.set('Retry-After', retryAfter)
  }

  return response
}

/**
 * Higher-order function to wrap async handlers with error handling
 * Automatically catches errors and sends appropriate response
 *
 * @param {Function} fn - Async handler function
 * @returns {Function} Wrapped handler
 *
 * Usage:
 * router.post('/users', wrapHandler(async (req, res) => {
 *   const user = await User.findById(req.body.id)
 *   if (!user) {
 *     throw new NotFoundError('User not found')
 *   }
 *   sendSuccess(res, user, 'User retrieved')
 * }))
 */
export const wrapHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      // Handle different error types
      if (err.statusCode) {
        return sendError(res, err.message, err.statusCode)
      }

      // Default: internal server error
      return sendInternalError(res, err, {
        method: req.method,
        path: req.path,
        userId: req._id,
      })
    })
  }
}

/**
 * Convenience export for destructuring
 */
export const ApiResponse = {
  success: sendSuccess,
  paginated: sendPaginated,
  error: sendError,
  validationError: sendValidationError,
  internalError: sendInternalError,
  unauthorized: sendUnauthorized,
  forbidden: sendForbidden,
  notFound: sendNotFound,
  conflict: sendConflict,
  rateLimitError: sendRateLimitError,
  wrap: wrapHandler,
}

export default ApiResponse
