// Production-safe logging utility
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
    // Always log errors, but in production send to monitoring service
    console.error(...args)

    if (!isDevelopment) {
      // In production, you might want to send to error monitoring
      // Example: Sentry, LogRocket, etc.
    }
  },

  info: (...args) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },
}

export default logger
