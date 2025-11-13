import express from 'express'
import { body } from 'express-validator'
import multer from 'multer'
import { verifyToken } from '../middleware/verifyToken.js'
import { checkMessageLimit } from '../middleware/checkMessageLimit.js'
import {
  validateParamUserId,
  validatePaginationParams,
} from '../middleware/validateInput.js'
import { csrfProtection } from '../middleware/csrf.js'
import {
  messageRetrievalLimiter,
  messageSendingLimiter,
  messageDeletionLimiter,
} from '../middleware/rateLimiter.js'
import {
  getMessages,
  sendMessage,
  deleteMessages,
} from '../controllers/message.controller.js'

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/svg+xml',
      'image/webp',
    ]
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid image format'))
    }
  },
})

// Security: Validate user ID from URL parameter to prevent NoSQL injection
// Security: Validate pagination parameters to prevent DoS and injection attacks
// Security: Rate limit message retrieval to prevent enumeration and DoS attacks
router.get(
  '/:id',
  verifyToken,
  messageRetrievalLimiter,
  validateParamUserId('id'),
  validatePaginationParams(),
  getMessages
)

// Security: Apply CSRF protection to message sending
// Security: Apply rate limiting to prevent spam and message bombing attacks
// Support both JSON (base64) and multipart FormData (binary) image uploads
router.post(
  '/send/:id',
  csrfProtection,
  verifyToken,
  messageSendingLimiter,
  validateParamUserId('id'),
  upload.single('image'),
  body('text')
    .optional()
    .trim()
    .if((value) => value && value.length > 0) // Only validate length if text is provided
    // SECURITY FIX: Enhanced input sanitization for message text
    // Remove null bytes and control characters that could cause issues
    .customSanitizer((value) => {
      if (!value) return value
      // Remove null bytes and other control characters
      // Allow only safe printable characters, newlines, and tabs
      return value
        .replace(/\x00/g, '') // Remove null bytes
        .replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove other control chars
        .replace(/\s+/g, ' ') // Normalize whitespace (multiple spaces to single)
        .trim() // Remove leading/trailing whitespace
    })
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters')
    .escape(),
  body('image')
    .optional()
    .custom((value) => {
      if (!value) return true
      if (typeof value !== 'string') return true
      // Validate base64 format (for JSON requests)
      // Allow data URLs like: data:image/svg+xml;base64,... or data:image/png;base64,...
      // Also allow raw base64 strings
      const isDataUrl = /^data:image\/[a-z+\-]+;base64,/.test(value)
      const isRawBase64 = /^[A-Za-z0-9+/\s=]*$/.test(value)

      if (!isDataUrl && !isRawBase64) {
        throw new Error('Image must be valid base64 format')
      }
      // Validate size (5MB limit)
      const sizeInBytes =
        Math.ceil((value.length * 3) / 4) -
        (value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0)
      if (sizeInBytes > 5 * 1024 * 1024) {
        throw new Error('Image must not exceed 5MB')
      }
      return true
    }),
  checkMessageLimit,
  sendMessage
)

// Security: Apply CSRF protection to message deletion
// Security: Apply rate limiting to prevent message scrubbing attacks
router.delete(
  '/:id',
  csrfProtection,
  verifyToken,
  messageDeletionLimiter,
  validateParamUserId('id'),
  deleteMessages
)

export default router
