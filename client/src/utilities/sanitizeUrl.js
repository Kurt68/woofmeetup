/**
 * XSS Prevention Utilities for URL/Image Sanitization
 * Prevents malicious URLs like javascript:, data:, and other attack vectors
 */

/**
 * Sanitizes image URLs to prevent XSS attacks
 * - Blocks javascript: and data: URIs
 * - Blocks object: and vbscript: URIs
 * - Validates that URL is a safe HTTP(S) URL or relative path
 *
 * @param {string} url - The URL to sanitize
 * @param {string} fallback - Fallback URL if sanitization fails
 * @returns {string} - Safe URL or fallback
 */
export const sanitizeImageUrl = (url, fallback = '/spinner.svg') => {
  // If no URL provided, return fallback
  if (!url || typeof url !== 'string') {
    return fallback
  }

  // Trim whitespace
  const trimmedUrl = url.trim()

  // If empty string, return fallback
  if (trimmedUrl.length === 0) {
    return fallback
  }

  // Check for dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
  ]

  const lowerUrl = trimmedUrl.toLowerCase()
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      console.warn(`Blocked potentially dangerous URL: ${protocol}...`)
      return fallback
    }
  }

  // Allow relative paths (starting with / or ../)
  if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('../')) {
    return trimmedUrl
  }

  // Allow HTTP(S) URLs
  if (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://')) {
    return trimmedUrl
  }

  // Allow blob URLs (safe - created by browser from user-selected files)
  if (lowerUrl.startsWith('blob:')) {
    return trimmedUrl
  }

  // If URL doesn't match safe patterns, return fallback
  console.warn(`Blocked potentially unsafe URL: ${trimmedUrl}`)
  return fallback
}

/**
 * Validates if a URL is safe to use in img src attribute
 * Returns false for dangerous patterns, true for safe URLs
 *
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if URL is safe, false otherwise
 */
export const isImageUrlSafe = (url) => {
  if (!url || typeof url !== 'string') {
    return false
  }

  const trimmedUrl = url.trim()

  // Empty string is not safe
  if (trimmedUrl.length === 0) {
    return false
  }

  // Check for dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
  ]

  const lowerUrl = trimmedUrl.toLowerCase()
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return false
    }
  }

  // Relative paths are safe
  if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('../')) {
    return true
  }

  // HTTP(S) URLs are safe
  if (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://')) {
    return true
  }

  // Blob URLs are safe (created by browser from user-selected files)
  if (lowerUrl.startsWith('blob:')) {
    return true
  }

  // Default to unsafe
  return false
}

/**
 * Sanitizes error messages to prevent XSS
 * Removes any HTML tags or script content
 *
 * @param {string} message - The message to sanitize
 * @returns {string} - Safe text message
 */
export const sanitizeErrorMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return ''
  }

  // Remove any HTML tags
  return message
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

/**
 * Sanitizes user-provided text to prevent XSS
 * Should be used for any user-generated content displayed in the UI
 *
 * @param {string} text - The text to sanitize
 * @returns {string} - Safe text
 */
export const sanitizeUserText = (text) => {
  if (!text || typeof text !== 'string') {
    return ''
  }

  // Remove any HTML tags and script content
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

/**
 * Creates a safe image element with error handling
 * Use this when you need to render an image with fallback
 *
 * @param {string} src - Source URL
 * @param {string} fallback - Fallback URL
 * @param {object} additionalProps - Additional properties to pass
 * @returns {object} - Props object safe for <img> element
 */
export const createSafeImageProps = (
  src,
  fallback = '/spinner.svg',
  additionalProps = {}
) => {
  const safeUrl = sanitizeImageUrl(src, fallback)

  return {
    src: safeUrl,
    onError: (e) => {
      // If image fails to load, use fallback
      e.target.src = fallback
    },
    ...additionalProps,
  }
}
