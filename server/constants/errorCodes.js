export const ErrorCodes = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',

  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_NO_TOKEN: 'AUTH_NO_TOKEN',
  AUTH_SESSION_INVALID: 'AUTH_SESSION_INVALID',

  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_EMAIL_DUPLICATE: 'USER_EMAIL_DUPLICATE',
  USER_PROFILE_INCOMPLETE: 'USER_PROFILE_INCOMPLETE',
  USER_ACCOUNT_DELETED: 'USER_ACCOUNT_DELETED',

  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_TRANSACTION_FAILED: 'DATABASE_TRANSACTION_FAILED',
  DATABASE_DUPLICATE_KEY: 'DATABASE_DUPLICATE_KEY',
  DATABASE_VALIDATION_ERROR: 'DATABASE_VALIDATION_ERROR',

  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  FILE_INVALID_TYPE: 'FILE_INVALID_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_SPOOFED: 'FILE_SPOOFED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',

  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_INVALID_AMOUNT: 'PAYMENT_INVALID_AMOUNT',
  PAYMENT_INSUFFICIENT_CREDITS: 'PAYMENT_INSUFFICIENT_CREDITS',
  PAYMENT_STRIPE_ERROR: 'PAYMENT_STRIPE_ERROR',
  PAYMENT_SUBSCRIPTION_INVALID: 'PAYMENT_SUBSCRIPTION_INVALID',

  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CSRF_TOKEN_INVALID: 'CSRF_TOKEN_INVALID',

  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
  EMAIL_VERIFICATION_FAILED: 'EMAIL_VERIFICATION_FAILED',

  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  SOCKET_ERROR: 'SOCKET_ERROR',
  SOCKET_RATE_LIMIT_EXCEEDED: 'SOCKET_RATE_LIMIT_EXCEEDED',

  ADMIN_ACCESS_REQUIRED: 'ADMIN_ACCESS_REQUIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
}

export const ErrorMessages = {
  [ErrorCodes.VALIDATION_FAILED]: 'Validation failed',
  [ErrorCodes.INVALID_INPUT]: 'Invalid input provided',
  [ErrorCodes.UNAUTHORIZED]: 'Unauthorized access',
  [ErrorCodes.FORBIDDEN]: 'Access denied',
  [ErrorCodes.NOT_FOUND]: 'Resource not found',
  [ErrorCodes.CONFLICT]: 'Resource already exists',
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 'An internal error occurred',

  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCodes.AUTH_ACCOUNT_LOCKED]: 'Account is locked due to multiple failed attempts',
  [ErrorCodes.AUTH_EMAIL_NOT_VERIFIED]: 'Email not verified',
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: 'Token has expired',
  [ErrorCodes.AUTH_TOKEN_INVALID]: 'Invalid token',
  [ErrorCodes.AUTH_NO_TOKEN]: 'No token provided',
  [ErrorCodes.AUTH_SESSION_INVALID]: 'Session invalid or expired',

  [ErrorCodes.USER_NOT_FOUND]: 'User not found',
  [ErrorCodes.USER_ALREADY_EXISTS]: 'User already exists',
  [ErrorCodes.USER_EMAIL_DUPLICATE]: 'Email already registered',
  [ErrorCodes.USER_PROFILE_INCOMPLETE]: 'Complete your profile first',
  [ErrorCodes.USER_ACCOUNT_DELETED]: 'Account has been deleted',

  [ErrorCodes.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCodes.DATABASE_TRANSACTION_FAILED]: 'Transaction failed',
  [ErrorCodes.DATABASE_DUPLICATE_KEY]: 'Duplicate record',
  [ErrorCodes.DATABASE_VALIDATION_ERROR]: 'Data validation failed',

  [ErrorCodes.FILE_UPLOAD_FAILED]: 'File upload failed',
  [ErrorCodes.FILE_INVALID_TYPE]: 'Invalid file type',
  [ErrorCodes.FILE_TOO_LARGE]: 'File is too large',
  [ErrorCodes.FILE_SPOOFED]: 'File content does not match declared type',
  [ErrorCodes.FILE_NOT_FOUND]: 'File not found',

  [ErrorCodes.PAYMENT_FAILED]: 'Payment processing failed',
  [ErrorCodes.PAYMENT_INVALID_AMOUNT]: 'Invalid payment amount',
  [ErrorCodes.PAYMENT_INSUFFICIENT_CREDITS]: 'Insufficient message credits',
  [ErrorCodes.PAYMENT_STRIPE_ERROR]: 'Payment provider error',
  [ErrorCodes.PAYMENT_SUBSCRIPTION_INVALID]: 'Invalid subscription',

  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later',
  [ErrorCodes.CSRF_TOKEN_INVALID]: 'CSRF token validation failed',

  [ErrorCodes.EMAIL_SEND_FAILED]: 'Failed to send email',
  [ErrorCodes.EMAIL_VERIFICATION_FAILED]: 'Email verification failed',

  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 'External service error',
  [ErrorCodes.SOCKET_ERROR]: 'Connection error',
  [ErrorCodes.SOCKET_RATE_LIMIT_EXCEEDED]: 'Too many socket events',

  [ErrorCodes.ADMIN_ACCESS_REQUIRED]: 'Admin access required',
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
}

export default ErrorCodes
