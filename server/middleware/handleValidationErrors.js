/**
 * Centralized Validation Error Middleware
 * Eliminates repeated validation error handling across all controllers
 *
 * BEFORE (repeated 20+ times across controllers):
 * const errors = validationResult(req)
 * if (!errors.isEmpty()) {
 *   return res.status(400).json({
 *     success: false,
 *     message: 'Validation failed',
 *     errors: errors.array(),
 *   })
 * }
 *
 * AFTER (just add middleware):
 * router.post('/endpoint', body(...), handleValidationErrors, controller)
 */

import { validationResult } from 'express-validator'
import { ApiResponse } from '../utils/ApiResponse.js'

/**
 * Middleware to handle express-validator validation errors
 * Automatically extracts and returns errors if present
 * Otherwise, passes control to next middleware/handler
 *
 * Usage in routes:
 * router.post(
 *   '/signup',
 *   body('email').isEmail(),
 *   body('password').isLength({ min: 8 }),
 *   handleValidationErrors,  // ← Add this
 *   signupController
 * )
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return ApiResponse.validationError(res, errors.array())
  }

  // Validation passed, proceed to handler
  next()
}

/**
 * Alternative: More flexible validation handler
 * Allows custom error messages and status codes
 *
 * Usage:
 * router.post(
 *   '/endpoint',
 *   validators,
 *   createValidationHandler({
 *     message: 'Invalid input provided',
 *     statusCode: 422,
 *   }),
 *   controller
 * )
 *
 * @param {Object} options - Configuration options
 * @param {string} options.message - Custom error message
 * @param {number} options.statusCode - Custom HTTP status code (default: 400)
 * @returns {Function} Express middleware
 */
export const createValidationHandler = (options = {}) => {
  const { message = 'Validation failed', statusCode = 400 } = options

  return (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return ApiResponse.error(res, message, statusCode, errors.array())
    }

    next()
  }
}

/**
 * Validation error handler that extracts specific field errors
 * Useful when you want to respond with field-specific errors
 *
 * Usage:
 * router.post(
 *   '/endpoint',
 *   validators,
 *   extractValidationErrors,
 *   controller
 * )
 *
 * Response format:
 * {
 *   success: false,
 *   fieldErrors: {
 *     email: ['Invalid email format'],
 *     password: ['Password too short']
 *   }
 * }
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const extractValidationErrors = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    // Group errors by field
    const fieldErrors = {}

    errors.array().forEach((error) => {
      const field = error.path || error.param
      if (!fieldErrors[field]) {
        fieldErrors[field] = []
      }
      fieldErrors[field].push(error.msg)
    })

    return res.status(400).json({
      success: false,
      fieldErrors,
      timestamp: new Date().toISOString(),
    })
  }

  next()
}

export default handleValidationErrors
