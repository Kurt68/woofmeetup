/**
 * Centralized Constants & Enums
 * Single source of truth for all constant values across the application
 * Eliminates magic strings scattered throughout codebase
 * Makes refactoring safe and easy
 */

// ============================================================================
// TOKEN & EXPIRY TIMES
// ============================================================================
export const TOKEN_EXPIRY = {
  VERIFICATION_EMAIL: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET: 60 * 60 * 1000, // 1 hour
  JWT: 7 * 24 * 60 * 60 * 1000, // 7 days
}

// ============================================================================
// USER SUBSCRIPTION TIERS
// ============================================================================
export const SUBSCRIPTION_TYPES = {
  FREE: 'free',
  PREMIUM: 'premium',
  VIP: 'vip',
}

export const SUBSCRIPTION_BENEFITS = {
  [SUBSCRIPTION_TYPES.FREE]: {
    messageCredits: 3,
    matchesPerDay: 10,
    description: 'Free tier - limited messages',
  },
  [SUBSCRIPTION_TYPES.PREMIUM]: {
    messageCredits: 100,
    matchesPerDay: null, // unlimited
    description: 'Premium subscription',
  },
  [SUBSCRIPTION_TYPES.VIP]: {
    messageCredits: 500,
    matchesPerDay: null, // unlimited
    description: 'VIP membership',
  },
}

// ============================================================================
// IMAGE UPLOAD CONFIGURATION
// ============================================================================
export const IMAGE_MIME_TYPES = {
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  WEBP: 'image/webp',
}

export const IMAGE_VALIDATION = {
  ALLOWED_TYPES: [IMAGE_MIME_TYPES.JPEG, IMAGE_MIME_TYPES.PNG, IMAGE_MIME_TYPES.WEBP],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_WIDTH: 2048,
  MAX_HEIGHT: 2048,
  THUMBNAIL_SIZE: 400,
  PROFILE_IMAGE_SIZE: 800,
}

// ============================================================================
// USER STATUSES
// ============================================================================
export const USER_STATUS = {
  ACTIVE: 'active',
  PENDING_VERIFICATION: 'pending_verification',
  DELETED: 'deleted',
  BANNED: 'banned',
}

// ============================================================================
// MESSAGE CONFIGURATION
// ============================================================================
export const MESSAGE_CONFIG = {
  MAX_LENGTH: 2000,
  MIN_LENGTH: 1,
  TYPING_INDICATOR_TIMEOUT: 3000, // 3 seconds
}

// ============================================================================
// MATCH STATUS
// ============================================================================
export const MATCH_STATUS = {
  PENDING: 'pending',
  MATCHED: 'matched',
  UNMATCHED: 'unmatched',
}

// ============================================================================
// RATE LIMITING CONFIGURATION
// ============================================================================
export const RATE_LIMITS = {
  LOGIN: {
    max: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many login attempts, please try again later',
  },
  SIGNUP: {
    max: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many signup attempts, please try again later',
  },
  PASSWORD_RESET: {
    max: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many password reset attempts, please try again later',
  },
  FORGOT_PASSWORD: {
    max: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many forgot password attempts, please try again later',
  },
  VERIFY_EMAIL: {
    max: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many verification attempts, please try again later',
  },
  MESSAGE_SENDING: {
    max: 30,
    windowMs: 60 * 1000, // 1 minute - prevent spam
    message: 'You are sending messages too quickly',
  },
  MESSAGE_RETRIEVAL: {
    max: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many message retrieval requests',
  },
  MESSAGE_DELETION: {
    max: 20,
    windowMs: 60 * 1000, // 1 minute
    message: 'You are deleting messages too quickly',
  },
  GENERAL: {
    max: 1000,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests, please try again later',
  },
  CSRF_TOKEN: {
    max: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  TURNSTILE: {
    max: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many CAPTCHA attempts',
  },
  DELETION_ENDPOINT: {
    max: 1,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours (one deletion per day)
    message: 'Account deletion already initiated, please wait 24 hours',
  },
}

// ============================================================================
// EMAIL CONFIGURATION
// ============================================================================
export const EMAIL_TEMPLATES = {
  VERIFICATION: 'verification',
  PASSWORD_RESET: 'password_reset',
  WELCOME: 'welcome',
  ACCOUNT_DELETION: 'account_deletion',
}

export const EMAIL_SUBJECTS = {
  [EMAIL_TEMPLATES.VERIFICATION]: 'Verify your Woof Meetup email',
  [EMAIL_TEMPLATES.PASSWORD_RESET]: 'Reset your Woof Meetup password',
  [EMAIL_TEMPLATES.WELCOME]: 'Welcome to Woof Meetup!',
  [EMAIL_TEMPLATES.ACCOUNT_DELETION]: 'Your Woof Meetup account has been deleted',
}

// ============================================================================
// STRIPE CONFIGURATION
// ============================================================================
export const STRIPE_PRICE_IDS = {
  PREMIUM: process.env.STRIPE_PREMIUM_PRICE_ID,
  VIP: process.env.STRIPE_VIP_PRICE_ID,
}

export const STRIPE_SUBSCRIPTION_NAMES = {
  [SUBSCRIPTION_TYPES.PREMIUM]: 'Premium Subscription',
  [SUBSCRIPTION_TYPES.VIP]: 'VIP Subscription',
}

// ============================================================================
// PAGINATION
// ============================================================================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
}

// ============================================================================
// DISTANCE FILTERING (for meetup preferences)
// ============================================================================
export const DISTANCE_OPTIONS = [5, 10, 25, 50, 100] // in miles

export const DEFAULT_DISTANCE = 10 // miles

// ============================================================================
// ERROR MESSAGES (User-facing, non-revealing)
// ============================================================================
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists',
  EMAIL_NOT_VERIFIED: 'Please verify your email first',
  INVALID_TOKEN: 'Invalid or expired token',
  SERVER_ERROR: 'An error occurred, please try again',
  NETWORK_ERROR: 'Network error, please check your connection',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Not found',
  VALIDATION_ERROR: 'Validation failed',
  INSUFFICIENT_CREDITS: 'Insufficient message credits',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
}

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================
export const SUCCESS_MESSAGES = {
  SIGNUP_COMPLETE: 'Signup successful! Check your email for verification link.',
  EMAIL_VERIFIED: 'Email verified successfully!',
  PASSWORD_RESET_SENT: 'Password reset link sent to your email',
  PASSWORD_CHANGED: 'Password changed successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  MESSAGE_SENT: 'Message sent successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
}

// ============================================================================
// SOCKET.IO EVENTS
// ============================================================================
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  USER_CONNECTED: 'user_connected',
  USER_DISCONNECTED: 'user_disconnected',

  // Messaging
  NEW_MESSAGE: 'newMessage',
  MESSAGE_READ: 'messageRead',
  TYPING: 'typing',
  STOP_TYPING: 'stopTyping',

  // Matching
  NEW_MATCH: 'newMatch',
  UNMATCH: 'unmatch',
  MATCH_NOTIFICATION: 'matchNotification',

  // Online status
  ONLINE_USERS: 'onlineUsers',
}

// ============================================================================
// AWS S3 CONFIGURATION
// ============================================================================
export const AWS_S3_CONFIG = {
  REGION: process.env.AWS_BUCKET_REGION || 'us-east-2',
  BUCKET: process.env.AWS_BUCKET_NAME,
  CLOUDFRONT_DOMAIN: process.env.CLOUDFRONT_DOMAIN,
  KEY_EXPIRY_SECONDS: 24 * 60 * 60, // 24 hours
}

// ============================================================================
// EXPORT GROUPS FOR CONVENIENCE
// ============================================================================
export const CONSTANTS = {
  TOKEN_EXPIRY,
  SUBSCRIPTION_TYPES,
  USER_STATUS,
  MATCH_STATUS,
  RATE_LIMITS,
  EMAIL_TEMPLATES,
  MESSAGE_CONFIG,
  PAGINATION,
  DISTANCE_OPTIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  SOCKET_EVENTS,
  IMAGE_VALIDATION,
}

export default CONSTANTS
