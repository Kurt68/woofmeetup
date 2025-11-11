/**
 * Environment Variables Validation
 *
 * SECURITY FIX: Validates that all required environment variables are set at startup
 * Prevents cryptic runtime errors and ensures configuration is complete before server starts
 */

import { logError, logInfo, logWarning } from './logger.js'

/**
 * List of required environment variables
 * Add new required variables here
 */
const REQUIRED_ENV_VARS = ['MONGODB_URI', 'JWT_SECRET', 'PORT', 'NODE_ENV']

/**
 * List of environment variables required only in production
 */
const PRODUCTION_ONLY_ENV_VARS = [
  'STRIPE_SECRET_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'TURNSTILE_SECRET_KEY', // Client-side VITE_TURNSTILE_SITE_KEY is not needed on server
  'MAILTRAP_TOKEN',
  'OPENAI_API_KEY',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_BUCKET_NAME',
  'AWS_BUCKET_REGION',
  'CLOUDFRONT_DOMAIN',
  'CLOUDFRONT_PRIVATE_KEY',
  'CLOUDFRONT_KEY_PAIR_ID',
]

/**
 * List of optional environment variables with defaults
 */
const OPTIONAL_ENV_VARS = {
  'CLIENT_URL': 'http://localhost:5173',
  'REDIS_URL': null, // Optional for single-server deployments
}

/**
 * Validate environment variables at startup
 * Logs warnings for missing optional variables and errors for missing required ones
 *
 * @throws {Error} If critical environment variables are missing
 */
export const validateEnvironmentVariables = () => {
  const errors = []
  const warnings = []

  logInfo('env-validator', 'Validating environment variables...')

  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`)
    }
  }

  // Check production-only variables if in production
  if (process.env.NODE_ENV === 'production') {
    for (const envVar of PRODUCTION_ONLY_ENV_VARS) {
      if (!process.env[envVar]) {
        errors.push(`Missing production environment variable: ${envVar}`)
      }
    }
  }

  // Check optional variables and log warnings if missing
  for (const [envVar, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[envVar]) {
      if (process.env.NODE_ENV === 'production' && envVar === 'REDIS_URL') {
        // This is handled in the rate limiter, just log at info level
        logInfo(
          'env-validator',
          `Optional ${envVar} not configured. Using in-memory rate limiting (single-server only).`
        )
      } else if (defaultValue !== null) {
        warnings.push(`${envVar} not set, using default: ${defaultValue}`)
      }
    }
  }

  // Validate specific variable formats
  if (
    process.env.NODE_ENV &&
    !['development', 'production', 'test'].includes(process.env.NODE_ENV)
  ) {
    errors.push(
      `NODE_ENV must be 'development', 'production', or 'test', got: ${process.env.NODE_ENV}`
    )
  }

  if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
    errors.push(`PORT must be a valid number, got: ${process.env.PORT}`)
  }

  // Log warnings
  for (const warning of warnings) {
    logWarning('env-validator', warning)
  }

  // Throw error if any required variables are missing
  if (errors.length > 0) {
    const errorMsg = `Environment validation failed:\n${errors
      .map((e) => `  - ${e}`)
      .join('\n')}`
    logError(
      'env-validator',
      'Environment validation failed',
      new Error(errorMsg)
    )
    throw new Error(errorMsg)
  }

  logInfo(
    'env-validator',
    `✅ All required environment variables validated (${REQUIRED_ENV_VARS.length} required + ${PRODUCTION_ONLY_ENV_VARS.length} production)`
  )
}
