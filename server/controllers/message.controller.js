import Message from '../models/message.model.js'
import { validationResult } from 'express-validator'
import cloudinary from '../lib/cloudinary.js'
import { getReceiverSocketId, io } from '../lib/socket.js'
import { decrementMessageCredit } from '../middleware/checkMessageLimit.js'
import { sendError } from '../middleware/errorHandler.js'
import { checkImage } from '../utilities/checkImage.js'
import { validateUserId } from '../utilities/sanitizeInput.js'
import { logError, logInfo } from '../utilities/logger.js'

// Get messages
export const getMessages = async (req, res) => {
  try {
    const { id: userChattingWithId } = req.params
    const myId = req._id

    // Double-check validation (defense in depth)
    validateUserId(userChattingWithId, 'userChattingWithId')

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userChattingWithId },
        { senderId: userChattingWithId, receiverId: myId },
      ],
    })

    res.status(200).json(messages)
  } catch (error) {
    logError('message.controller', 'Failed to get messages', error)
    sendError(res, 500, 'Failed to retrieve messages')
  }
}

// Send messages
export const sendMessage = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      })
    }

    const { text, image } = req.body

    const { id: receiverId } = req.params
    const senderId = req._id

    // Double-check validation (defense in depth)
    validateUserId(receiverId, 'receiverId')

    let imageUrl
    if (image) {
      try {
        // Validate base64 format
        if (typeof image !== 'string' || image.length === 0) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid image format: image must be a base64 encoded string',
            code: 'INVALID_IMAGE_FORMAT',
          })
        }

        // Extract base64 data (handle both data:image/type;base64,... and raw base64)
        let base64Data = image
        const hasDataUrlPrefix = image.includes(',')
        if (hasDataUrlPrefix) {
          base64Data = image.split(',')[1]
        }

        // Clean up whitespace
        base64Data = base64Data.trim()

        // Validate base64 is properly encoded
        // Base64 must only contain valid characters and proper padding
        // Allow whitespace and newlines (some systems include them)
        const base64Regex = /^[A-Za-z0-9+/\s]*={0,2}$/
        const cleanedBase64 = base64Data.replace(/\s/g, '')

        if (!base64Regex.test(base64Data) || cleanedBase64.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid image format: image must be valid base64',
            code: 'INVALID_BASE64',
          })
        }

        // Use cleaned base64 for further processing
        base64Data = cleanedBase64

        // Convert base64 to buffer for nudity detection
        // SVG images should skip nudity detection since they're vector graphics
        const isSvg =
          image.includes('image/svg+xml') || image.includes('svg+xml')

        if (!isSvg) {
          const imageBuffer = Buffer.from(base64Data, 'base64')

          // Check image for nudity before uploading (keep app family-friendly)
          const imageCheck = await checkImage(imageBuffer)

          if (imageCheck.isNude) {
            return res.status(400).json({
              success: false,
              message:
                'Image rejected: This app is family-oriented. Please share a non-explicit image.',
              code: 'NUDITY_DETECTED',
              confidence: imageCheck.confidence,
            })
          }
        }

        // Upload base64 image to cloudinary
        // Note: For animated GIFs, we keep format as is; for SVGs, we preserve them
        const uploadOptions = {
          quality: 'auto:eco',
          width: 600,
          crop: 'limit',
        }

        // Don't convert SVGs or GIFs to webp - preserve original format
        if (!isSvg && !image.includes('image/gif')) {
          uploadOptions.format = 'webp'
        }

        const uploadResponse = await cloudinary.uploader.upload(
          image,
          uploadOptions
        )
        imageUrl = uploadResponse.secure_url
      } catch (error) {
        logError('message.controller', 'Image upload failed', error)

        return res.status(400).json({
          success: false,
          message: error.message || 'Failed to upload image. Please try again.',
          code: 'IMAGE_UPLOAD_FAILED',
        })
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    })

    await newMessage.save()

    // Decrement message credit for free users
    await decrementMessageCredit(senderId)

    // Emit with acknowledgment - wait for client confirmation
    const receiverSocketId = getReceiverSocketId(receiverId)
    logInfo(
      'message.controller',
      `Attempting to send message to receiver: ${receiverId}, SocketId: ${
        receiverSocketId || 'NOT FOUND'
      }`
    )
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', newMessage, (ack) => {
        if (ack) {
          logInfo('message.controller', '✅ Message delivered to receiver')
        }
      })
    } else {
      logInfo(
        'message.controller',
        `⚠️ Receiver ${receiverId} not found in online users map`
      )
    }

    res.status(201).json(newMessage)
  } catch (error) {
    logError('message.controller', 'Failed to send message', error)
    sendError(res, 500, 'Failed to send message')
  }
}

// Delete messages between two users
export const deleteMessages = async (req, res) => {
  try {
    const { id: userChattingWithId } = req.params
    const myId = req._id

    // Double-check validation (defense in depth)
    validateUserId(userChattingWithId, 'userChattingWithId')

    const result = await Message.deleteMany({
      $or: [
        { senderId: myId, receiverId: userChattingWithId },
        { senderId: userChattingWithId, receiverId: myId },
      ],
    })

    // Notify the other user that chat has been cleared via Socket.IO (with acknowledgment)
    const receiverSocketId = getReceiverSocketId(userChattingWithId)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('chatCleared', { userId: myId }, (ack) => {
        if (ack) {
          logInfo('message.controller', '✅ Chat clear notification delivered')
        }
      })
    }

    res.status(200).json({
      message: 'Messages cleared successfully',
      deletedCount: result.deletedCount,
    })
  } catch (error) {
    logError('message.controller', 'Failed to delete messages', error)
    sendError(res, 500, 'Failed to delete messages')
  }
}
