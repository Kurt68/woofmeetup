/**
 * NoSQL Injection Prevention Utilities
 * Validates and sanitizes user input to prevent NoSQL injection attacks
 */

import mongoose from 'mongoose'
import { logWarning } from './logger.js'
import { AppError } from './AppError.js'
import { ErrorCodes } from '../constants/errorCodes.js'

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param {*} id - The value to validate
 * @returns {boolean} - True if valid ObjectId format
 */
export const isValidObjectId = (id) => {
  if (!id) {
    return false
  }
  return mongoose.Types.ObjectId.isValid(id)
}

/**
 * Validates if a string is a valid UUID v4 format (used for user_id)
 * @param {*} id - The value to validate
 * @returns {boolean} - True if valid UUID v4 format
 */
export const isValidUUID = (id) => {
  if (typeof id !== 'string') {
    return false
  }
  const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidv4Regex.test(id)
}

/**
 * Validates if input is a string (not an object, array, or NoSQL operator)
 * Prevents operators like {$ne: null}, {$regex: "..."}, etc.
 * @param {*} input - The value to validate
 * @returns {boolean} - True if input is a safe string
 */
export const isSafeString = (input) => {
  // Must be a string, not an object or array
  if (typeof input !== 'string') {
    return false
  }

  // Check for common NoSQL operators
  const dangerousPatterns = [
    /^\s*{/, // Starts with {
    /^\s*\[/, // Starts with [
    /\$\w+/, // Contains $operators like $ne, $regex, $where, etc.
    /;\s*(drop|delete|update|insert)/i, // SQL injection patterns that might be used
  ]

  return !dangerousPatterns.some((pattern) => pattern.test(input))
}

/**
 * Sanitizes and validates a user ID (either MongoDB ObjectId or UUID)
 * Throws error if invalid format
 * @param {*} id - The ID to validate
 * @param {string} fieldName - Name of field for error messages
 * @returns {string} - The validated ID
 * @throws {AppError} - If ID format is invalid
 */
export const validateUserId = (id, fieldName = 'userId') => {
  if (!id) {
    throw AppError.badRequest(ErrorCodes.INVALID_INPUT, {
      field: fieldName,
      reason: 'required',
    })
  }

  if (!isSafeString(id)) {
    throw AppError.badRequest(ErrorCodes.INVALID_INPUT, {
      field: fieldName,
      reason: 'unsafe_format',
    })
  }

  // Accept both MongoDB ObjectId and UUID formats
  if (!isValidObjectId(id) && !isValidUUID(id)) {
    throw AppError.badRequest(ErrorCodes.INVALID_INPUT, {
      field: fieldName,
      reason: 'invalid_id_format',
    })
  }

  return id
}

/**
 * Sanitizes an email address
 * @param {*} email - The email to validate
 * @returns {boolean} - True if valid email format
 */
export const isValidEmail = (email) => {
  if (typeof email !== 'string') {
    return false
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * Removes dangerous characters and NoSQL operators from objects
 * Used as a last-resort sanitization for complex nested objects
 * @param {*} obj - Object to sanitize
 * @returns {object} - Sanitized object
 */
export const sanitizeObject = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  const sanitized = {}

  for (const key in obj) {
    // Skip keys that start with $ (NoSQL operators)
    if (key.startsWith('$')) {
      logWarning('sanitizeInput', `Blocked attempt to use NoSQL operator: ${key}`)
      continue
    }

    const value = obj[key]

    // Recursively sanitize nested objects
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        item !== null && typeof item === 'object' ? sanitizeObject(item) : item
      )
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Validates pagination parameters to prevent NoSQL injection via limit/skip
 * @param {*} limit - The limit parameter
 * @param {*} skip - The skip parameter
 * @param {number} maxLimit - Maximum allowed limit (default: 100)
 * @returns {object} - Validated pagination object {limit, skip}
 */
export const validatePagination = (limit = 10, skip = 0, maxLimit = 100) => {
  let validatedLimit = parseInt(limit, 10)
  let validatedSkip = parseInt(skip, 10)

  // Check if values are valid numbers
  if (isNaN(validatedLimit) || validatedLimit < 1) {
    validatedLimit = 10
  }
  if (isNaN(validatedSkip) || validatedSkip < 0) {
    validatedSkip = 0
  }

  // Enforce maximum limit to prevent abuse
  if (validatedLimit > maxLimit) {
    validatedLimit = maxLimit
  }

  return { limit: validatedLimit, skip: validatedSkip }
}

/**
 * Validates password reset token format
 * Reset tokens are hex strings created from randomBytes(20).toString('hex')
 * Expected format: 40-character hexadecimal string
 * Prevents NoSQL injection via token parameter
 * @param {*} token - The token to validate
 * @param {string} fieldName - Name of field for error messages
 * @returns {string} - The validated token
 * @throws {AppError} - If token format is invalid
 */
export const validateResetToken = (token, fieldName = 'resetToken') => {
  if (!token) {
    throw AppError.badRequest(ErrorCodes.INVALID_INPUT, {
      field: fieldName,
      reason: 'required',
    })
  }

  if (typeof token !== 'string') {
    throw AppError.badRequest(ErrorCodes.INVALID_INPUT, {
      field: fieldName,
      reason: 'must_be_string',
    })
  }

  // Reset tokens are 40-char hex strings: randomBytes(20).toString('hex')
  const hexTokenRegex = /^[a-f0-9]{40}$/i
  if (!hexTokenRegex.test(token)) {
    throw AppError.badRequest(ErrorCodes.INVALID_INPUT, {
      field: fieldName,
      reason: 'invalid_token_format',
    })
  }

  return token
}

/**
 * SECURITY: Validates redirect URLs to prevent open redirect attacks
 * Ensures URL path contains only safe characters (no embedded protocols, javascript:, etc)
 * Validates that URLs contain no dangerous patterns that could be exploited
 * @param {string} redirectUrl - The full redirect URL to validate
 * @returns {boolean} - True if URL is safe
 * @throws {AppError} - If URL contains dangerous patterns
 */
export const validateRedirectUrl = (redirectUrl) => {
  if (!redirectUrl || typeof redirectUrl !== 'string') {
    throw AppError.badRequest(ErrorCodes.INVALID_INPUT, {
      field: 'redirectUrl',
      reason: 'required_non_empty_string',
    })
  }

  try {
    // Parse the URL to validate structure
    const url = new URL(redirectUrl)

    // Ensure protocol is http or https only
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw AppError.badRequest(ErrorCodes.INVALID_INPUT, {
        field: 'redirectUrl',
        reason: 'invalid_protocol',
      })
    }

    // Check for dangerous patterns in pathname and search
    const dangerousPatterns = [
      /javascript:/i, // JavaScript protocol injection
      /data:/i, // Data URL injection
      /vbscript:/i, // VBScript protocol
      /on\w+\s*=/i, // Event handler attributes
      /<script/i, // Script tags
      // eslint-disable-next-line no-control-regex
      /[\x00-\x1f\x7f]/, // Control characters
      /[<>]/, // Angle brackets
    ]

    const _fullUrl = url.href
    const pathAndSearch = url.pathname + url.search + url.hash

    for (const pattern of dangerousPatterns) {
      if (pattern.test(pathAndSearch)) {
        throw AppError.badRequest(ErrorCodes.INVALID_INPUT, {
          field: 'redirectUrl',
          reason: 'dangerous_characters',
        })
      }
    }

    // Ensure URL doesn't have multiple forward slashes that could bypass validation
    // Allow // only for protocol (http:// or https://)
    if (pathAndSearch.includes('//')) {
      throw AppError.badRequest(ErrorCodes.INVALID_INPUT, {
        field: 'redirectUrl',
        reason: 'invalid_path',
      })
    }

    return true
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    if (error.message.startsWith('Invalid URL')) {
      throw AppError.badRequest(ErrorCodes.INVALID_INPUT, {
        field: 'redirectUrl',
        reason: 'malformed_url',
      })
    }
    throw error
  }
}
