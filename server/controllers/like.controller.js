import { Like } from '../models/like.model.js'
import { User } from '../models/user.model.js'
import { sendSuccess, sendError, sendInternalError } from '../utils/ApiResponse.js'
import { getReceiverSocketId, io } from '../lib/socket.js'
import { validateUserId } from '../utilities/sanitizeInput.js'
import { logError, logInfo } from '../utilities/logger.js'
import { sendLikeNotificationEmail } from '../mailtrap/emails.js'

export const createLike = async (req, res) => {
  try {
    const { id: toUserId } = req.params
    const fromUserId = req._id

    validateUserId(toUserId, 'toUserId')

    if (fromUserId === toUserId) {
      return sendError(res, 'You cannot like your own profile', 400)
    }

    const toUser = await User.findById(toUserId)
    if (!toUser) {
      return sendError(res, 'User not found', 404)
    }

    let like = await Like.findOne({ fromUserId, toUserId })

    if (like) {
      return sendSuccess(res, { liked: true }, 'Like already exists', 200)
    }

    like = new Like({ fromUserId, toUserId })
    await like.save()

    logInfo('like.controller', `User ${fromUserId} liked user ${toUserId}`)

    const fromUser = await User.findById(fromUserId)
    const likerName = fromUser.userName
    const likerDogName = fromUser.dogs_name
    const yourDogName = toUser.dogs_name
    const receiverEmail = toUser.email

    try {
      await sendLikeNotificationEmail(
        receiverEmail,
        toUser.userName,
        likerName,
        likerDogName,
        yourDogName
      )
      logInfo('like.controller', `Like email sent to ${receiverEmail}`)
    } catch (emailError) {
      logError('like.controller', 'Failed to send like notification email', emailError)
    }

    const receiverSocketId = getReceiverSocketId(toUserId)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('userLiked', {
        fromUserId,
        fromUserName: likerName,
        fromUserDogName: likerDogName,
        timestamp: new Date(),
      })
    }

    sendSuccess(res, { liked: true }, 'Like created successfully', 201)
  } catch (error) {
    logError('like.controller', 'Failed to create like', error)
    sendInternalError(res, error, {
      method: req.method,
      path: req.path,
      userId: req._id,
    })
  }
}

export const getLikes = async (req, res) => {
  try {
    const userId = req._id

    const likes = await Like.find({ toUserId: userId })
      .populate('fromUserId', 'userName dogs_name imageUrl profileImageUrl')
      .sort({ createdAt: -1 })

    const unreadCount = await Like.countDocuments({
      toUserId: userId,
      read: false,
    })

    sendSuccess(res, { likes, unreadCount }, null, 200)
  } catch (error) {
    logError('like.controller', 'Failed to get likes', error)
    sendInternalError(res, error, {
      method: req.method,
      path: req.path,
      userId: req._id,
    })
  }
}

export const markLikesAsRead = async (req, res) => {
  try {
    const userId = req._id

    await Like.updateMany({ toUserId: userId, read: false }, { read: true })

    sendSuccess(res, null, 'Likes marked as read', 200)
  } catch (error) {
    logError('like.controller', 'Failed to mark likes as read', error)
    sendInternalError(res, error, {
      method: req.method,
      path: req.path,
      userId: req._id,
    })
  }
}

export const checkIfLiked = async (req, res) => {
  try {
    const { id: toUserId } = req.params
    const fromUserId = req._id

    validateUserId(toUserId, 'toUserId')

    const like = await Like.findOne({ fromUserId, toUserId })

    sendSuccess(res, { liked: !!like }, null, 200)
  } catch (error) {
    logError('like.controller', 'Failed to check if liked', error)
    sendInternalError(res, error, {
      method: req.method,
      path: req.path,
      userId: req._id,
    })
  }
}
