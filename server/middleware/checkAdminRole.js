import { User } from '../models/user.model.js'
import {
  sendUnauthorized,
  sendNotFound,
  sendForbidden,
  sendInternalError,
} from '../utils/ApiResponse.js'

export const checkAdminRole = async (req, res, next) => {
  try {
    // verifyToken middleware should have already set req.userId
    if (!req.userId) {
      return sendUnauthorized(res, 'Unauthorized - no user ID found')
    }

    const user = await User.findOne({ user_id: req.userId })

    if (!user) {
      return sendNotFound(res, 'User')
    }

    if (!user.isAdmin) {
      return sendForbidden(res, 'Admin access required')
    }

    // User is admin, proceed to next middleware/controller
    next()
  } catch (error) {
    return sendInternalError(res, error, {
      method: req.method,
      path: req.path,
      userId: req.userId,
    })
  }
}
