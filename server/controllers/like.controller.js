import { Like } from '../models/like.model.js'
import { User } from '../models/user.model.js'
import { sendError } from '../middleware/errorHandler.js'
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
      return res.status(400).json({
        success: false,
        message: 'You cannot like your own profile',
      })
    }

    const toUser = await User.findById(toUserId)
    if (!toUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    let like = await Like.findOne({ fromUserId, toUserId })

    if (like) {
      return res.status(200).json({
        success: true,
        message: 'Like already exists',
        liked: true,
      })
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
      logInfo('like.controller', `✅ Like email sent to ${receiverEmail}`)
    } catch (emailError) {
      logError('like.controller', 'Failed to send like notification email', emailError)
    }

    logInfo('like.controller', `🔍 Looking up socket for toUserId: ${toUserId}`)
    const receiverSocketId = getReceiverSocketId(toUserId)
    if (receiverSocketId) {
      logInfo('like.controller', `✅ Found socket ${receiverSocketId}, emitting userLiked event`)
      io.to(receiverSocketId).emit('userLiked', {
        fromUserId,
        fromUserName: likerName,
        fromUserDogName: likerDogName,
        timestamp: new Date(),
      })
    } else {
      logInfo('like.controller', `⚠️ No socket found for toUserId ${toUserId} (user offline)`)
    }

    res.status(201).json({
      success: true,
      message: 'Like created successfully',
      liked: true,
    })
  } catch (error) {
    logError('like.controller', 'Failed to create like', error)
    sendError(res, 500, 'Failed to create like')
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

    res.status(200).json({
      success: true,
      likes,
      unreadCount,
    })
  } catch (error) {
    logError('like.controller', 'Failed to get likes', error)
    sendError(res, 500, 'Failed to retrieve likes')
  }
}

export const markLikesAsRead = async (req, res) => {
  try {
    const userId = req._id

    await Like.updateMany(
      { toUserId: userId, read: false },
      { read: true }
    )

    res.status(200).json({
      success: true,
      message: 'Likes marked as read',
    })
  } catch (error) {
    logError('like.controller', 'Failed to mark likes as read', error)
    sendError(res, 500, 'Failed to mark likes as read')
  }
}

export const checkIfLiked = async (req, res) => {
  try {
    const { id: toUserId } = req.params
    const fromUserId = req._id

    validateUserId(toUserId, 'toUserId')

    const like = await Like.findOne({ fromUserId, toUserId })

    res.status(200).json({
      success: true,
      liked: !!like,
    })
  } catch (error) {
    logError('like.controller', 'Failed to check if liked', error)
    sendError(res, 500, 'Failed to check like status')
  }
}
