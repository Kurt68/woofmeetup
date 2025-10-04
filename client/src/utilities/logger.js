// Production-safe logging utility with Sentry integration
const isDevelopment = import.meta.env.MODE === 'development'

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

    if (!isDevelopment) {
      // Send to Sentry in production with context
      try {
        const Sentry = window.Sentry
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
  performance: (operation, duration, metadata = {}) => {
    if (isDevelopment) {
      console.log(`⏱️ ${operation}: ${duration}ms`, metadata)
    }

    if (!isDevelopment) {
      try {
        const Sentry = window.Sentry
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
          Sentry.captureMessage(`Performance: ${operation}`, 'info', {
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
  userAction: (action, data = {}) => {
    if (isDevelopment) {
      console.log(`👤 User action: ${action}`, data)
    }

    if (!isDevelopment) {
      try {
        const Sentry = window.Sentry
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
