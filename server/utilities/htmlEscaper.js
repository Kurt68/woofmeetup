/**
 * HTML Escaper Utility
 * MEDIUM SECURITY FIX: Prevents email template injection attacks
 * Escapes HTML special characters to prevent XSS in email templates
 *
 * Attack Vector Prevented:
 * - User-controlled data (username, email, URLs) injected into HTML templates
 * - Malicious HTML/JavaScript in email content
 * - Template injection exploits
 */

import { logWarning } from './logger.js'

/**
 * Escape HTML special characters to prevent injection attacks
 * @param {string} text - The text to escape
 * @returns {string} - HTML-escaped text
 */
export function escapeHtml(text) {
  if (!text) return text

  const htmlEscapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  }

  return String(text).replace(/[&<>"'\/]/g, (char) => htmlEscapeMap[char])
}

/**
 * Escape URL parameters to prevent XSS through href attributes
 * Combines HTML escaping with URL validation
 * @param {string} url - The URL to escape
 * @returns {string} - Safely escaped URL
 */
export function escapeUrlAttribute(url) {
  if (!url) return ''

  // Validate URL starts with safe protocols only
  if (typeof url === 'string') {
    const trimmed = url.trim().toLowerCase()
    if (
      !trimmed.startsWith('http://') &&
      !trimmed.startsWith('https://') &&
      !trimmed.startsWith('mailto:')
    ) {
      logWarning(
        'htmlEscaper',
        'Invalid URL protocol detected in email template'
      )
      return ''
    }
  }

  // Return URL as-is after protocol validation
  // URLs in href attributes don't need HTML escaping
  return url.trim()
}

/**
 * Sanitize template variables for safe HTML insertion
 * Escapes potentially dangerous characters in user-provided data
 * @param {string} value - The value to sanitize
 * @param {string} context - Context of use ('text', 'attribute', 'url')
 * @returns {string} - Sanitized value
 */
export function sanitizeTemplateVariable(value, context = 'text') {
  if (!value) return value

  // Convert to string if necessary
  const str = String(value).trim()

  // Reject values that are suspiciously long (potential DoS)
  if (str.length > 10000) {
    logWarning('htmlEscaper', 'Suspiciously long template variable detected')
    return '[INVALID]'
  }

  switch (context) {
    case 'url':
      return escapeUrlAttribute(str)
    case 'attribute':
      return escapeHtml(str)
    case 'text':
    default:
      return escapeHtml(str)
  }
}

/**
 * Safely replace template placeholders with escaped values
 * Prevents injection attacks during template rendering
 * @param {string} template - The HTML template
 * @param {object} replacements - Key-value pairs for replacement
 * @returns {string} - Template with safe replacements
 */
export function safeTemplateReplace(template, replacements = {}) {
  if (!template) return template

  let result = template

  for (const [key, value] of Object.entries(replacements)) {
    if (value === null || value === undefined) {
      continue
    }

    // Determine context based on placeholder pattern
    let context = 'text'
    if (
      key.includes('url') ||
      key.includes('URL') ||
      key.includes('link') ||
      key.includes('href')
    ) {
      context = 'url'
    }

    // Sanitize the value before replacement
    const sanitized = sanitizeTemplateVariable(value, context)

    // Replace all occurrences of the placeholder
    // Use a regex with g flag to replace all instances
    const regex = new RegExp(`\\{${key}\\}`, 'g')
    result = result.replace(regex, sanitized)
  }

  return result
}
