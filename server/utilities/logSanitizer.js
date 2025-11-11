/**
 * Log Sanitization Utility
 * Prevents sensitive data (user IDs, tokens, emails, passwords) from being logged
 * Provides masking and redaction functions for safe logging
 *
 * Sensitive Fields Protected:
 * - User IDs (UUIDs, ObjectIds)
 * - Email addresses
 * - Passwords (hashed or plaintext)
 * - Auth tokens (JWT, bearer tokens)
 * - Payment info (credit cards, Stripe data)
 * - API keys and secrets
 * - Phone numbers
 */

/**
 * Sensitive field names that should never be logged
 */
const SENSITIVE_FIELDS = new Set([
  'password',
  'hashedPassword',
  'token',
  'accessToken',
  'refreshToken',
  'authToken',
  'jwtToken',
  'apiKey',
  'secretKey',
  'secret',
  'apiSecret',
  'secretAccessKey',
  'accessKeyId',
  'stripeToken',
  'stripeCustomerId',
  'stripeKey',
  'creditCard',
  'cardNumber',
  'cvv',
  'ssn',
  'pinCode',
  'otp',
  'verificationToken',
  'resetToken',
  'passwordResetToken',
  'twoFactorSecret',
  'privateKey',
  'publicKey',
  'encryptionKey',
  'decryptionKey',
])

/**
 * Fields that should be partially redacted (show first 4 chars then ***)
 */
const PARTIALLY_REDACTED_FIELDS = new Set([
  'email',
  'phone',
  'phoneNumber',
  'mobileNumber',
  'userId',
  'user_id',
  'senderId',
  'receiverId',
  'userChattingWithId',
  'matchedUserId',
  'id',
  '_id',
  'customerId',
  'stripeId',
])

/**
 * Fully redact a value - replace entire content with [REDACTED]
 * @param {*} value - The value to redact
 * @returns {string} - [REDACTED]
 */
export function fullyRedact(value) {
  return '[REDACTED]'
}

/**
 * Partially redact a value - show first N characters, then ****
 * @param {*} value - The value to redact
 * @param {number} visibleChars - Number of characters to show (default: 4)
 * @returns {string} - Partially redacted value
 */
export function partiallyRedact(value, visibleChars = 4) {
  if (!value) return '[REDACTED]'

  const str = String(value)
  if (str.length <= visibleChars) {
    return '****'
  }

  return str.substring(0, visibleChars) + '****'
}

/**
 * Sanitize a single value - redact if it appears sensitive
 * @param {string} fieldName - Field name (optional, for context-aware sanitization)
 * @param {*} value - The value to check
 * @returns {*} - Original or redacted value
 */
export function sanitizeValue(fieldName, value) {
  // Handle overloaded signature: sanitizeValue(value) for backward compatibility
  if (value === undefined) {
    value = fieldName
    fieldName = null
  }

  if (value === null || value === undefined) {
    return value
  }

  // Check if field name indicates it should be fully redacted
  if (fieldName && isSensitiveField(fieldName)) {
    if (typeof value === 'string') {
      return fullyRedact(value)
    }
  }

  // Check if field should be partially redacted
  if (fieldName && shouldPartiallyRedact(fieldName)) {
    if (typeof value === 'string') {
      return partiallyRedact(value, 4)
    }
  }

  // Check if value looks like a sensitive pattern (regardless of field name)
  if (typeof value === 'string') {
    // JWT token pattern (eyJ...)
    if (value.match(/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)) {
      return '[REDACTED]'
    }

    // API key pattern
    if (
      value.match(/^(sk_|pk_|api_key_|apikey_|secret_)/i) ||
      (value.length > 32 && value.match(/^[a-f0-9]{40,}$/))
    ) {
      return '[REDACTED]'
    }

    // Credit card number pattern (13-19 digits, optional spaces/dashes)
    if (
      value.match(/^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4,7}$/) &&
      value.replace(/\D/g, '').length >= 13
    ) {
      return '[REDACTED]'
    }

    // CVC/CVV pattern (3-4 digits)
    if (
      fieldName &&
      (fieldName.toLowerCase().includes('cvc') ||
        fieldName.toLowerCase().includes('cvv'))
    ) {
      if (value.match(/^\d{3,4}$/)) {
        return '[REDACTED]'
      }
    }

    // UUID or ObjectId pattern
    if (
      value.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      ) ||
      value.match(/^[0-9a-f]{24}$/)
    ) {
      return partiallyRedact(value, 4)
    }

    // Email pattern
    if (value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return partiallyRedact(value.split('@')[0], 3) + '@***'
    }

    // Phone pattern
    if (value.match(/^(\+\d{1,3}[-.\s]?)?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}$/)) {
      return '****' + value.slice(-4)
    }
  }

  return value
}

/**
 * Sanitize an object by redacting sensitive fields
 * Recursively handles nested objects and arrays
 *
 * @param {*} obj - The object to sanitize
 * @param {number} depth - Current recursion depth (max 10)
 * @returns {*} - Sanitized object
 */
export function sanitizeObject(obj, depth = 0) {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[CIRCULAR_REFERENCE]'
  }

  if (obj === null || obj === undefined) {
    return obj
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    return sanitizeValue(obj)
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1))
  }

  // Handle objects
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key)) {
      sanitized[key] = fullyRedact(value)
    } else if (PARTIALLY_REDACTED_FIELDS.has(key)) {
      sanitized[key] = partiallyRedact(value, 4)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, depth + 1)
    } else {
      // Call sanitizeValue with fieldName to catch patterns like credit cards
      sanitized[key] = sanitizeValue(key, value)
    }
  }

  return sanitized
}

/**
 * Sanitize an error object for logging
 * Strips sensitive data from error message and stack
 *
 * @param {Error} error - The error object to sanitize
 * @returns {object} - Sanitized error info
 */
export function sanitizeError(error) {
  if (!error) {
    return { message: 'Unknown error', stack: undefined }
  }

  const { message = 'Unknown error', stack = '', name = 'Error' } = error

  // Sanitize the message
  let sanitizedMessage = message

  // Remove common sensitive patterns
  sanitizedMessage = sanitizedMessage.replace(
    /user[_-]?id[:\s]*[0-9a-f-]{36,}/gi,
    'userId: [REDACTED]'
  )
  sanitizedMessage = sanitizedMessage.replace(
    /token[:\s]*[a-z0-9.]{50,}/gi,
    'token: [REDACTED]'
  )
  sanitizedMessage = sanitizedMessage.replace(
    /password[:\s]*\S+/gi,
    'password: [REDACTED]'
  )
  sanitizedMessage = sanitizedMessage.replace(
    /email[:\s]*\S+@\S+/gi,
    'email: [REDACTED]'
  )
  sanitizedMessage = sanitizedMessage.replace(
    /stripe[_-]?[a-z_]*[:\s]*[a-z0-9_]{20,}/gi,
    'stripe_data: [REDACTED]'
  )

  // Sanitize the stack trace - remove file paths with potentially sensitive info
  let sanitizedStack = stack
  if (process.env.NODE_ENV === 'production') {
    // In production, completely remove stack traces
    sanitizedStack = '[STACK_TRACE_REMOVED_IN_PRODUCTION]'
  } else {
    // In development, remove only sensitive paths
    sanitizedStack = sanitizedStack.replace(
      /\/[^:\s]+\/[^:\s]+\//g,
      '/[PATH_REDACTED]/'
    )
  }

  // Create base error object
  const sanitized = {
    name,
    message: sanitizedMessage,
    stack: sanitizedStack,
  }

  // Sanitize any custom properties attached to the error object
  // Common error properties like message, stack, name are already handled
  const excludedKeys = new Set(['message', 'stack', 'name'])

  for (const key in error) {
    if (!excludedKeys.has(key)) {
      const value = error[key]
      // Sanitize custom properties using sanitizeObject
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value)
      } else if (typeof value === 'string') {
        sanitized[key] = sanitizeValue(key, value)
      } else {
        sanitized[key] = value
      }
    }
  }

  return sanitized
}

/**
 * Check if a field name is considered sensitive
 * @param {string} fieldName - The field name to check
 * @returns {boolean} - True if field is sensitive
 */
export function isSensitiveField(fieldName) {
  return SENSITIVE_FIELDS.has(fieldName)
}

/**
 * Check if a field should be partially redacted
 * @param {string} fieldName - The field name to check
 * @returns {boolean} - True if field should be partially redacted
 */
export function shouldPartiallyRedact(fieldName) {
  return PARTIALLY_REDACTED_FIELDS.has(fieldName)
}
