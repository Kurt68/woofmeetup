/**
 * Sentry Error Tracking Initialization
 * Captures exceptions, performance issues, and custom alerts
 *
 * SETUP REQUIRED:
 * 1. Set SENTRY_DSN environment variable with your Sentry project DSN
 * 2. Sentry will automatically capture unhandled exceptions and performance data
 *
 * USAGE:
 * - Automatic error capture (unhandled exceptions)
 * - Manual capture: Sentry.captureException(error)
 * - Custom alerts: Sentry.captureMessage(message, 'warning')
 * - Rate limit alerts: Sentry.captureMessage(`Rate limit hit: ${key}`, 'warning')
 */

import { logInfo, logWarning, logError } from './logger.js'

let Sentry = null
let isInitialized = false

/**
 * Initialize Sentry if DSN is provided
 */
export const initializeSentry = async () => {
  if (isInitialized) {
    return
  }

  isInitialized = true

  // Only enable if DSN is configured
  if (!process.env.SENTRY_DSN) {
    logInfo('sentryInit', 'Disabled - set SENTRY_DSN environment variable to enable')
    return
  }

  try {
    // Dynamically import Sentry to avoid requiring it if not used
    const sentryModule = await import('@sentry/node')
    Sentry = sentryModule

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    })

    logInfo('sentryInit', `Initialized - Environment: ${process.env.NODE_ENV}`)
  } catch (error) {
    logWarning('sentryInit', 'Initialization failed', error)
  }
}

/**
 * Get Sentry instance
 */
export const getSentry = () => Sentry

/**
 * Capture an exception
 */
export const captureException = (error, context = {}) => {
  if (!Sentry) {
    return
  }

  try {
    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    })
  } catch (err) {
    logError('sentryInit', 'Failed to capture exception', err)
  }
}

/**
 * Capture a message (warning, info, etc.)
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  if (!Sentry) {
    return
  }

  try {
    Sentry.captureMessage(message, level, {
      contexts: {
        custom: context,
      },
    })
  } catch (err) {
    logError('sentryInit', 'Failed to capture message', err)
  }
}

/**
 * Capture rate limit alert
 */
export const captureRateLimitAlert = (endpointName, ip, limit, windowMs) => {
  const message = `Rate limit exceeded: ${endpointName} (IP: ${ip}, limit: ${limit}/${windowMs}ms)`
  captureMessage(message, 'warning', {
    endpoint: endpointName,
    ip,
    limit,
    windowMs,
    type: 'RATE_LIMIT_EXCEEDED',
  })
}
