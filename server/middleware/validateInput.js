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
      return res.status(400).json({
        success: false,
        message: 'Invalid input format',
        error: error.message,
      })
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
      return res.status(400).json({
        success: false,
        message: 'Invalid input format',
        error: error.message,
      })
    }
  }
}

/**
 * Middleware to validate user IDs from request body
 * Protects against NoSQL injection via POST/PUT body
 */
export const validateBodyUserIds = (
  fieldNames = ['userId', 'matchedUserId']
) => {
  return (req, res, next) => {
    try {
      for (const fieldName of fieldNames) {
        if (req.body[fieldName]) {
          validateUserId(req.body[fieldName], fieldName)
        }
      }
      next()
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input format',
        error: error.message,
      })
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
        throw new Error(`${fieldName} is required`)
      }

      if (!isSafeString(email)) {
        throw new Error(`Invalid ${fieldName} format`)
      }

      if (!isValidEmail(email)) {
        throw new Error(`Invalid email format`)
      }

      next()
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: error.message,
      })
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
      return res.status(400).json({
        success: false,
        message: 'Invalid input format',
        error: error.message,
      })
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
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters',
          error: 'limit must be a positive integer',
        })
      }

      if (isNaN(validatedSkip) || validatedSkip < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters',
          error: 'skip must be a non-negative integer',
        })
      }

      // Enforce maximum limit to prevent abuse
      if (validatedLimit > maxLimit) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters',
          error: `limit cannot exceed ${maxLimit}`,
        })
      }

      // Attach validated values to request for use in controllers
      req.pagination = {
        limit: validatedLimit,
        skip: validatedSkip,
      }

      next()
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters',
        error: error.message,
      })
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
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          error: `${fieldName} must be a valid number`,
        })
      }

      // Check range bounds
      if (parsedValue < min || parsedValue > max) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          error: `${fieldName} must be between ${min} and ${max}`,
        })
      }

      // Attach validated value to request
      req.validatedQuery = req.validatedQuery || {}
      req.validatedQuery[queryParamName] = parsedValue

      next()
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        error: error.message,
      })
    }
  }
}
