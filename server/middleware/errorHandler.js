/**
 * Centralized Error Response Handler
 * Ensures all API errors follow a consistent format: { success: false, message, error: true }
 * All errors are sanitized to prevent sensitive data leakage
 *
 * SECURITY: Fix #10 - Reduces error message verbosity to prevent information disclosure
 * - Sanitizes error messages before sending to clients
 * - Detailed error logging happens server-side for debugging
 * - Clients receive generic, non-revealing messages
 */

import { logError } from '../utilities/logger.js'
import { sanitizeErrorMessage } from '../utilities/errorSanitizer.js'

export const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: true,
  })
}

export const handleAsyncError = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      logError(
        'errorHandler.middleware',
        `[${req.method} ${req.path}] Request error`,
        err
      )

      // SECURITY: Sanitize error message to prevent information disclosure
      const sanitizedMessage = sanitizeErrorMessage(
        err,
        `${req.method} ${req.path}`
      )

      sendError(res, err.statusCode || 500, sanitizedMessage)
    })
  }
}
