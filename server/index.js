import 'dotenv/config'

// SECURITY FIX: Validate environment variables immediately after loading
// This prevents cryptic runtime errors if required configuration is missing
import { validateEnvironmentVariables } from './utilities/validateEnv.js'
try {
  validateEnvironmentVariables()
} catch (error) {
  // Use console.error for startup phase before logger is initialized
  // This is acceptable as it's a critical startup error
  console.error('[STARTUP ERROR] Environment validation failed:')
  console.error(error.message)
  process.exit(1)
}

import { app, server } from './lib/socket.js'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { connectDB } from './db/connectDB.js'
import path from 'path'
import cookieParser from 'cookie-parser'
import { logError, logInfo, logWarning } from './utilities/logger.js'

import authRoutes from './routes/auth.route.js'
import messageRoutes from './routes/message.route.js'
import paymentRoutes, { webhookRouter } from './routes/payment.route.js'
import likeRoutes from './routes/like.route.js'
import { startScheduledDeletionJob } from './jobs/scheduledDeletion.job.js'
import { preloadModel } from './utilities/checkImage.js'
import {
  turnstileLimiter,
  generalLimiter,
  csrfTokenLimiter,
  initializeRedisStore,
} from './middleware/rateLimiter.js'
import { csrfProtection, csrfErrorHandler } from './middleware/csrf.js'
import { initializeSentry } from './utilities/sentryInit.js'
import { noCacheApiMiddleware } from './middleware/noCacheApi.js'

const PORT = process.env.PORT || 8000
const __dirname = path.resolve()

// Security: HTTPS Enforcement Middleware
// Redirects all HTTP requests to HTTPS in production
// Skips enforcement for localhost to allow local testing without SSL certificates
// Skips enforcement for Stripe webhook endpoint (Stripe may send HTTP requests)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const host = req.headers.host
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
    const isWebhook = req.path === '/api/payments/webhook' || req.path.startsWith('/api/payments/webhook/')

    // Debug logging for webhook requests
    if (isWebhook) {
      console.log('[WEBHOOK DEBUG] Path:', req.path, '| Method:', req.method, '| Skipping HTTPS check')
    }

    // Skip HTTPS enforcement for localhost (for local testing) and webhook endpoints
    if (!isLocalhost && !isWebhook) {
      // Check if connection is via proxy (common in production environments)
      const protocol = req.headers['x-forwarded-proto'] || req.protocol
      const isSecure = protocol === 'https'

      if (!isSecure) {
        // Redirect to HTTPS
        return res.redirect(301, `https://${host}${req.originalUrl}`)
      }
    }
  }
  next()
})

// Security Headers with CSP allowing external resources
app.use(
  helmet({
    // Enforce HTTPS via Strict-Transport-Security header
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true, // Include in HSTS preload list
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-eval'",
          'https://challenges.cloudflare.com',
          // Enzuzo external script (used for privacy policy, terms of service, and cookie policy)
          // SECURITY: Consider using SRI (Subresource Integrity) hashes if Enzuzo provides them
          // Format: 'https://app.enzuzo.com/scripts/ sha384-<hash>'
          'https://app.enzuzo.com/scripts/',
        ],
        frameSrc: ["'self'", 'https://challenges.cloudflare.com'],
        connectSrc: [
          "'self'",
          'https://challenges.cloudflare.com',
          'https://app.enzuzo.com',
          'https://o4510116371038208.ingest.us.sentry.io',
        ],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://res.cloudinary.com',
          'https://*.cloudfront.net',
          'https://challenges.cloudflare.com',
        ],
        // Allow inline styles - necessary for React apps with style={{}} inline styles
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://challenges.cloudflare.com'],
        // styleSrcElem specifically handles <style> tags and inline style attributes
        styleSrcElem: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://challenges.cloudflare.com',
        ],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        workerSrc: ["'self'", 'blob:'],
        objectSrc: ["'none'"], // ✅ Prevents plugin content injection attacks
        mediaSrc: ["'self'"], // ✅ Restricts audio/video sources
      },
    },
    // ✅ Additional security headers
    frameguard: { action: 'deny' }, // ✅ Prevents clickjacking (X-Frame-Options)
    noSniff: true, // ✅ Prevents MIME sniffing (X-Content-Type-Options)
    xssFilter: true, // ✅ Enables browser XSS filter (X-XSS-Protection)
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }, // ✅ Controls referrer information
  })
)

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://woofmeetup.com', 'https://www.woofmeetup.com']
        : ['http://localhost:8000', 'http://localhost:5173'],
    credentials: true,
  })
)

app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === 'production' &&
    (req.path.endsWith('.png') ||
      req.path.endsWith('.jpg') ||
      req.path.endsWith('.jpeg') ||
      req.path.endsWith('.gif') ||
      req.path.endsWith('.webp') ||
      req.path.endsWith('.svg'))
  ) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  }
  next()
})

// Stripe webhook route MUST be before express.json() to receive raw body
// Mount at specific webhook path to avoid interfering with other payment endpoints
// Disable strict routing to accept both /webhook and /webhook/
app.use('/api/payments/webhook', webhookRouter)
app.set('strict routing', false)

// Security: Request Size Limits
// Limit JSON body size to 5MB to support base64-encoded image uploads
// Base64 encoding increases size by ~33%, so ~3.75MB binary → ~5MB JSON payload
// Image uploads are validated for nudity and resized by Cloudinary before storage
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ limit: '5mb', extended: true }))
app.use(cookieParser())

// Security: Enforce Secure Cookies in Production
// Set cookie defaults to secure, httpOnly, and sameSite
// Skips secure flag for localhost to allow local testing
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const host = req.headers.host
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')

    // Override res.cookie to enforce security settings
    const originalCookie = res.cookie
    res.cookie = function (name, val, options = {}) {
      // Merge with secure defaults
      const secureOptions = {
        ...options,
        secure: isLocalhost ? false : true, // HTTPS only (skip for localhost)
        httpOnly: true, // Prevent XSS access
        sameSite: 'strict', // CSRF protection
      }
      // Don't override if already explicitly set to false
      if (options.secure === false) secureOptions.secure = false
      if (options.httpOnly === false) secureOptions.httpOnly = false
      if (options.sameSite === false) secureOptions.sameSite = false
      return originalCookie.call(this, name, val, secureOptions)
    }
  }
  next()
})

// Security Fix #3: CSRF Protection Setup
// Note: CSRF protection will be applied selectively to routes in their respective files
// This allows for gradual frontend integration and exemption for special cases (webhooks)

// Endpoint to retrieve CSRF token for clients
// Clients should call this on page load to get a token for state-changing operations
// SECURITY FIX #3: MISSING RATE LIMITING - Now protected from abuse
app.get('/api/csrf-token', csrfTokenLimiter, (req, res, next) => {
  try {
    csrfProtection(req, res, (err) => {
      if (err) {
        logError('index', 'CSRF protection error', err)
        return res.status(500).json({
          success: false,
          message: 'Failed to generate CSRF token',
        })
      }
      res.status(200).json({
        success: true,
        csrfToken: req.csrfToken(),
      })
    })
  } catch (err) {
    logError('index', 'Error generating CSRF token', err)
    res.status(500).json({
      success: false,
      message: 'Failed to generate CSRF token',
    })
  }
})

// Security: API Cache Control Middleware
// Prevents browser caching of dynamic API responses
// Critical for real-time features: ensures fresh data is fetched on every request
// Particularly important when Socket.io triggers re-fetches of user/match data
app.use('/api/', noCacheApiMiddleware)

// Security: Global Rate Limiter Middleware
// Applies baseline rate limiting (100 requests per 15 minutes per IP) to all API endpoints
// Prevents general DoS attacks and provides defense-in-depth rate limiting
// Specific endpoints have additional stricter rate limits defined per-route
// NOTE: Disabled for localhost development to avoid blocking legitimate testing
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', generalLimiter)
}

app.use('/api/auth', authRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/likes', likeRoutes)

// Security: CSRF Error Handler
// Catches CSRF validation failures and returns proper JSON error responses
app.use(csrfErrorHandler)

// Serve static files and SPA catch-all route
// Used in production builds and when testing production build locally
app.use(express.static(path.join(__dirname, '/client/dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'))
})

// Cloudflare Turnstile verification endpoint
app.post('/verify-turnstile', turnstileLimiter, async (req, res) => {
  const { token } = req.body

  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: 'No token provided' })
  }

  if (process.env.NODE_ENV === 'development') {
    return res.json({ success: true, message: 'Turnstile verification successful (development mode)' })
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      }
    )

    const data = await response.json()

    if (data.success) {
      res.json({ success: true, message: 'Turnstile verification successful' })
    } else {
      console.error('Turnstile verification failed:', {
        errorCodes: data['error-codes'],
        secretKey: process.env.TURNSTILE_SECRET_KEY?.substring(0, 20) + '...',
        fullResponse: data,
      })
      res.status(400).json({
        success: false,
        message: 'Turnstile verification failed',
        errors: data['error-codes'],
      })
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

server.listen(PORT, async () => {
  // Initialize monitoring and error tracking
  try {
    await initializeSentry()
  } catch (error) {
    logWarning('server.init', 'Sentry initialization failed', error.message)
    // Server continues without Sentry
  }

  connectDB()
  startScheduledDeletionJob()

  // SECURITY FIX: Initialize Redis store for distributed rate limiting
  // If REDIS_URL is configured, this enables rate limiting across multiple servers
  // CRITICAL: For multi-server deployments, Redis is required to prevent rate limit bypass
  try {
    await initializeRedisStore()

    // Verify production setup
    if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
      logWarning(
        'server.init',
        '⚠️  PRODUCTION DEPLOYMENT WARNING: Rate limiting is not distributed. ' +
          'Each server instance maintains separate rate limits. ' +
          'Configure REDIS_URL for multi-server deployments to ensure consistent rate limiting across all instances.'
      )
    }
  } catch (error) {
    logWarning('server.init', 'Redis initialization failed', error.message)
    // Server continues with in-memory rate limiting
  }

  // Preload OpenAI Vision API for content moderation
  try {
    await preloadModel()
  } catch (error) {
    logError('server.init', 'Failed to initialize nudity detection', error)
    logInfo(
      'server.init',
      'Server will continue, but content moderation will fail requests'
    )
  }
  logInfo('server.init', `🚀 Server is running on port: ${PORT}`)
})
