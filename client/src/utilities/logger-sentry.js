// Production-safe logging utility with Sentry integration
const isDevelopment = import.meta.env.MODE === 'development'

// Lazy load Sentry only in production
let Sentry = null
let sentryReady = false

if (!isDevelopment) {
  try {
    // Dynamic import to avoid bundling Sentry in development
    import('@sentry/browser')
      .then((module) => {
        Sentry = module
        // Initialize Sentry with your DSN
        Sentry.init({
          dsn: import.meta.env.VITE_SENTRY_DSN,
          environment: import.meta.env.MODE,
          // Capture performance data for ML operations
          tracesSampleRate: 0.1,
          // Filter out non-critical errors
          beforeSend(event) {
            // Don't send network errors or user cancellations
            if (event.exception?.values?.[0]?.type === 'NetworkError')
              return null
            if (event.exception?.values?.[0]?.value?.includes('AbortError'))
              return null
            return event
          },
        })
        sentryReady = true
      })
      .catch(() => {
        // Sentry failed to load, continue without it
        console.warn('Sentry monitoring unavailable')
      })
  } catch (error) {
    // Sentry not available, continue without monitoring
  }
}

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  error: (...args) => {
    // Always log errors to console
    console.error(...args)

    if (!isDevelopment && sentryReady && Sentry) {
      // Send to Sentry in production with context
      const [message, ...context] = args

      if (message instanceof Error) {
        // Handle Error objects
        Sentry.captureException(message, {
          extra: { context },
          tags: {
            component: 'woof-meetup',
            type: 'application-error',
          },
        })
      } else {
        // Handle string messages with context
        Sentry.captureMessage(String(message), 'error', {
          extra: { context },
          tags: {
            component: 'woof-meetup',
            type: 'application-error',
          },
        })
      }
    }
  },

  info: (...args) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },

  // New method for tracking ML performance
  performance: (operation, duration, metadata = {}) => {
    if (isDevelopment) {
      console.log(`⏱️ ${operation}: ${duration}ms`, metadata)
    }

    if (!isDevelopment && sentryReady && Sentry) {
      // Track performance metrics in production
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `${operation} completed`,
        level: 'info',
        data: {
          duration,
          ...metadata,
        },
      })
    }
  },

  // Track user actions for debugging context
  userAction: (action, data = {}) => {
    if (isDevelopment) {
      console.log(`👤 User action: ${action}`, data)
    }

    if (!isDevelopment && sentryReady && Sentry) {
      Sentry.addBreadcrumb({
        category: 'user',
        message: action,
        level: 'info',
        data,
      })
    }
  },
}

export default logger
