import jwt from 'jsonwebtoken'
import { logError, logInfo } from '../utilities/logger.js'
import { logAuthFailure, logAuthSuccess } from '../utilities/securityLogger.js'
import { sendUnauthorized, sendInternalError } from '../utils/ApiResponse.js'

/**
 * JWT Token Verification Middleware
 * Security: Validates JWT tokens with proper error handling
 *
 * Handles multiple failure modes:
 * - Missing token (401)
 * - Expired token (401)
 * - Invalid signature (401)
 * - Malformed token (401)
 * - Server errors (500)
 *
 * SECURITY FIX: Integrated security logging for auth failures and success
 */
export const verifyToken = (req, res, next) => {
  const token = req.cookies.token

  if (!token) {
    logInfo('auth.verifyToken', 'Token verification failed - no token provided')
    logAuthFailure('missing_token', {
      endpoint: req.path,
      ip: req.ip,
    })
    return sendUnauthorized(res, 'No token provided')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (!decoded) {
      logInfo('auth.verifyToken', 'Token verification failed - no decoded payload')
      logAuthFailure('invalid_token', {
        endpoint: req.path,
        ip: req.ip,
      })
      return sendUnauthorized(res, 'Invalid token')
    }

    req.userId = decoded.userId
    req._id = decoded._id

    // Log successful auth verification
    logAuthSuccess({
      userId: decoded.userId,
      email: decoded.email,
      endpoint: req.path,
      ip: req.ip,
      method: req.method,
    })

    next()
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      logInfo('auth.verifyToken', 'Token verification failed - token expired', {
        expiredAt: error.expiredAt,
      })
      logAuthFailure('token_expired', {
        endpoint: req.path,
        ip: req.ip,
        details: { expiredAt: error.expiredAt },
      })
      return sendUnauthorized(res, 'Token has expired')
    }

    if (error.name === 'JsonWebTokenError') {
      logInfo('auth.verifyToken', 'Token verification failed - invalid signature', {
        message: error.message,
      })
      logAuthFailure('invalid_signature', {
        endpoint: req.path,
        ip: req.ip,
        details: { message: error.message },
      })
      return sendUnauthorized(res, 'Invalid token signature')
    }

    if (error.name === 'NotBeforeError') {
      logInfo('auth.verifyToken', 'Token verification failed - token not yet valid', {
        date: error.date,
      })
      logAuthFailure('token_not_yet_valid', {
        endpoint: req.path,
        ip: req.ip,
        details: { date: error.date },
      })
      return sendUnauthorized(res, 'Token not yet valid')
    }

    // Catch-all for unexpected errors
    logError('auth.verifyToken', 'Token verification failed - unexpected error', error)
    logAuthFailure('unexpected_error', {
      endpoint: req.path,
      ip: req.ip,
      details: { error: error.message },
    })
    return sendInternalError(res, error, {
      method: req.method,
      path: req.path,
    })
  }
}
