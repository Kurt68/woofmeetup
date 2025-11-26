/**
 * Magic Bytes File Signature Validation
 * Prevents file type spoofing by checking actual file signatures (magic bytes)
 * instead of just MIME type headers which can be easily forged
 *
 * Security: Defense against disguised executable files uploaded as images
 */

/**
 * Magic byte signatures for allowed image formats
 * Each signature is checked at the beginning of the file buffer
 */
const MAGIC_BYTES = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/jpg': [0xff, 0xd8, 0xff], // Same as JPEG (common variant)
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF (WebP starts with RIFF)
}

/**
 * Validates file magic bytes to ensure file type matches MIME type
 * Prevents attacks where executable files are renamed with image extensions
 *
 * @param {Buffer} buffer - File buffer to validate
 * @param {string} mimeType - Declared MIME type from upload
 * @returns {boolean} - True if magic bytes match MIME type
 */
export const validateMagicBytes = (buffer, mimeType) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return false
  }

  // Normalize MIME type to lowercase to handle browser inconsistencies (e.g., image/JPG vs image/jpg)
  const normalizedMimeType = mimeType.toLowerCase()

  // Get expected magic bytes for this MIME type
  const expectedBytes = MAGIC_BYTES[normalizedMimeType]

  if (!expectedBytes) {
    return false // MIME type not in allowed list
  }

  // Check if buffer starts with expected magic bytes
  for (let i = 0; i < expectedBytes.length; i++) {
    if (buffer[i] !== expectedBytes[i]) {
      return false
    }
  }

  // Additional validation for WebP: check for "WEBP" signature at position 8
  if (normalizedMimeType === 'image/webp') {
    const webpSignature = buffer.subarray(8, 12).toString('ascii')
    if (webpSignature !== 'WEBP') {
      return false
    }
  }

  return true
}

/**
 * Get MIME type from file magic bytes
 * Useful for verifying uploaded MIME type matches actual file content
 *
 * @param {Buffer} buffer - File buffer to check
 * @returns {string|null} - Detected MIME type or null if unknown
 */
export const detectMimeTypeFromMagicBytes = (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 4) {
    return null
  }

  // Check JPEG (0xFF D8 FF)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }

  // Check PNG (0x89 50 4E 47)
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png'
  }

  // Check GIF (0x47 49 46)
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'image/gif'
  }

  // Check WebP (RIFF + WEBP at position 8)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.length >= 12
  ) {
    const webpSignature = buffer.subarray(8, 12).toString('ascii')
    if (webpSignature === 'WEBP') {
      return 'image/webp'
    }
  }

  return null
}
