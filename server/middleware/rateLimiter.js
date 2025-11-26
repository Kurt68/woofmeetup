import rateLimit from 'express-rate-limit'
import { logWarning, logInfo } from '../utilities/logger.js'
import { trackRateLimitHit } from '../utilities/monitoring.js'
import { logRateLimitExceeded } from '../utilities/securityLogger.js'
import { sendRateLimitError } from '../utils/ApiResponse.js'

/**
 * Security: Rate Limiting Middleware
 * Protects against brute force and denial of service attacks
 *
 * SECURITY FIX: Redis Store Support for Multi-Server Deployments
 * By default uses in-memory store (safe for single-server deployments)
 * For multi-server deployments, configure REDIS_URL environment variable
 * to use distributed rate limiting across all instances
 *
 * SECURITY FIX: Integrated security logging for rate limit exceeded events
 */

// Initialize Redis store if configured (optional, falls back to memory store)
let store = undefined
let redisInitialized = false

/**
 * Create a rate limiter with monitoring
 * Automatically tracks rate limit hits for alerting
 * SECURITY FIX: Added security logging to rate limit events
 */
const createLimiterWithMonitoring = (endpointName, options) => {
  const limiter = rateLimit({
    ...options,
    store: getStore(),
    handler: (req, res) => {
      const ip = req.ip || req.connection.remoteAddress

      // Log rate limit violation for security audit trail
      logRateLimitExceeded({
        userId: req.userId,
        endpoint: req.path,
        ip,
        limit: options.max,
        window: options.windowMs,
        currentCount: req.rateLimit?.current || 'N/A',
      })

      // Track the rate limit hit for monitoring/alerting
      trackRateLimitHit(endpointName, ip, options.max, options.windowMs)

      // Send the rate limit response
      const message = options.message?.message || 'Rate limit exceeded'
      sendRateLimitError(res, message, Math.ceil(options.windowMs / 1000))
    },
  })

  return limiter
}

/**
 * Initialize Redis store asynchronously
 * Called during server startup from server/index.js
 */
export const initializeRedisStore = async () => {
  if (redisInitialized) {
    return
  }

  if (!process.env.REDIS_URL) {
    if (process.env.NODE_ENV === 'production') {
      logWarning(
        'rate-limiter',
        'Production environment detected but REDIS_URL not configured. ' +
          'Rate limiting will only work on a single server. ' +
          'For multi-server deployments, set REDIS_URL environment variable.'
      )
    }
    redisInitialized = true
    return
  }

  try {
    // Lazy load Redis only if configured
    const RedisStore = (await import('rate-limit-redis')).default
    const redis = (await import('redis')).default

    const client = redis.createClient({
      url: process.env.REDIS_URL,
    })

    // Handle connection errors gracefully
    client.on('error', (err) => {
      logWarning(
        'rate-limiter',
        'Redis connection failed, falling back to memory store',
        err.message
      )
      store = undefined
    })

    await client.connect()

    store = new RedisStore({
      client,
      prefix: 'rate-limit:',
    })

    logInfo('rate-limiter', 'Redis store initialized for distributed rate limiting')
    redisInitialized = true
  } catch (error) {
    logWarning('rate-limiter', 'Redis store not available, using in-memory store', error.message)
    redisInitialized = true
  }
}

/**
 * Get the store configuration for rate limiters
 * Returns Redis store if configured, otherwise undefined (uses memory)
 */
const getStore = () => store

/**
 * Bypass middleware for development mode
 * In development, rate limiters are disabled entirely for faster testing
 * In production, actual rate limiters are applied
 */
const bypassMiddleware = (req, res, next) => next()

// Rate limiter for login endpoint - Prevents brute force password guessing
// Security: Max 5 attempts per 15 minutes per IP
// NOTE: Disabled in development mode for faster testing
// Monitors: Tracks repeated failures and sends alerts to Sentry
// Configurable via environment variables for production tuning
const loginWindowMs = process.env.LOGIN_RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 10)
  : 15 * 60 * 1000
const loginMaxAttempts = process.env.LOGIN_RATE_LIMIT_MAX
  ? parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10)
  : 5

const _loginLimiter = createLimiterWithMonitoring('login', {
  windowMs: loginWindowMs,
  max: loginMaxAttempts,
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Only count failed attempts to avoid blocking legitimate users retrying
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
})

export const loginLimiter = process.env.NODE_ENV === 'production' ? _loginLimiter : bypassMiddleware

// Rate limiter for signup endpoint - Prevents account enumeration and spam
// Security: Max 3 attempts per hour per IP in production
// NOTE: Disabled in development mode for faster testing
// Monitors: Tracks account creation spam and sends alerts to Sentry
// Configurable via environment variables for production tuning
const signupWindowMs = process.env.SIGNUP_RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.SIGNUP_RATE_LIMIT_WINDOW_MS, 10)
  : 60 * 60 * 1000 // 1 hour
const signupMaxAttempts = process.env.SIGNUP_RATE_LIMIT_MAX
  ? parseInt(process.env.SIGNUP_RATE_LIMIT_MAX, 10)
  : 3

const _signupLimiter = createLimiterWithMonitoring('signup', {
  windowMs: signupWindowMs,
  max: signupMaxAttempts,
  message: {
    success: false,
    message: 'Too many signup attempts from this IP, please try again after 1 hour',
    code: 'SIGNUP_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
})

export const signupLimiter =
  process.env.NODE_ENV === 'production' ? _signupLimiter : bypassMiddleware

// Rate limiter for password reset endpoint - Prevents brute force token guessing
// Security: Max 3 attempts per hour per IP (production only)
// NOTE: Disabled in development mode for faster testing
// Configurable via environment variables for production tuning
const passwordResetWindowMs = process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS, 10)
  : 60 * 60 * 1000 // 1 hour
const passwordResetMaxAttempts = process.env.PASSWORD_RESET_RATE_LIMIT_MAX
  ? parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_MAX, 10)
  : 3

const _passwordResetLimiter = createLimiterWithMonitoring('password-reset', {
  windowMs: passwordResetWindowMs,
  max: passwordResetMaxAttempts,
  message: {
    success: false,
    message: 'Too many password reset attempts from this IP, please try again after 1 hour',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
})

export const passwordResetLimiter =
  process.env.NODE_ENV === 'production' ? _passwordResetLimiter : bypassMiddleware

// Rate limiter for forgot password endpoint - Prevents account enumeration
// Security: Max 3 attempts per hour per IP (production only)
// NOTE: Disabled in development mode for faster testing
// Configurable via environment variables for production tuning
const forgotPasswordWindowMs = process.env.FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS, 10)
  : 60 * 60 * 1000 // 1 hour
const forgotPasswordMaxAttempts = process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX
  ? parseInt(process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX, 10)
  : 3

const _forgotPasswordLimiter = createLimiterWithMonitoring('forgot-password', {
  windowMs: forgotPasswordWindowMs,
  max: forgotPasswordMaxAttempts,
  message: {
    success: false,
    message: 'Too many password reset requests from this IP, please try again after 1 hour',
    code: 'FORGOT_PASSWORD_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
})

export const forgotPasswordLimiter =
  process.env.NODE_ENV === 'production' ? _forgotPasswordLimiter : bypassMiddleware

// Rate limiter for email verification endpoint - Prevents brute force verification
// Security: Max 5 attempts per 15 minutes per IP (production only)
// NOTE: Disabled in development mode for faster testing
// Configurable via environment variables for production tuning
const verifyEmailWindowMs = process.env.VERIFY_EMAIL_RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.VERIFY_EMAIL_RATE_LIMIT_WINDOW_MS, 10)
  : 15 * 60 * 1000
const verifyEmailMax = process.env.VERIFY_EMAIL_RATE_LIMIT_MAX
  ? parseInt(process.env.VERIFY_EMAIL_RATE_LIMIT_MAX, 10)
  : 5

const _verifyEmailLimiter = createLimiterWithMonitoring('verify-email', {
  windowMs: verifyEmailWindowMs,
  max: verifyEmailMax,
  message: {
    success: false,
    message: 'Too many email verification attempts from this IP, please try again after 15 minutes',
    code: 'VERIFY_EMAIL_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Only count failed attempts
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
})

export const verifyEmailLimiter =
  process.env.NODE_ENV === 'production' ? _verifyEmailLimiter : bypassMiddleware

// Stricter rate limiter for deletion endpoints
// NOTE: Disabled in development mode for faster testing
const _deletionEndpointLimiter = createLimiterWithMonitoring('deletion-endpoint', {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'Too many deletion requests from this IP, please try again after 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

export const deletionEndpointLimiter =
  process.env.NODE_ENV === 'production' ? _deletionEndpointLimiter : bypassMiddleware

// Rate limiter for message retrieval endpoints - Prevents message enumeration and DoS
// Security: Max 10 messages per 5 minutes per IP (production only)
// Reduced from 30 to prevent user enumeration attacks via message endpoint scanning
// NOTE: Disabled in development mode for faster testing
// Configurable via environment variables for production tuning
const messageRetrievalWindowMs = process.env.MESSAGE_RETRIEVAL_RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.MESSAGE_RETRIEVAL_RATE_LIMIT_WINDOW_MS, 10)
  : 5 * 60 * 1000
const messageRetrievalMaxAttempts = process.env.MESSAGE_RETRIEVAL_RATE_LIMIT_MAX
  ? parseInt(process.env.MESSAGE_RETRIEVAL_RATE_LIMIT_MAX, 10)
  : 10

const _messageRetrievalLimiter = createLimiterWithMonitoring('message-retrieval', {
  windowMs: messageRetrievalWindowMs,
  max: messageRetrievalMaxAttempts,
  message: {
    success: false,
    message: 'Too many message requests from this IP, please try again after 5 minutes',
    code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
})

export const messageRetrievalLimiter =
  process.env.NODE_ENV === 'production' ? _messageRetrievalLimiter : bypassMiddleware

// Rate limiter for message sending endpoints - Prevents spam and resource abuse
// Security: Max 5 messages per 5 minutes per IP (production only)
// NOTE: Disabled in development mode for faster testing
// Configurable via environment variables for production tuning
const messageSendingWindowMs = process.env.MESSAGE_SENDING_RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.MESSAGE_SENDING_RATE_LIMIT_WINDOW_MS, 10)
  : 5 * 60 * 1000
const messageSendingMaxAttempts = process.env.MESSAGE_SENDING_RATE_LIMIT_MAX
  ? parseInt(process.env.MESSAGE_SENDING_RATE_LIMIT_MAX, 10)
  : 5

const _messageSendingLimiter = createLimiterWithMonitoring('message-sending', {
  windowMs: messageSendingWindowMs,
  max: messageSendingMaxAttempts,
  message: {
    success: false,
    message: 'Too many messages sent from this IP, please try again after 5 minutes',
    code: 'MESSAGE_SENDING_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Only count failed attempts
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
})

export const messageSendingLimiter =
  process.env.NODE_ENV === 'production' ? _messageSendingLimiter : bypassMiddleware

// Rate limiter for message deletion endpoints - Prevents message scrubbing attacks
// Security: Max 10 deletions per 5 minutes per IP (production only)
// NOTE: Disabled in development mode for faster testing
// Configurable via environment variables for production tuning
const messageDeletionWindowMs = process.env.MESSAGE_DELETION_RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.MESSAGE_DELETION_RATE_LIMIT_WINDOW_MS, 10)
  : 5 * 60 * 1000
const messageDeletionMaxAttempts = process.env.MESSAGE_DELETION_RATE_LIMIT_MAX
  ? parseInt(process.env.MESSAGE_DELETION_RATE_LIMIT_MAX, 10)
  : 10

const _messageDeletionLimiter = createLimiterWithMonitoring('message-deletion', {
  windowMs: messageDeletionWindowMs,
  max: messageDeletionMaxAttempts,
  message: {
    success: false,
    message: 'Too many message deletions from this IP, please try again after 5 minutes',
    code: 'MESSAGE_DELETION_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
})

export const messageDeletionLimiter =
  process.env.NODE_ENV === 'production' ? _messageDeletionLimiter : bypassMiddleware

// Rate limiter for Turnstile verification endpoint - Prevents brute force CAPTCHA bypass
// Security: Failed attempts are rate limited per IP (production only)
// NOTE: Disabled in development mode for faster testing
// Configurable via environment variables for production tuning
const turnstileWindowMs = process.env.TURNSTILE_RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.TURNSTILE_RATE_LIMIT_WINDOW_MS, 10)
  : 15 * 60 * 1000 // 15 min
const turnstileMaxAttempts = process.env.TURNSTILE_RATE_LIMIT_MAX
  ? parseInt(process.env.TURNSTILE_RATE_LIMIT_MAX, 10)
  : 10 // Increased from 3 to 10 to account for shared IPs and network timeouts

const _turnstileLimiter = createLimiterWithMonitoring('turnstile', {
  windowMs: turnstileWindowMs,
  max: turnstileMaxAttempts,
  message: {
    success: false,
    message: 'Too many verification attempts from this IP, please try again after 15 minutes',
    code: 'TURNSTILE_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  skipFailedRequests: false,
})

export const turnstileLimiter =
  process.env.NODE_ENV === 'production' ? _turnstileLimiter : bypassMiddleware

// General API rate limiter for unprotected endpoints
// Security: Prevents general DoS attacks on public endpoints (production only)
// Max 100 requests per 15 minutes per IP
// NOTE: Disabled in development mode for faster testing
const _generalLimiter = createLimiterWithMonitoring('general-api', {
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

export const generalLimiter =
  process.env.NODE_ENV === 'production' ? _generalLimiter : bypassMiddleware

// Rate limiter specifically for auth check endpoint
// Security: Prevents DoS attacks on check-auth while allowing legitimate polling (production only)
// Configurable via environment variables for production tuning
// NOTE: Disabled in development mode for faster testing
const checkAuthWindowMs = process.env.CHECKAUTH_RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.CHECKAUTH_RATE_LIMIT_WINDOW_MS, 10)
  : 5 * 60 * 1000
const checkAuthMax = process.env.CHECKAUTH_RATE_LIMIT_MAX
  ? parseInt(process.env.CHECKAUTH_RATE_LIMIT_MAX, 10)
  : 200

const _checkAuthLimiter = createLimiterWithMonitoring('check-auth', {
  windowMs: checkAuthWindowMs,
  max: checkAuthMax,
  message: {
    success: false,
    message: 'Too many authentication checks',
    code: 'AUTH_CHECK_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

export const checkAuthLimiter =
  process.env.NODE_ENV === 'production' ? _checkAuthLimiter : bypassMiddleware

// Stripe webhook rate limiter
// Security: Protects webhook endpoint from flooding and DoS attacks (production only)
// Max 20 requests per 1 minute per IP
// Reduced from 100 to prevent resource abuse while allowing legitimate webhook traffic
// Monitors: Tracks webhook flooding attempts and sends alerts to Sentry
// Configurable via environment variables for production tuning
const stripeWindowMs = process.env.STRIPE_RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.STRIPE_RATE_LIMIT_WINDOW_MS, 10)
  : 1 * 60 * 1000 // 1 minute
const stripeMaxRequests = process.env.STRIPE_RATE_LIMIT_MAX
  ? parseInt(process.env.STRIPE_RATE_LIMIT_MAX, 10)
  : 20

const _stripeLimiter = createLimiterWithMonitoring('webhook:stripe', {
  windowMs: stripeWindowMs,
  max: stripeMaxRequests,
  message: {
    success: false,
    message: 'Too many webhook requests',
    code: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
})

export const stripeLimiter =
  process.env.NODE_ENV === 'production' ? _stripeLimiter : bypassMiddleware

// CSRF token endpoint rate limiter
// Security: Prevents abuse of CSRF token generation endpoint (production only)
// CRITICAL FIX #5: Missing rate limiting on unprotected /api/csrf-token endpoint
// Max 20 requests per 5 minutes per IP
// NOTE: Disabled in development mode for faster testing
const _csrfTokenLimiter = createLimiterWithMonitoring('csrf-token', {
  windowMs: 5 * 60 * 1000, // 5 min
  max: 20,
  message: {
    success: false,
    message: 'Too many CSRF token requests from this IP',
    code: 'CSRF_TOKEN_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
})

export const csrfTokenLimiter =
  process.env.NODE_ENV === 'production' ? _csrfTokenLimiter : bypassMiddleware

// User enumeration prevention rate limiter for /api/auth/users endpoint
// Security: Prevents attackers from scanning/enumerating all users in the database
// CRITICAL FIX #6: Stricter rate limiting to prevent user enumeration attacks
// Configurable via environment variables (see .env documentation)
// Default: 5 requests per 5 minutes per IP in production (scanning attempts)
// NOTE: Disabled entirely in development mode for faster testing
const USERS_RATE_LIMIT_MAX = process.env.USERS_RATE_LIMIT_MAX
  ? parseInt(process.env.USERS_RATE_LIMIT_MAX)
  : 5
const USERS_RATE_LIMIT_WINDOW_MS = process.env.USERS_RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.USERS_RATE_LIMIT_WINDOW_MS)
  : 5 * 60 * 1000

// Create the actual rate limiter (production only)
const _userEnumerationLimiter = createLimiterWithMonitoring('user-enumeration', {
  windowMs: USERS_RATE_LIMIT_WINDOW_MS,
  max: USERS_RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many user queries from this IP, please try again later',
    code: 'USER_ENUMERATION_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
})

// Export: Use bypass in development, real limiter in production
export const userEnumerationLimiter =
  process.env.NODE_ENV === 'production' ? _userEnumerationLimiter : bypassMiddleware

// Rate limiter for /api/auth/addcoordinates endpoint
// Security: Prevents abuse of location update endpoint
// Default: 10 requests per 5 minutes per IP in production
// NOTE: Disabled entirely in development mode for faster testing
const ADDCOORDINATES_RATE_LIMIT_MAX = process.env.ADDCOORDINATES_RATE_LIMIT_MAX
  ? parseInt(process.env.ADDCOORDINATES_RATE_LIMIT_MAX)
  : 10
const ADDCOORDINATES_RATE_LIMIT_WINDOW_MS = process.env.ADDCOORDINATES_RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.ADDCOORDINATES_RATE_LIMIT_WINDOW_MS)
  : 5 * 60 * 1000

// Create the actual rate limiter (production only)
const _addCoordinatesLimiter = createLimiterWithMonitoring('add-coordinates', {
  windowMs: ADDCOORDINATES_RATE_LIMIT_WINDOW_MS,
  max: ADDCOORDINATES_RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many location update requests from this IP, please try again later',
    code: 'ADDCOORDINATES_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
})

// Export: Use bypass in development, real limiter in production
export const addCoordinatesLimiter =
  process.env.NODE_ENV === 'production' ? _addCoordinatesLimiter : bypassMiddleware

// Rate limiter for /api/likes endpoint
// Security: Prevents abuse of like functionality and spam
// Default: 30 requests per 5 minutes per IP in production
const LIKE_RATE_LIMIT_MAX = process.env.LIKE_RATE_LIMIT_MAX
  ? parseInt(process.env.LIKE_RATE_LIMIT_MAX)
  : 30
const LIKE_RATE_LIMIT_WINDOW_MS = process.env.LIKE_RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.LIKE_RATE_LIMIT_WINDOW_MS)
  : 5 * 60 * 1000

const _likeActionLimiter = createLimiterWithMonitoring('like-action', {
  windowMs: LIKE_RATE_LIMIT_WINDOW_MS,
  max: LIKE_RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many like actions, please try again later',
    code: 'LIKE_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
})

export const likeActionLimiter =
  process.env.NODE_ENV === 'production' ? _likeActionLimiter : bypassMiddleware
