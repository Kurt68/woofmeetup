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
} from '../controllers/auth.controller.js'
import { verifyToken } from '../middleware/verifyToken.js'
import { body } from 'express-validator'
import multer, { memoryStorage } from 'multer'

const storage = memoryStorage()
const upload = multer({ storage: storage })

const router = express.Router()

router.get('/check-auth', verifyToken, checkAuth)
router.get('/users', getMatches)
router.get('/user', getUser)
router.get('/meetup-type-users', getMeetupTypeUsers)
router.get('/current-user-profile', getCurrentUserProfile)

router.post(
  '/signup',
  body('email').isEmail(),
  body('password').isStrongPassword({
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
  }),
  body('userName'),
  signup
)
router.post('/login', login)
router.post('/logout', logout)
router.post('/verify-email', verifyEmail)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)

router.put('/addcoordinates', getCurrentPosition)
router.put('/user', putUser)
router.put('/addmatch', updateMatches)
router.put('/removematch', removeMatch)
router.put('/image', upload.single('image'), uploadImage)
router.put('/profile-image', upload.single('image'), uploadProfileImage)
router.put('/user-select-distance', putUserSelectDistance)

router.patch('/user', patchCurrentUserProfile)

router.delete('/image', deleteImage)
router.delete('/delete-one-user', deleteOneUser)

export default router
