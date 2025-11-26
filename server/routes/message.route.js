import express from 'express'
import { body } from 'express-validator'
import multer from 'multer'
import { verifyToken } from '../middleware/verifyToken.js'
import { checkMessageLimit } from '../middleware/checkMessageLimit.js'
import { validateParamUserId, validatePaginationParams } from '../middleware/validateInput.js'
import { csrfProtection } from '../middleware/csrf.js'
import {
  messageRetrievalLimiter,
  messageSendingLimiter,
  messageDeletionLimiter,
} from '../middleware/rateLimiter.js'
import AppError from '../utilities/AppError.js'
import { ErrorCodes } from '../constants/errorCodes.js'
import { getMessages, sendMessage, deleteMessages } from '../controllers/message.controller.js'

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
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
    .customSanitizer((value) => {
      if (!value) {
        return ''
      }
      // Remove null bytes and other control characters
      return String(value)
        .trim()
        // eslint-disable-next-line no-control-regex
        .replace(/\x00/g, '')
        // eslint-disable-next-line no-control-regex
        .replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    })
    .optional({ checkFalsy: true })
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message text must be between 1 and 2000 characters')
    .escape(),
  // For JSON requests with base64 image, validate the body field
  // For multipart requests, multer handles file validation via fileFilter and size limit
  body('image')
    .optional()
    .custom((value) => {
      // Skip validation if using multipart (image is in req.file, not req.body.image)
      if (!value) {
        return true
      }
      // Only validate if it's a string (JSON base64 request)
      if (typeof value !== 'string') {
        return true
      }

      // Validate base64 format (for JSON requests)
      const isDataUrl = /^data:image\/[a-z+-]+;base64,/.test(value)
      const isRawBase64 = /^[A-Za-z0-9+/\s=]*$/.test(value)
      if (!isDataUrl && !isRawBase64) {
        throw AppError.badRequest(ErrorCodes.FILE_INVALID_TYPE, 'Image must be valid base64 format')
      }

      // Validate size (5MB limit)
      const sizeInBytes =
        Math.ceil((value.length * 3) / 4) - (value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0)
      if (sizeInBytes > 5 * 1024 * 1024) {
        throw AppError.badRequest(ErrorCodes.FILE_INVALID_TYPE, 'Image must not exceed 5MB')
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
