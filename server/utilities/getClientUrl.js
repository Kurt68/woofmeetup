import { logError } from './logger.js'

/**
 * SECURITY: Whitelist of allowed redirect URLs to prevent open redirect attacks
 * Only URLs in this list are permitted for redirects (password reset, payment callbacks, etc)
 */
const ALLOWED_REDIRECT_URLS = [
  'https://woofmeetup.com',
  'https://www.woofmeetup.com',
  'http://localhost:5173', // Vite dev server
  'http://localhost:8000', // Production build testing
]

/**
 * Get the client URL based on environment and NODE_ENV
 * Priority:
 * 1. CLIENT_URL from .env (if explicitly set AND in whitelist)
 * 2. Request origin/host (if available, for detecting www vs non-www)
 * 3. NODE_ENV-based fallback:
 *    - production: https://woofmeetup.com
 *    - development: http://localhost:5173 (Vite dev) or http://localhost:8000 (production build)
 *
 * SECURITY: URL is validated against whitelist to prevent open redirect attacks
 *
 * Usage:
 * - Vite dev: NODE_ENV=development, CLIENT_URL=http://localhost:5173
 * - Prod build testing: NODE_ENV=development, CLIENT_URL=http://localhost:8000
 * - Production: NODE_ENV=production (detects www vs non-www from request)
 *
 * @param {Object} req - Express request object (optional, used to detect current domain)
 * @returns {string} - The validated client URL
 */
export const getClientUrl = (req = null) => {
  let url = null

  // Use CLIENT_URL from .env if explicitly set
  if (process.env.CLIENT_URL) {
    url = process.env.CLIENT_URL
  } else if (req && process.env.NODE_ENV === 'production') {
    // In production with a request object, try to detect the domain from the request
    // This allows us to redirect users to the correct domain (www vs non-www)
    try {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https'
      const host = req.headers.host || req.hostname || 'woofmeetup.com'
      url = `${protocol}://${host}`
    } catch (error) {
      logError('getClientUrl', 'Error extracting URL from request', error)
      url = 'https://woofmeetup.com'
    }
  } else if (process.env.NODE_ENV === 'production') {
    // Production fallback (no request provided)
    url = 'https://woofmeetup.com'
  } else {
    // Development fallback
    url = 'http://localhost:5173'
  }

  // SECURITY: Validate URL against whitelist
  if (!ALLOWED_REDIRECT_URLS.includes(url)) {
    logError(
      'getClientUrl',
      'Invalid CLIENT_URL - not in whitelist, using fallback',
      { attemptedUrl: url, allowedUrls: ALLOWED_REDIRECT_URLS }
    )

    // Use safe fallback based on environment
    return process.env.NODE_ENV === 'production'
      ? 'https://woofmeetup.com'
      : 'http://localhost:5173'
  }

  return url
}
