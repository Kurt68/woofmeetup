/**
 * Development-only Logger Utility
 * Logs are ONLY output in development mode
 * In production, all calls are NO-OPs (zero overhead)
 *
 * This prevents:
 * - Console spam in production
 * - Performance degradation
 * - Information disclosure to users
 * - Debug noise in browser DevTools
 *
 * Usage:
 *   devLog('Dashboard', 'Component mounted')
 *   devWarn('ChatStore', 'No selected user')
 *   devError('API', 'Request failed', error)
 *   devDebug('Auth', 'Token refresh', { token: '...' })
 */

const isDevelopment = import.meta.env.MODE === 'development'

// Color scheme for console
const COLORS = {
  info: '#3498db', // Blue
  warn: '#f39c12', // Orange
  error: '#e74c3c', // Red
  debug: '#9b59b6', // Purple
  success: '#27ae60', // Green
}

const formatLog = (level, namespace, message, data = null) => {
  const timestamp = new Date().toLocaleTimeString()
  const prefix = `%c[${timestamp}] [${level.toUpperCase()}] [${namespace}]`
  const style = `color: ${COLORS[level] || '#666'}; font-weight: bold;`

  if (data !== null && data !== undefined) {
    return { prefix, style, message, data }
  }
  return { prefix, style, message }
}

/**
 * Log info message (cyan)
 * @param {string} namespace - Component/module name
 * @param {string} message - Log message
 * @param {*} data - Optional data to log
 */
export const devLog = (namespace, message, data = null) => {
  if (!isDevelopment) return

  const {
    prefix,
    style,
    message: msg,
    data: logData,
  } = formatLog('info', namespace, message, data)

  if (logData !== undefined) {
    console.log(`${prefix} ${msg}`, style, logData)
  } else {
    console.log(`${prefix} ${msg}`, style)
  }
}

/**
 * Log warning message (orange)
 * @param {string} namespace - Component/module name
 * @param {string} message - Log message
 * @param {*} data - Optional data to log
 */
export const devWarn = (namespace, message, data = null) => {
  if (!isDevelopment) return

  const {
    prefix,
    style,
    message: msg,
    data: logData,
  } = formatLog('warn', namespace, message, data)

  if (logData !== undefined) {
    console.warn(`${prefix} ${msg}`, style, logData)
  } else {
    console.warn(`${prefix} ${msg}`, style)
  }
}

/**
 * Log error message (red)
 * @param {string} namespace - Component/module name
 * @param {string} message - Log message
 * @param {Error|*} error - Error object or data
 * @param {*} additionalData - Additional context
 */
export const devError = (
  namespace,
  message,
  error = null,
  additionalData = null
) => {
  if (!isDevelopment) return

  const { prefix, style, message: msg } = formatLog('error', namespace, message)

  console.error(`${prefix} ${msg}`, style)

  if (error) {
    if (error instanceof Error) {
      console.error('  Error:', error.message)
      console.error('  Stack:', error.stack)
    } else {
      console.error('  Error:', error)
    }
  }

  if (additionalData !== null && additionalData !== undefined) {
    console.error('  Data:', additionalData)
  }
}

/**
 * Log debug message (purple) - for detailed debugging
 * @param {string} namespace - Component/module name
 * @param {string} message - Log message
 * @param {*} data - Optional data to log
 */
export const devDebug = (namespace, message, data = null) => {
  if (!isDevelopment) return

  const {
    prefix,
    style,
    message: msg,
    data: logData,
  } = formatLog('debug', namespace, message, data)

  if (logData !== undefined) {
    console.debug(`${prefix} ${msg}`, style, logData)
  } else {
    console.debug(`${prefix} ${msg}`, style)
  }
}

/**
 * Log success message (green)
 * @param {string} namespace - Component/module name
 * @param {string} message - Log message
 * @param {*} data - Optional data to log
 */
export const devSuccess = (namespace, message, data = null) => {
  if (!isDevelopment) return

  const {
    prefix,
    style,
    message: msg,
    data: logData,
  } = formatLog('success', namespace, message, data)

  if (logData !== undefined) {
    console.log(`${prefix} ${msg}`, style, logData)
  } else {
    console.log(`${prefix} ${msg}`, style)
  }
}

/**
 * Log performance timing (for debugging slow operations)
 * @param {string} namespace - Component/module name
 * @param {string} operation - Operation name
 * @param {number} durationMs - Duration in milliseconds
 */
export const devTiming = (namespace, operation, durationMs) => {
  if (!isDevelopment) return

  const color =
    durationMs > 1000 ? '#e74c3c' : durationMs > 500 ? '#f39c12' : '#27ae60'
  const prefix = `%c[PERF] [${namespace}] ${operation}`
  const style = `color: ${color}; font-weight: bold;`

  console.log(`${prefix}: ${durationMs.toFixed(2)}ms`, style)
}

/**
 * Log group for organizing related logs
 * @param {string} groupName - Group name
 * @param {Function} callback - Function containing logs to group
 */
export const devGroup = (groupName, callback) => {
  if (!isDevelopment) return

  console.group(`%c[GROUP] ${groupName}`, `color: #3498db; font-weight: bold;`)
  callback()
  console.groupEnd()
}

/**
 * Create a scoped logger for a specific namespace
 * Useful for reducing repetition in large files
 *
 * Usage:
 *   const logger = createScopedLogger('Dashboard')
 *   logger.log('Component mounted')
 *   logger.warn('No data available')
 *   logger.error('Failed to load', error)
 */
export const createScopedLogger = (namespace) => ({
  log: (message, data) => devLog(namespace, message, data),
  warn: (message, data) => devWarn(namespace, message, data),
  error: (message, error, data) => devError(namespace, message, error, data),
  debug: (message, data) => devDebug(namespace, message, data),
  success: (message, data) => devSuccess(namespace, message, data),
  timing: (operation, durationMs) =>
    devTiming(namespace, operation, durationMs),
  group: (groupName, callback) => devGroup(groupName, callback),
})

/**
 * Convenience export - logger object with all methods
 */
export const logger = {
  log: devLog,
  warn: devWarn,
  error: devError,
  debug: devDebug,
  success: devSuccess,
  timing: devTiming,
  group: devGroup,
  scoped: createScopedLogger,
}

export default logger
