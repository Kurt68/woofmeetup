import { logError } from './logger.js'

/**
 * Parse CloudFront private key from environment variable
 * PEM keys stored in environment variables may have literal \n sequences
 * that need to be converted to actual newlines
 *
 * @param {string} keyFromEnv - Raw private key from environment variable
 * @returns {string} Properly formatted private key with actual newlines
 * @throws {Error} If key is invalid or missing
 */
export const parseCloudFrontPrivateKey = (keyFromEnv) => {
  if (!keyFromEnv) {
    throw new Error('CLOUDFRONT_PRIVATE_KEY environment variable is not set')
  }

  // If the key contains literal \n sequences, convert them to actual newlines
  // This handles keys stored as: "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----"
  let processedKey = keyFromEnv

  // Replace literal \n sequences with actual newlines
  if (processedKey.includes('\\n')) {
    processedKey = processedKey.replace(/\\n/g, '\n')
  }

  // Validate that the key has proper PEM format (supports both RSA and PKCS#8 formats)
  const hasBeginMarker = processedKey.includes('BEGIN') && 
    (processedKey.includes('PRIVATE KEY') || processedKey.includes('RSA PRIVATE KEY'))
  const hasEndMarker = processedKey.includes('END') && 
    (processedKey.includes('PRIVATE KEY') || processedKey.includes('RSA PRIVATE KEY'))
  
  if (!hasBeginMarker || !hasEndMarker) {
    logError(
      'cloudFrontKeyParser',
      'Invalid CloudFront private key format - missing PEM markers'
    )
    throw new Error(
      'Invalid CloudFront private key format. Must be a valid PEM-formatted private key.'
    )
  }

  return processedKey
}

/**
 * Get the properly formatted CloudFront private key
 * Caches the result to avoid re-parsing on every call
 *
 * @returns {string} Properly formatted private key
 */
let cachedPrivateKey = null

export const getCloudFrontPrivateKey = () => {
  if (!cachedPrivateKey) {
    try {
      if (!process.env.CLOUDFRONT_PRIVATE_KEY) {
        const error = new Error(
          'CLOUDFRONT_PRIVATE_KEY environment variable is not set - CloudFront signed URLs will not be generated'
        )
        logError('cloudFrontKeyParser', 'CloudFront private key not configured', {
          nodeEnv: process.env.NODE_ENV,
          hasKey: !!process.env.CLOUDFRONT_PRIVATE_KEY,
        })
        throw error
      }
      cachedPrivateKey = parseCloudFrontPrivateKey(process.env.CLOUDFRONT_PRIVATE_KEY)
    } catch (error) {
      logError('cloudFrontKeyParser', 'Failed to parse CloudFront private key', {
        error: error.message,
        nodeEnv: process.env.NODE_ENV,
      })
      throw error
    }
  }
  return cachedPrivateKey
}
