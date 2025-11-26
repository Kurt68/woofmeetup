/**
 * Input Validation Middleware
 * Prevents NoSQL injection and other input-based attacks
 */

import {
  validateUserId,
  isSafeString,
  isValidEmail,
  validateResetToken,
} from '../utilities/sanitizeInput.js'
import { sendValidationError, sendError } from '../utils/ApiResponse.js'
import { AppError } from '../utilities/AppError.js'
import { ErrorCodes } from '../constants/errorCodes.js'

/**
 * Middleware to validate user ID from request parameters
 * Protects against NoSQL injection via URL parameters
 */
export const validateParamUserId = (paramName = 'id') => {
  return (req, res, next) => {
    try {
      const userId = req.params[paramName]
      validateUserId(userId, `param.${paramName}`)
      next()
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode, error.details)
      }
      return sendValidationError(
        res,
        [{ path: paramName, msg: error.message }],
        'Invalid input format'
      )
    }
  }
}

/**
 * Middleware to validate user ID from query string parameters
 * Protects against NoSQL injection via query parameters
 * @param {string} queryParamName - The query parameter name (default: 'userId')
 */
export const validateQueryUserId = (queryParamName = 'userId') => {
  return (req, res, next) => {
    try {
      const userId = req.query[queryParamName]
      // Only validate if userId is provided (optional parameter)
      if (userId) {
        validateUserId(userId, `query.${queryParamName}`)
      }
      next()
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode, error.details)
      }
      return sendValidationError(
        res,
        [{ path: queryParamName, msg: error.message }],
        'Invalid input format'
      )
    }
  }
}

/**
 * Middleware to validate user IDs from request body
 * Protects against NoSQL injection via POST/PUT body
 */
export const validateBodyUserIds = (fieldNames = ['userId', 'matchedUserId']) => {
  return (req, res, next) => {
    try {
      for (const fieldName of fieldNames) {
        if (req.body[fieldName]) {
          validateUserId(req.body[fieldName], fieldName)
        }
      }
      next()
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode, error.details)
      }
      return sendValidationError(
        res,
        [{ path: 'body', msg: error.message }],
        'Invalid input format'
      )
    }
  }
}

/**
 * Middleware to validate email format
 */
export const validateEmailInput = (fieldName = 'email') => {
  return (req, res, next) => {
    try {
      const email = req.body[fieldName]

      if (!email) {
        throw AppError.badRequest(ErrorCodes.INVALID_INPUT, {
          field: fieldName,
          reason: 'required',
        })
      }

      if (!isSafeString(email)) {
        throw AppError.badRequest(ErrorCodes.INVALID_INPUT, {
          field: fieldName,
          reason: 'unsafe_format',
        })
      }

      if (!isValidEmail(email)) {
        throw AppError.badRequest(ErrorCodes.INVALID_INPUT, {
          field: fieldName,
          reason: 'invalid_email_format',
        })
      }

      next()
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode, error.details)
      }
      return sendValidationError(
        res,
        [{ path: fieldName, msg: error.message }],
        'Invalid email format'
      )
    }
  }
}

/**
 * Middleware to validate password reset token from URL parameters
 * Prevents NoSQL injection via reset token parameter
 * Reset tokens must be 40-character hexadecimal strings
 * @param {string} paramName - The URL parameter name (default: 'token')
 */
export const validateResetTokenParam = (paramName = 'token') => {
  return (req, res, next) => {
    try {
      const token = req.params[paramName]
      validateResetToken(token, `param.${paramName}`)
      next()
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode, error.details)
      }
      return sendValidationError(
        res,
        [{ path: paramName, msg: error.message }],
        'Invalid input format'
      )
    }
  }
}

/**
 * Middleware to validate pagination parameters from query string
 * Prevents NoSQL injection via limit/skip parameters
 * Prevents DoS attacks via excessive pagination sizes
 * @param {number} maxLimit - Maximum allowed limit (default: 100)
 */
export const validatePaginationParams = (maxLimit = 100) => {
  return (req, res, next) => {
    try {
      const { limit = 10, skip = 0 } = req.query

      // Validate limit and skip are valid integers
      const validatedLimit = parseInt(limit, 10)
      const validatedSkip = parseInt(skip, 10)

      // Check if values are valid numbers
      if (isNaN(validatedLimit) || validatedLimit < 1) {
        return sendValidationError(
          res,
          [{ path: 'limit', msg: 'limit must be a positive integer' }],
          'Invalid pagination parameters'
        )
      }

      if (isNaN(validatedSkip) || validatedSkip < 0) {
        return sendValidationError(
          res,
          [{ path: 'skip', msg: 'skip must be a non-negative integer' }],
          'Invalid pagination parameters'
        )
      }

      // Enforce maximum limit to prevent abuse
      if (validatedLimit > maxLimit) {
        return sendValidationError(
          res,
          [{ path: 'limit', msg: `limit cannot exceed ${maxLimit}` }],
          'Invalid pagination parameters'
        )
      }

      // Attach validated values to request for use in controllers
      req.pagination = {
        limit: validatedLimit,
        skip: validatedSkip,
      }

      next()
    } catch (error) {
      return sendValidationError(
        res,
        [{ path: 'pagination', msg: error.message }],
        'Invalid pagination parameters'
      )
    }
  }
}

/**
 * Middleware to validate numeric range query parameters
 * Prevents DoS attacks via extreme values and injection attacks
 * @param {string} queryParamName - Query parameter name to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {string} fieldName - Display name for error messages
 */
export const validateNumericRangeQuery = (
  queryParamName = 'distance',
  min = 1,
  max = 500,
  fieldName = 'Distance'
) => {
  return (req, res, next) => {
    try {
      const value = req.query[queryParamName]

      // Skip validation if parameter not provided
      if (!value) {
        return next()
      }

      // Parse as integer
      const parsedValue = parseInt(value, 10)

      // Check if valid number
      if (isNaN(parsedValue)) {
        return sendValidationError(
          res,
          [{ path: queryParamName, msg: `${fieldName} must be a valid number` }],
          'Invalid query parameters'
        )
      }

      // Check range bounds
      if (parsedValue < min || parsedValue > max) {
        return sendValidationError(
          res,
          [{ path: queryParamName, msg: `${fieldName} must be between ${min} and ${max}` }],
          'Invalid query parameters'
        )
      }

      // Attach validated value to request
      req.validatedQuery = req.validatedQuery || {}
      req.validatedQuery[queryParamName] = parsedValue

      next()
    } catch (error) {
      return sendValidationError(
        res,
        [{ path: queryParamName, msg: error.message }],
        'Invalid query parameters'
      )
    }
  }
}
