import express from 'express'
import { verifyToken } from '../middleware/verifyToken.js'
import { validateParamUserId } from '../middleware/validateInput.js'
import { csrfProtection } from '../middleware/csrf.js'
import { likeActionLimiter } from '../middleware/rateLimiter.js'
import {
  createLike,
  getLikes,
  markLikesAsRead,
  checkIfLiked,
} from '../controllers/like.controller.js'

const router = express.Router()

router.post(
  '/:id',
  csrfProtection,
  verifyToken,
  likeActionLimiter,
  validateParamUserId('id'),
  createLike
)

router.get('/', verifyToken, likeActionLimiter, getLikes)

router.put('/mark-as-read', csrfProtection, verifyToken, markLikesAsRead)

router.get('/check/:id', verifyToken, validateParamUserId('id'), checkIfLiked)

export default router
