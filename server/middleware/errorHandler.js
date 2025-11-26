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
import { sendInternalError, sendError } from '../utils/ApiResponse.js'

export const handleAsyncError = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      logError('errorHandler.middleware', `[${req.method} ${req.path}] Request error`, err)

      if (err.statusCode && err.statusCode !== 500) {
        return sendError(res, err.message, err.statusCode)
      }

      return sendInternalError(res, err, {
        method: req.method,
        path: req.path,
      })
    })
  }
}
