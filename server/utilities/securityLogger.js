/**
 * Security Event Logger
 * MEDIUM SECURITY FIX: Centralized logging and alerting for security events
 * Logs authentication failures, authorization failures, rate limiting, CSRF violations, and suspicious patterns
 *
 * Events Tracked:
 * - Authentication failures (invalid credentials, expired tokens, missing tokens)
 * - Authorization failures (insufficient permissions, IDOR attempts)
 * - Rate limit exceeded events
 * - CSRF token validation failures
 * - Suspicious patterns (potential brute force, scanning, injection attempts)
 * - Login success (for audit trail)
 * - Account deletions
 */

import { logError, logWarning, logInfo } from './logger.js'
import { partiallyRedact } from './logSanitizer.js'

// Note: logError is already imported and used above for security alerts

const SECURITY_EVENT_TYPES = {
  AUTH_FAILURE: 'AUTH_FAILURE',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_EXPIRED_TOKEN: 'AUTH_EXPIRED_TOKEN',
  AUTH_INVALID_SIGNATURE: 'AUTH_INVALID_SIGNATURE',
  AUTH_MISSING_TOKEN: 'AUTH_MISSING_TOKEN',
  AUTHZ_DENIED: 'AUTHZ_DENIED',
  AUTHZ_IDOR_ATTEMPT: 'AUTHZ_IDOR_ATTEMPT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CSRF_VIOLATION: 'CSRF_VIOLATION',
  SUSPICIOUS_PATTERN: 'SUSPICIOUS_PATTERN',
  INPUT_VALIDATION_FAILURE: 'INPUT_VALIDATION_FAILURE',
  ACCOUNT_DELETION: 'ACCOUNT_DELETION',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  MALICIOUS_PAYLOAD_DETECTED: 'MALICIOUS_PAYLOAD_DETECTED',
}

/**
 * Log an authentication failure
 * @param {string} reason - Reason for failure (e.g., 'invalid_credentials', 'token_expired')
 * @param {object} context - Additional context (userId, email, endpoint, ip)
 */
export function logAuthFailure(reason, context = {}) {
  const { userId, email, endpoint, ip, details } = context

  const maskedUserId = userId ? partiallyRedact(userId, 4) : 'unknown'
  const maskedEmail = email ? partiallyRedact(email, 3) : 'unknown'

  logWarning('security', `Authentication failure: ${reason}`, {
    eventType: SECURITY_EVENT_TYPES.AUTH_FAILURE,
    reason,
    userId: maskedUserId,
    email: maskedEmail,
    endpoint,
    ip,
    timestamp: new Date().toISOString(),
    details,
  })

  // Alert if this is a critical failure
  if (reason === 'multiple_failed_attempts') {
    logError(
      'security',
      `Multiple failed authentication attempts detected for ${maskedEmail}`,
      null
    )
  }
}

/**
 * Log a successful authentication (login)
 * @param {object} context - Authentication context
 */
export function logAuthSuccess(context = {}) {
  const { userId, email, endpoint, ip, method } = context

  const maskedUserId = userId ? partiallyRedact(userId, 4) : 'unknown'
  const maskedEmail = email ? partiallyRedact(email, 3) : 'unknown'

  logInfo('security', `Authentication success for ${maskedEmail}`, {
    eventType: SECURITY_EVENT_TYPES.AUTH_SUCCESS,
    userId: maskedUserId,
    email: maskedEmail,
    endpoint,
    ip,
    method,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Log an authorization failure (access denied)
 * @param {string} reason - Reason for denial
 * @param {object} context - Context including userId, endpoint, attempted_action
 */
export function logAuthzFailure(reason, context = {}) {
  const { userId, endpoint, attemptedAction, targetResource, ip } = context

  const maskedUserId = userId ? partiallyRedact(userId, 4) : 'unknown'

  // IDOR attempts warrant extra attention
  const isIdorAttempt = reason === 'idor_attempt' || reason?.includes('different_user')
  const eventType = isIdorAttempt
    ? SECURITY_EVENT_TYPES.AUTHZ_IDOR_ATTEMPT
    : SECURITY_EVENT_TYPES.AUTHZ_DENIED

  logWarning('security', `Authorization denied: ${reason}`, {
    eventType,
    reason,
    userId: maskedUserId,
    endpoint,
    attemptedAction,
    targetResource,
    ip,
    timestamp: new Date().toISOString(),
  })

  // Alert on IDOR attempts
  if (isIdorAttempt) {
    logError(
      'security',
      `Potential IDOR attempt detected for user ${maskedUserId} on endpoint ${endpoint}`,
      null
    )
  }
}

/**
 * Log rate limit exceeded event
 * @param {object} context - Rate limit context
 */
export function logRateLimitExceeded(context = {}) {
  const { userId, endpoint, ip, limit, window, currentCount } = context

  const maskedUserId = userId ? partiallyRedact(userId, 4) : 'unknown'

  logWarning('security', `Rate limit exceeded for endpoint ${endpoint}`, {
    eventType: SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED,
    userId: maskedUserId,
    endpoint,
    ip,
    limit,
    windowMs: window,
    currentCount,
    timestamp: new Date().toISOString(),
  })

  // Alert if multiple endpoints are being rate limited (potential scanning/attack)
  if (currentCount > limit * 2) {
    logError(
      'security',
      `High rate limit violation from ${ip} on ${endpoint} (${currentCount}/${limit} requests)`,
      null
    )
  }
}

/**
 * Log CSRF token validation failure
 * @param {object} context - CSRF context
 */
export function logCSRFViolation(context = {}) {
  const { userId, endpoint, ip, reason } = context

  const maskedUserId = userId ? partiallyRedact(userId, 4) : 'unknown'

  logWarning('security', `CSRF token validation failed on ${endpoint}`, {
    eventType: SECURITY_EVENT_TYPES.CSRF_VIOLATION,
    userId: maskedUserId,
    endpoint,
    ip,
    reason,
    timestamp: new Date().toISOString(),
  })

  // Alert on CSRF violations (potential XSS or cross-site attack)
  logError('security', `CSRF violation from ${ip} on endpoint ${endpoint}`, null)
}

/**
 * Log suspicious pattern detection
 * @param {string} pattern - Pattern type (e.g., 'sql_injection', 'xss_attempt', 'brute_force')
 * @param {object} context - Pattern context
 */
export function logSuspiciousPattern(pattern, context = {}) {
  const { userId, endpoint, ip, payload, details } = context

  const maskedUserId = userId ? partiallyRedact(userId, 4) : 'unknown'

  logError('security', `Suspicious pattern detected: ${pattern}`, null, {
    eventType: SECURITY_EVENT_TYPES.SUSPICIOUS_PATTERN,
    pattern,
    userId: maskedUserId,
    endpoint,
    ip,
    payload: payload ? '[REDACTED]' : undefined,
    timestamp: new Date().toISOString(),
    details,
  })

  // Alert on any suspicious pattern
  logError('security', `Suspicious pattern "${pattern}" from ${ip} on endpoint ${endpoint}`, null)
}

/**
 * Log input validation failure
 * @param {object} context - Validation context
 */
export function logInputValidationFailure(context = {}) {
  const { userId, endpoint, ip, field, reason, attemptedValue } = context

  const maskedUserId = userId ? partiallyRedact(userId, 4) : 'unknown'

  logWarning('security', `Input validation failed on ${endpoint}`, {
    eventType: SECURITY_EVENT_TYPES.INPUT_VALIDATION_FAILURE,
    userId: maskedUserId,
    endpoint,
    ip,
    field,
    reason,
    attemptedValue: attemptedValue ? '[REDACTED]' : undefined,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Log account deletion for audit trail
 * @param {object} context - Deletion context
 */
export function logAccountDeletion(context = {}) {
  const { userId, email, ip, reason } = context

  const maskedUserId = userId ? partiallyRedact(userId, 4) : 'unknown'
  const maskedEmail = email ? partiallyRedact(email, 3) : 'unknown'

  logInfo('security', `Account deletion scheduled for ${maskedEmail}`, {
    eventType: SECURITY_EVENT_TYPES.ACCOUNT_DELETION,
    userId: maskedUserId,
    email: maskedEmail,
    ip,
    reason,
    timestamp: new Date().toISOString(),
  })

  logInfo(
    'security',
    `Account deletion for ${maskedUserId} initiated at ${new Date().toISOString()}`
  )
}

/**
 * Log password reset request
 * @param {object} context - Reset context
 */
export function logPasswordResetRequest(context = {}) {
  const { userId, email, ip } = context

  const maskedUserId = userId ? partiallyRedact(userId, 4) : 'unknown'
  const maskedEmail = email ? partiallyRedact(email, 3) : 'unknown'

  logInfo('security', `Password reset requested for ${maskedEmail}`, {
    eventType: SECURITY_EVENT_TYPES.PASSWORD_RESET_REQUEST,
    userId: maskedUserId,
    email: maskedEmail,
    ip,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Log malicious payload detection
 * @param {string} payloadType - Type of payload detected (e.g., 'script_injection', 'html_injection')
 * @param {object} context - Context
 */
export function logMaliciousPayload(payloadType, context = {}) {
  const { userId, endpoint, ip, details } = context

  const maskedUserId = userId ? partiallyRedact(userId, 4) : 'unknown'

  logError('security', `Malicious payload detected: ${payloadType}`, null, {
    eventType: SECURITY_EVENT_TYPES.MALICIOUS_PAYLOAD_DETECTED,
    payloadType,
    userId: maskedUserId,
    endpoint,
    ip,
    timestamp: new Date().toISOString(),
    details,
  })

  // Alert on malicious payload
  logError(
    'security',
    `Malicious payload "${payloadType}" detected from ${ip} on endpoint ${endpoint}`,
    null
  )
}

/**
 * Export all security event types for reference
 */
export { SECURITY_EVENT_TYPES }
