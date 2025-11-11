/**
 * Converts text to sentence case (first letter uppercase, rest lowercase)
 * @param {string} text - The text to convert
 * @returns {string} - The formatted text
 */
export const formatSentenceCase = (text) => {
  if (typeof text !== 'string' || text.length === 0) return text
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}
