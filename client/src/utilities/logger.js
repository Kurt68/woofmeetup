// Production-safe logging utility with dynamic Sentry integration
const isDevelopment = import.meta.env.MODE === 'development'

// Cache for Sentry module to avoid repeated imports
let sentryModule = null
let sentryLoadPromise = null

// Lazy load Sentry only when needed in production
async function getSentry() {
  if (isDevelopment) return null

  // Return cached module if available
  if (sentryModule) return sentryModule

  // Return existing promise if already loading
  if (sentryLoadPromise) return sentryLoadPromise

  // Start loading Sentry
  sentryLoadPromise = (async () => {
    try {
      // First try to get from window (if main.jsx already loaded it)
      if (window.Sentry) {
        sentryModule = window.Sentry
        return sentryModule
      }

      // Otherwise, dynamically import it
      sentryModule = await import('@sentry/react')
      return sentryModule
    } catch (error) {
      console.warn('Sentry not available:', error)
      return null
    }
  })()

  return sentryLoadPromise
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

  error: async (...args) => {
    // Always log errors to console
    console.error(...args)

    if (!isDevelopment) {
      // Send to Sentry in production with context
      try {
        const Sentry = await getSentry()
        if (Sentry) {
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
      } catch (sentryError) {
        // Sentry not available, continue without monitoring
        console.warn('Sentry monitoring unavailable:', sentryError)
      }
    }
  },

  info: (...args) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },

  // Track ML performance
  performance: async (operation, duration, metadata = {}) => {
    if (isDevelopment) {
      console.log(`⏱️ ${operation}: ${duration}ms`, metadata)
    }

    if (!isDevelopment) {
      try {
        const Sentry = await getSentry()
        if (Sentry) {
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

          // Also capture as a message so it shows up in Sentry
          // Using 'warning' level to ensure it appears in the feed
          Sentry.captureMessage(`Performance: ${operation}`, 'warning', {
            extra: {
              duration,
              ...metadata,
            },
            tags: {
              component: 'woof-meetup',
              type: 'performance',
            },
          })
        }
      } catch (sentryError) {
        // Sentry not available, continue without monitoring
      }
    }
  },

  // Track user actions for debugging context
  userAction: async (action, data = {}) => {
    if (isDevelopment) {
      console.log(`👤 User action: ${action}`, data)
    }

    if (!isDevelopment) {
      try {
        const Sentry = await getSentry()
        if (Sentry) {
          Sentry.addBreadcrumb({
            category: 'user',
            message: action,
            level: 'info',
            data,
          })
        }
      } catch (sentryError) {
        // Sentry not available, continue without monitoring
      }
    }
  },
}

export default logger
