import { User } from '../models/user.model.js'
import {
  sendUnauthorized,
  sendNotFound,
  _sendForbidden,
  sendInternalError,
  sendError,
} from '../utils/ApiResponse.js'

export const checkMessageLimit = async (req, res, next) => {
  try {
    // ✅ Use req._id (MongoDB ObjectId) set by verifyToken middleware
    // Note: req.userId is the UUID string, req._id is the MongoDB ObjectId
    const userId = req._id

    if (!userId) {
      return sendUnauthorized(res, 'User ID not found')
    }

    const user = await User.findById(userId)
    if (!user) {
      return sendNotFound(res, 'User')
    }

    // Premium and VIP users have unlimited messages
    if (user.subscription === 'premium' || user.subscription === 'vip') {
      return next()
    }

    // Free users need credits
    if (user.messageCredits <= 0) {
      return sendError(res, 'Insufficient message credits', 403, [
        { message: 'needsCredits', value: true, currentCredits: user.messageCredits },
      ])
    }

    // User has credits, proceed
    next()
  } catch (error) {
    return sendInternalError(res, error, {
      method: req.method,
      path: req.path,
      userId: req._id,
    })
  }
}

export const decrementMessageCredit = async (userId) => {
  try {
    const user = await User.findById(userId)
    if (!user) {
      return
    }

    // Only decrement for free users
    if (user.subscription === 'free' && user.messageCredits > 0) {
      user.messageCredits -= 1
      user.totalMessagesSent += 1
      await user.save()
    } else if (user.subscription !== 'free') {
      // Still track total messages for premium/vip users
      user.totalMessagesSent += 1
      await user.save()
    }
  } catch (_error) {
    // Silent error handling - credit decrement is non-critical
  }
}
