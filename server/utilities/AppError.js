import { ErrorCodes, ErrorMessages } from '../constants/errorCodes.js'

export class AppError extends Error {
  constructor(code = ErrorCodes.INTERNAL_SERVER_ERROR, statusCode = 500, details = null) {
    const message = ErrorMessages[code] || 'An error occurred'
    super(message)

    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.timestamp = new Date().toISOString()

    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(code = ErrorCodes.INVALID_INPUT, details = null) {
    return new AppError(code, 400, details)
  }

  static unauthorized(code = ErrorCodes.UNAUTHORIZED, details = null) {
    return new AppError(code, 401, details)
  }

  static forbidden(code = ErrorCodes.FORBIDDEN, details = null) {
    return new AppError(code, 403, details)
  }

  static notFound(code = ErrorCodes.NOT_FOUND, details = null) {
    return new AppError(code, 404, details)
  }

  static conflict(code = ErrorCodes.CONFLICT, details = null) {
    return new AppError(code, 409, details)
  }

  static internalError(code = ErrorCodes.INTERNAL_SERVER_ERROR, details = null) {
    return new AppError(code, 500, details)
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      ...(this.details && { details: this.details }),
    }
  }
}

export default AppError
