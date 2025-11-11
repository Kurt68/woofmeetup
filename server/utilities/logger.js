/**
 * Centralized Server Logger Utility
 * Provides consistent logging format across all server controllers and services
 * Supports: info, success, warning, error levels
 *
 * SECURITY: All logging is sanitized to prevent exposure of:
 * - User IDs, emails, passwords
 * - Auth tokens, API keys
 * - Payment information
 * - Error stack traces (in production)
 */

import {
  sanitizeObject,
  sanitizeError,
  partiallyRedact,
} from './logSanitizer.js'

const LOG_LEVELS = {
  INFO: '📘',
  SUCCESS: '✅',
  WARNING: '⚠️',
  ERROR: '🔴',
}

/**
 * Format log message with timestamp and level
 * Sanitizes data to prevent sensitive information leakage
 */
const formatLog = (level, context, message, data = null) => {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] ${level} [${context}] ${message}`
  const sanitizedData = data ? sanitizeObject(data) : null
  return { logEntry, sanitizedData }
}

/**
 * Log info message
 * @param {string} context - Context/module name (e.g., 'auth.controller')
 * @param {string} message - Log message
 * @param {*} data - Optional additional data (automatically sanitized)
 */
export const logInfo = (context, message, data = null) => {
  const { logEntry, sanitizedData } = formatLog(
    LOG_LEVELS.INFO,
    context,
    message,
    data
  )
  console.log(logEntry, sanitizedData ? sanitizedData : '')
}

/**
 * Log success message
 * @param {string} context - Context/module name
 * @param {string} message - Log message
 * @param {*} data - Optional additional data (automatically sanitized)
 */
export const logSuccess = (context, message, data = null) => {
  const { logEntry, sanitizedData } = formatLog(
    LOG_LEVELS.SUCCESS,
    context,
    message,
    data
  )
  console.log(logEntry, sanitizedData ? sanitizedData : '')
}

/**
 * Log warning message
 * @param {string} context - Context/module name
 * @param {string} message - Log message
 * @param {*} data - Optional additional data (automatically sanitized)
 */
export const logWarning = (context, message, data = null) => {
  const { logEntry, sanitizedData } = formatLog(
    LOG_LEVELS.WARNING,
    context,
    message,
    data
  )
  console.warn(logEntry, sanitizedData ? sanitizedData : '')
}

/**
 * Log error message with stack trace
 * Sanitizes error messages and stack traces to prevent sensitive data leakage
 * @param {string} context - Context/module name
 * @param {string} message - Log message
 * @param {Error} error - Error object (automatically sanitized)
 * @param {*} additionalData - Optional additional data (automatically sanitized)
 */
export const logError = (context, message, error, additionalData = null) => {
  const { logEntry } = formatLog(LOG_LEVELS.ERROR, context, message)
  console.error(logEntry)

  // Sanitize the error object
  const sanitizedError = sanitizeError(error)

  console.error(`  Name: ${sanitizedError.name}`)
  console.error(`  Message: ${sanitizedError.message}`)

  // Only include stack trace in development, and with redacted paths
  if (sanitizedError.stack) {
    console.error(`  Stack: ${sanitizedError.stack}`)
  }

  // Sanitize additional data
  if (additionalData) {
    const sanitizedAdditionalData = sanitizeObject(additionalData)
    console.error(`  Data:`, sanitizedAdditionalData)
  }
}

/**
 * Log Socket.IO event
 * User IDs are partially redacted for security
 * @param {string} event - Event name
 * @param {string} userId - User ID (will be partially redacted)
 * @param {string} socketId - Socket ID (will be partially redacted)
 */
export const logSocketEvent = (event, userId, socketId) => {
  const maskedUserId = partiallyRedact(userId, 4)
  const maskedSocketId = partiallyRedact(socketId, 4)
  logInfo(
    'socket.io',
    `${event} - userId: ${maskedUserId}, socketId: ${maskedSocketId}`
  )
}

/**
 * Log Socket.IO error
 * User IDs are partially redacted for security
 * @param {string} userId - User ID (will be partially redacted)
 * @param {Error} error - Error object (will be sanitized)
 */
export const logSocketError = (userId, error) => {
  const maskedUserId = partiallyRedact(userId, 4)
  logError('socket.io', `Socket error for userId: ${maskedUserId}`, error)
}
