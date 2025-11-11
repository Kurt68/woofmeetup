import { User } from '../models/user.model.js'
import { logError } from '../utilities/logger.js'

export const checkAdminRole = async (req, res, next) => {
  try {
    // verifyToken middleware should have already set req.userId
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - no user ID found',
      })
    }

    const user = await User.findOne({ user_id: req.userId })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Admin access required',
      })
    }

    // User is admin, proceed to next middleware/controller
    next()
  } catch (error) {
    logError('checkAdminRole.middleware', 'Error checking admin role', error)
    return res.status(500).json({
      success: false,
      message: 'Server error while checking admin role',
    })
  }
}
