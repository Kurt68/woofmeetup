/**
 * Simple Monitoring Utility
 * Tracks security events and rate limit hits
 * Sends alerts to Sentry and logs to stdout
 *
 * FEATURES:
 * - Rate limit event tracking
 * - Security event logging
 * - Webhook failure tracking
 * - Production-grade alerting
 */

import { logWarning, logError, logInfo } from './logger.js'

// Simple in-memory metrics (resets on restart)
const metrics = {
  rateLimitHits: [],
  securityEvents: [],
  webhookFailures: [],
}

// Track rate limit hits for alerting
const MAX_RATE_LIMIT_HITS_PER_WINDOW = 10 // Alert if 10+ hits in 5 minutes
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Track a rate limit hit
 * Logs to console and sends to Sentry if available
 * @param {string} endpoint - Endpoint name (e.g., 'login', 'signup')
 * @param {string} ip - Client IP address
 * @param {number} limit - Rate limit threshold
 * @param {number} windowMs - Rate limit window in milliseconds
 */
export const trackRateLimitHit = async (endpoint, ip, limit, windowMs) => {
  const timestamp = Date.now()

  // Record the hit
  metrics.rateLimitHits.push({ endpoint, ip, timestamp })

  // Clean up old hits outside the window
  metrics.rateLimitHits = metrics.rateLimitHits.filter(
    (hit) => timestamp - hit.timestamp < RATE_LIMIT_WINDOW_MS
  )

  // Log locally
  logWarning('rate-limiter', `Rate limit exceeded on ${endpoint}`, {
    ip,
    limit,
    windowMs: windowMs / 1000 + 's',
  })

  // Check if we should alert (multiple hits on same endpoint)
  const hitsOnEndpoint = metrics.rateLimitHits.filter((hit) => hit.endpoint === endpoint).length

  if (hitsOnEndpoint >= MAX_RATE_LIMIT_HITS_PER_WINDOW) {
    // Send alert to Sentry
    try {
      const { captureRateLimitAlert } = await import('./sentryInit.js')
      captureRateLimitAlert(endpoint, ip, limit, windowMs)
    } catch (error) {
      // Sentry not available, continue
    }

    // Log as ERROR for visibility
    logError('rate-limiter', `🚨 ALERT: Possible attack on ${endpoint}`, {
      endpoint,
      hitsInWindow: hitsOnEndpoint,
      ips: [...new Set(metrics.rateLimitHits.map((h) => h.ip))],
    })
  }
}
