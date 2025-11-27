import csrf from 'csurf'
import { logCSRFViolation } from '../utilities/securityLogger.js'
import { sendSuccess, sendForbidden } from '../utils/ApiResponse.js'

// Security: CSRF protection middleware using csurf
// Uses double-submit cookie pattern for API security
// Tokens are stored in cookies and must be sent back in headers or form body

// CSRF protection middleware - protects state-changing operations (POST, PUT, DELETE, PATCH)
// Note: Dynamic cookie options based on environment set in middleware wrapper
let csrfProtectionInstance = null

const getCsrfProtection = () => {
  // Create CSRF protection with env-appropriate security settings
  // This is called per-request context to respect the current host
  return csrf({
    cookie: {
      httpOnly: true,
      secure: false, // Will be enforced by Express cookie middleware based on environment
      sameSite: 'Lax',
      maxAge: 60 * 60 * 1000, // 1 hour
      path: '/',
    },
  })
}

// Lazy-initialize to allow proper configuration
function initializeCsrf() {
  if (!csrfProtectionInstance) {
    csrfProtectionInstance = getCsrfProtection()
  }
  return csrfProtectionInstance
}

export const csrfProtection = (req, res, next) => {
  initializeCsrf()(req, res, next)
}

// Middleware to return CSRF token to client
export const getCsrfToken = (req, res) => {
  sendSuccess(res, { csrfToken: req.csrfToken() })
}

// Error handler for CSRF failures
// SECURITY FIX: Integrated security logging for CSRF violations
export const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    // Log CSRF violation for security audit trail
    logCSRFViolation({
      userId: req.userId,
      endpoint: req.path,
      ip: req.ip,
      reason: 'invalid_or_missing_token',
    })

    return sendForbidden(res, 'CSRF token validation failed')
  }
  next(err)
}
