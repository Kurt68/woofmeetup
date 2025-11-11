import csrf from 'csurf'
import { logCSRFViolation } from '../utilities/securityLogger.js'

// Security: CSRF protection middleware using csurf
// Uses double-submit cookie pattern for API security
// Tokens are stored in cookies and must be sent back in headers or form body

// CSRF protection middleware - protects state-changing operations (POST, PUT, DELETE, PATCH)
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 60 * 60 * 1000, // 1 hour
    path: '/',
  },
})

// Middleware to return CSRF token to client
export const getCsrfToken = (req, res) => {
  res.json({
    success: true,
    csrfToken: req.csrfToken(),
  })
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

    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed - request rejected',
      code: 'CSRF_TOKEN_INVALID',
    })
  }
  next(err)
}
