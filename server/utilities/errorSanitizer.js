/**
 * Error Sanitizer Utility
 * Prevents sensitive information leakage in error responses
 * Maps implementation errors to generic client-safe messages
 */

import { logError } from './logger.js'

/**
 * Sanitize error message for client response
 * Removes stack traces and implementation details
 *
 * @param {Error} error - The error object to sanitize
 * @param {string} context - The context where error occurred (for logging)
 * @returns {string} - Generic error message safe for client
 */
export const sanitizeErrorMessage = (error, context = 'unknown') => {
  if (!error) {
    return 'An error occurred'
  }

  // Log the actual error for debugging (already sanitized by logger)
  if (error.message) {
    logError('errorSanitizer', `Original error in ${context}`, error)
  }

  // Map specific error types to generic messages
  const message = error.message || error.toString()

  // Database connection errors
  if (
    message.includes('MongooseError') ||
    message.includes('MongoDB') ||
    message.includes('Connection')
  ) {
    return 'Database error occurred'
  }

  // Authentication/JWT errors
  if (message.includes('JWT') || message.includes('jwt') || message.includes('token')) {
    return 'Authentication error'
  }

  // File system errors
  if (message.includes('ENOENT') || message.includes('EACCES') || message.includes('File')) {
    return 'File operation failed'
  }

  // External service errors (AWS, Stripe, etc.)
  if (
    message.includes('AWS') ||
    message.includes('Stripe') ||
    message.includes('API') ||
    message.includes('HTTP')
  ) {
    return 'External service error'
  }

  // Email service errors
  if (message.includes('Mailtrap') || message.includes('SMTP') || message.includes('Email')) {
    return 'Email service error'
  }

  // Validation errors - allow these to be more specific
  if (message.includes('validation') || message.includes('Validation')) {
    return 'Validation error'
  }

  // Default generic message
  return 'An error occurred'
}

/**
 * Create a sanitized error response for API endpoints
 * Always returns consistent error structure without leaking details
 *
 * @param {Error} error - The error object
 * @param {string} context - Where the error occurred
 * @param {number} statusCode - HTTP status code (default: 500)
 * @returns {object} - Sanitized error response object
 */
export const createSanitizedErrorResponse = (error, context = 'unknown', statusCode = 500) => {
  return {
    success: false,
    message: sanitizeErrorMessage(error, context),
    status: statusCode,
  }
}
