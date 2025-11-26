import express from 'express'
import {
  login,
  logout,
  signup,
  verifyEmail,
  forgotPassword,
  resetPassword,
  checkAuth,
  getMatches,
  getUser,
  getMeetupTypeUsers,
  getCurrentPosition,
  putUser,
  updateMatches,
  removeMatch,
  uploadImage,
  uploadProfileImage,
  getCurrentUserProfile,
  patchCurrentUserProfile,
  deleteImage,
  deleteOneUser,
  putUserSelectDistance,
  triggerScheduledDeletionJob,
  getPublicProfile,
  updateProfileVisibility,
  getReferralStats,
} from '../controllers/auth.controller.js'
import { verifyToken } from '../middleware/verifyToken.js'
import { checkAdminRole } from '../middleware/checkAdminRole.js'
import { sendValidationError } from '../utils/ApiResponse.js'
import {
  deletionEndpointLimiter,
  loginLimiter,
  signupLimiter,
  passwordResetLimiter,
  forgotPasswordLimiter,
  verifyEmailLimiter,
  generalLimiter,
  checkAuthLimiter,
  userEnumerationLimiter,
  addCoordinatesLimiter,
} from '../middleware/rateLimiter.js'
import {
  validateBodyUserIds,
  validateQueryUserId,
  validateResetTokenParam,
  validatePaginationParams,
  validateNumericRangeQuery,
} from '../middleware/validateInput.js'
import { body } from 'express-validator'
import multer, { memoryStorage } from 'multer'
// Security: CSRF protection for all state-changing operations
import { csrfProtection } from '../middleware/csrf.js'
// Security: Magic bytes validation to prevent file spoofing
import { validateMagicBytes } from '../utilities/magicBytesValidator.js'

const storage = memoryStorage()

// SECURITY FIX #2: Enhanced File Upload Validation
// Prevents MIME type spoofing and DoS attacks via unlimited file uploads
// Whitelist approach: Only explicitly allowed MIME types are accepted
const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', // Common variant for JPEG files
  'image/png',
  'image/webp',
  'image/gif',
]

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 1, // Only 1 file at a time
  },
  fileFilter: (req, file, cb) => {
    // SECURITY: Strict MIME type whitelist to prevent spoofing
    // Normalize MIME type to lowercase to handle browser inconsistencies (e.g., image/JPG vs image/jpg)
    // Instead of checking startsWith('image/'), explicitly allow only known types
    const normalizedMimeType = file.mimetype.toLowerCase()

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(normalizedMimeType)) {
      return cb(
        new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`),
        false
      )
    }

    // SECURITY: Additional filename validation to prevent directory traversal
    // Filenames should not contain path separators or suspicious characters
    if (file.originalname.includes('/') || file.originalname.includes('\\')) {
      return cb(new Error('Invalid filename'), false)
    }

    // NOTE: Magic bytes validation moved to middleware AFTER multer
    // file.buffer is not available in fileFilter with memoryStorage
    // It's only populated after fileFilter passes and file is stored in memory
    cb(null, true)
  },
})

const router = express.Router()

// SECURITY: Wrapper to handle multer errors
const multerErrorHandler = (middleware) => {
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (err) {
        return sendValidationError(
          res,
          [{ path: 'file', msg: err.message || 'File upload validation failed' }],
          'File upload failed'
        )
      }
      next()
    })
  }
}

// SECURITY: Middleware to validate magic bytes AFTER multer processes the file
// file.buffer is only available after multer stores the file in memory
const validateMagicBytesMiddleware = (req, res, next) => {
  if (!req.file) {
    // No file uploaded, let the next handler deal with it
    return next()
  }

  const normalizedMimeType = req.file.mimetype.toLowerCase()

  if (!validateMagicBytes(req.file.buffer, normalizedMimeType)) {
    return sendValidationError(
      res,
      [{ path: 'file', msg: 'File content does not match declared type. Possible spoofed file.' }],
      'Invalid file'
    )
  }

  next()
}

// Security: Apply rate limiting to prevent DoS attacks on authentication check
// Using dedicated checkAuthLimiter (50/5min) instead of generalLimiter to allow legitimate polling
router.get('/check-auth', checkAuthLimiter, verifyToken, checkAuth)

// Update profile visibility (public/private)
// Requires authentication and CSRF protection
router.patch(
  '/profile-visibility',
  csrfProtection,
  verifyToken,
  generalLimiter,
  updateProfileVisibility
)

// Public endpoint to fetch a user's public profile for SEO and sharing
// No authentication required - this is intentional for public profile pages
router.get('/public-profile/:userId', generalLimiter, getPublicProfile)
// Security: Apply authentication and stricter rate limiting to prevent unauthorized access
// CRITICAL FIX: Added verifyToken middleware to require authentication
// Using userEnumerationLimiter (5/5min) to prevent attackers from discovering user IDs
router.get('/users', verifyToken, userEnumerationLimiter, validatePaginationParams(100), getMatches)
// Security: Apply rate limiting and validate query parameters to prevent NoSQL injection and unauthorized access
router.get('/user', verifyToken, generalLimiter, validateQueryUserId('userId'), getUser)
// Security: Apply rate limiting, validate pagination and distance parameters to prevent DoS and injection attacks
router.get(
  '/meetup-type-users',
  verifyToken,
  generalLimiter,
  validatePaginationParams(100),
  validateQueryUserId('userId'),
  validateNumericRangeQuery('selectDistance', 1, 500, 'Distance'),
  getMeetupTypeUsers
)
// Security: Apply rate limiting and validate query parameters to prevent DoS and NoSQL injection attacks
router.get(
  '/current-user-profile',
  verifyToken,
  generalLimiter,
  validateQueryUserId('userId'),
  getCurrentUserProfile
)

// Security: Apply rate limiting to signup endpoint to prevent account enumeration and spam
// Security: Apply CSRF protection to prevent cross-site form submission attacks
router.post(
  '/signup',
  csrfProtection,
  signupLimiter,
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .trim()
    .isLength({ max: 254 })
    .withMessage('Email must not exceed 254 characters'),
  body('password')
    .isStrongPassword({
      minLength: 10,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      returnScore: false,
      pointsPerUnique: 1,
      pointsPerRepeat: 0.5,
      pointsForContainingLower: 10,
      pointsForContainingUpper: 10,
      pointsForContainingNumber: 10,
      pointsForContainingSymbol: 10,
    })
    .withMessage(
      'Password must be at least 10 characters with uppercase, lowercase, numbers, and symbols'
    ),
  body('userName')
    .notEmpty()
    .withMessage('Username is required')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Username must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  signup
)

// Security: Apply rate limiting to login endpoint to prevent brute force attacks
// Security: Validate email and password format to prevent malformed inputs
// Security: Apply CSRF protection to prevent cross-site form submission attacks
router.post(
  '/login',
  csrfProtection,
  loginLimiter,
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .trim()
    .isLength({ max: 254 })
    .withMessage('Email must not exceed 254 characters'),
  body('password').notEmpty().withMessage('Password is required'),
  login
)
// Security: Apply CSRF protection to logout endpoint
router.post('/logout', csrfProtection, logout)

// Security: Apply rate limiting to verify email endpoint to prevent brute force verification
// Security: Apply CSRF protection to prevent cross-site form submission attacks
router.post('/verify-email', csrfProtection, verifyEmailLimiter, verifyEmail)

// Security: Apply rate limiting to forgot password endpoint to prevent account enumeration
// Security: Validate email format to prevent malformed inputs and injection attempts
// Security: Apply CSRF protection to prevent cross-site form submission attacks
router.post(
  '/forgot-password',
  csrfProtection,
  forgotPasswordLimiter,
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .trim()
    .isLength({ max: 254 })
    .withMessage('Email must not exceed 254 characters'),
  forgotPassword
)

// Security: Apply rate limiting to password reset endpoint to prevent brute force token guessing
// Security: Validate reset token format to prevent NoSQL injection
// Security: Validate password strength to prevent weak password resets
// Security: Apply CSRF protection to prevent cross-site form submission attacks
router.post(
  '/reset-password/:token',
  csrfProtection,
  validateResetTokenParam('token'),
  passwordResetLimiter,
  body('password')
    .isStrongPassword({
      minLength: 10,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      returnScore: false,
      pointsPerUnique: 1,
      pointsPerRepeat: 0.5,
      pointsForContainingLower: 10,
      pointsForContainingUpper: 10,
      pointsForContainingNumber: 10,
      pointsForContainingSymbol: 10,
    })
    .withMessage(
      'Password must contain at least 10 characters with uppercase, lowercase, numbers, and symbols'
    ),
  resetPassword
)

// Security: Apply CSRF protection and rate limiting to state-changing operations
// Added addCoordinatesLimiter to prevent abuse of location updates (10/5min prod)
router.put(
  '/addcoordinates',
  csrfProtection,
  verifyToken,
  addCoordinatesLimiter,
  getCurrentPosition
)
// Security: Add comprehensive input validation to PUT user profile endpoint
// Prevents injection attacks, XSS, and data integrity issues
router.put(
  '/user',
  csrfProtection,
  verifyToken,
  body('formData').isObject().withMessage('Form data must be an object'),
  body('formData.dogs_name')
    .notEmpty()
    .withMessage('Dog name is required')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Dog name must not exceed 50 characters')
    .matches(/^[a-zA-Z0-9\s\-']*$/)
    .withMessage('Dog name contains invalid characters'),
  body('formData.age')
    .notEmpty()
    .withMessage('Dog age is required')
    .isInt({ min: 1, max: 30 })
    .withMessage('Dog age must be between 1 and 30'),
  body('formData.userAge')
    .optional({ checkFalsy: true })
    .trim()
    .isInt({ min: 13, max: 120 })
    .withMessage('User age must be between 13 and 120'),
  body('formData.about')
    .notEmpty()
    .withMessage('Dog description is required')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Dog description must not exceed 500 characters')
    .matches(/^[a-zA-Z0-9\s\.\,\-\'\"\!\?]*$/)
    .withMessage('Dog description contains invalid characters'),
  body('formData.userAbout')
    .notEmpty()
    .withMessage('Tell us about yourself and your dog')
    .trim()
    .isLength({ max: 500 })
    .withMessage('User description must not exceed 500 characters')
    .matches(/^[a-zA-Z0-9\s\.\,\-\'\"\!\?]*$/)
    .withMessage('User description contains invalid characters'),
  body('formData.meetup_type')
    .notEmpty()
    .withMessage('meetup_type is required')
    .isIn(['Play Dates', 'Exercise Buddy', 'Walk Companion'])
    .withMessage('Invalid meetup type'),
  body('formData.show_meetup_type').isBoolean().withMessage('show_meetup_type must be a boolean'),
  body('formData.meetup_interest')
    .notEmpty()
    .withMessage('meetup_interest is required')
    .isIn(['Play Dates', 'Exercise Buddy', 'Walk Companion', 'Show all meetup activites'])
    .withMessage('Invalid meetup interest'),
  body('formData.current_user_search_radius')
    .isInt({ min: 1, max: 100 })
    .withMessage('Search radius must be between 1 and 100 miles'),
  putUser
)
// Security: Validate user IDs to prevent NoSQL injection
// Security: Apply CSRF protection to prevent cross-site form submission attacks
router.put(
  '/addmatch',
  csrfProtection,
  verifyToken,
  validateBodyUserIds(['userId', 'matchedUserId']),
  updateMatches
)
router.put(
  '/removematch',
  csrfProtection,
  verifyToken,
  validateBodyUserIds(['userId', 'matchedUserId']),
  removeMatch
)

router.put(
  '/image',
  csrfProtection,
  verifyToken,
  multerErrorHandler(upload.single('image')),
  validateMagicBytesMiddleware,
  uploadImage
)

router.put(
  '/profile-image',
  csrfProtection,
  verifyToken,
  multerErrorHandler(upload.single('image')),
  validateMagicBytesMiddleware,
  uploadProfileImage
)
router.put('/user-select-distance', csrfProtection, verifyToken, putUserSelectDistance)

// Security: Add comprehensive input validation to profile update endpoint
// Prevents injection attacks, XSS, and data integrity issues
router.patch(
  '/user',
  csrfProtection,
  verifyToken,
  body('formData').isObject().withMessage('Form data must be an object'),
  body('formData.dogs_name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Dog name must not exceed 50 characters')
    .matches(/^[a-zA-Z0-9\s\-']*$/)
    .withMessage('Dog name contains invalid characters'),
  body('formData.age')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 30 })
    .withMessage('Dog age must be between 1 and 30'),
  body('formData.userAge')
    .optional({ checkFalsy: true })
    .isInt({ min: 13, max: 120 })
    .withMessage('User age must be between 13 and 120'),
  body('formData.about')
    .trim()
    .notEmpty()
    .withMessage('Dog description is required')
    .isLength({ max: 500 })
    .withMessage('Dog description must not exceed 500 characters')
    .matches(/^[a-zA-Z0-9\s\.\,\-\'\"\!\?]*$/)
    .withMessage('Dog description contains invalid characters'),
  body('formData.userAbout')
    .trim()
    .notEmpty()
    .withMessage('About you is required')
    .isLength({ max: 500 })
    .withMessage('User description must not exceed 500 characters')
    .matches(/^[a-zA-Z0-9\s\.\,\-\'\"\!\?]*$/)
    .withMessage('User description contains invalid characters'),
  body('formData.meetup_type')
    .optional()
    .isIn(['Play Dates', 'Exercise Buddy', 'Walk Companion'])
    .withMessage('Invalid meetup type'),
  body('formData.show_meetup_type')
    .optional()
    .isBoolean()
    .withMessage('show_meetup_type must be a boolean'),
  body('formData.meetup_interest')
    .optional()
    .isIn(['Play Dates', 'Exercise Buddy', 'Walk Companion', 'Show all meetup activites'])
    .withMessage('Invalid meetup interest'),
  body('formData.current_user_search_radius')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 100 })
    .withMessage('Search radius must be between 1 and 100 miles'),
  patchCurrentUserProfile
)

// Security: Apply CSRF protection, validate query parameters to prevent NoSQL injection and unauthorized image deletion
router.delete('/image', csrfProtection, verifyToken, validateQueryUserId('userId'), deleteImage)
// Security: Apply CSRF protection, validate query parameters to prevent NoSQL injection and unauthorized account deletion
router.delete(
  '/delete-one-user',
  csrfProtection,
  verifyToken,
  validateQueryUserId('userId'),
  deleteOneUser
)

// Endpoint to manually trigger scheduled deletion cron job
// Protected with authentication, admin role check, and rate limiting
// Security: Apply CSRF protection to prevent cross-site form submission attacks
// Development bypass: Allows testing with X-Dev-Trigger header in development mode
const triggerScheduledDeletionRoute = (req, res, next) => {
  // Development-only bypass: Allow requests with special header in dev mode
  if (
    process.env.NODE_ENV === 'development' &&
    req.headers['x-dev-trigger'] === 'scheduled-deletion'
  ) {
    return triggerScheduledDeletionJob(req, res)
  }

  // Production path: Requires CSRF, auth, and admin role
  csrfProtection(req, res, () => {
    verifyToken(req, res, () => {
      checkAdminRole(req, res, () => {
        triggerScheduledDeletionJob(req, res)
      })
    })
  })
}

router.post(
  '/trigger-scheduled-deletion',
  deletionEndpointLimiter, // Rate limiting: 3 requests per hour
  triggerScheduledDeletionRoute
)

// Get referral statistics (admin only)
router.get('/referral-stats', verifyToken, generalLimiter, checkAdminRole, getReferralStats)

export default router
