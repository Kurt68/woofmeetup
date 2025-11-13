import Message from '../models/message.model.js'
import { User } from '../models/user.model.js'
import { validationResult } from 'express-validator'
import cloudinary from '../lib/cloudinary.js'
import { getReceiverSocketId, io } from '../lib/socket.js'
import { decrementMessageCredit } from '../middleware/checkMessageLimit.js'
import { sendError } from '../middleware/errorHandler.js'
import { checkImage } from '../utilities/checkImage.js'
import { validateUserId } from '../utilities/sanitizeInput.js'
import { logError, logInfo, logWarning } from '../utilities/logger.js'

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
    let rawImageData = null
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

        // SVG images should skip nudity detection since they're vector graphics
        const isSvg =
          image.includes('image/svg+xml') || image.includes('svg+xml')

        // Store image data for async background processing
        rawImageData = {
          originalData: image,
          base64Data: cleanedBase64,
          isSvg,
        }

        // Message is saved with null image URL - will be updated in background
        imageUrl = null
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

    logInfo(
      'message.controller',
      `💾 Saving message from sender to receiver`
    )
    await newMessage.save()
    logInfo(
      'message.controller',
      `✅ Message saved to database: ${newMessage._id}`
    )

    // Decrement message credit for free users
    await decrementMessageCredit(senderId)

    // Emit with acknowledgment - wait for client confirmation
    // First try direct lookup, then try to find user by _id and use their user_id
    let receiverSocketId = getReceiverSocketId(receiverId)
    
    if (!receiverSocketId) {
      // Try looking up the user by _id to get their user_id for socket lookup
      try {
        const receiverUser = await User.findById(receiverId).select('user_id')
        if (receiverUser && receiverUser.user_id) {
          receiverSocketId = getReceiverSocketId(receiverUser.user_id)
          logInfo(
            'message.controller',
            `Receiver lookup: _id ${receiverId} → user_id ${receiverUser.user_id}, SocketId: ${receiverSocketId || 'NOT FOUND'}`
          )
        }
      } catch (error) {
        logError('message.controller', 'Failed to lookup receiver user', error)
      }
    }
    
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

    // Process image ASYNCHRONOUSLY in background (don't block response)
    if (image && rawImageData) {
      setImmediate(async () => {
        try {
          logInfo('message.controller', '📤 Starting background Cloudinary upload...')
          const uploadOptions = {
            quality: 'auto:eco',
            width: 600,
            crop: 'limit',
          }

          if (!rawImageData.isSvg && !image.includes('image/gif')) {
            uploadOptions.format = 'webp'
          }

          const uploadResponse = await cloudinary.uploader.upload(
            image,
            uploadOptions
          )
          const uploadedImageUrl = uploadResponse.secure_url
          logInfo('message.controller', '✅ Cloudinary upload complete')

          // Update message with image URL
          await Message.findByIdAndUpdate(newMessage._id, {
            image: uploadedImageUrl,
          })
          logInfo('message.controller', `✅ Message ${newMessage._id} updated with image URL`)

          // Emit updated message to both sender and receiver
          const imageUpdateData = {
            messageId: newMessage._id,
            imageUrl: uploadedImageUrl,
          }

          logInfo('message.controller', `🔍 Looking up socket IDs - Sender: ${senderId}, Receiver: ${receiverId}`)
          
          let senderSocketId = getReceiverSocketId(senderId)
          logInfo('message.controller', `🔍 Sender lookup by _id (${senderId}): ${senderSocketId ? senderSocketId.substring(0, 8) + '...' : 'NOT FOUND'}`)
          
          if (!senderSocketId) {
            try {
              const senderUser = await User.findById(senderId).select('user_id')
              if (senderUser && senderUser.user_id) {
                senderSocketId = getReceiverSocketId(senderUser.user_id)
                logInfo('message.controller', `🔍 Sender lookup by user_id (${senderUser.user_id}): ${senderSocketId ? senderSocketId.substring(0, 8) + '...' : 'NOT FOUND'}`)
              } else {
                logWarning('message.controller', `⚠️ Sender user not found in DB with _id: ${senderId}`)
              }
            } catch (error) {
              logError('message.controller', 'Failed to lookup sender user', error)
            }
          }

          if (senderSocketId) {
            logInfo('message.controller', `📤 Emitting messageImageUpdated to SENDER socket`)
            io.to(senderSocketId).emit('messageImageUpdated', imageUpdateData)
          } else {
            logWarning('message.controller', `⚠️ Sender socket NOT found - image update will NOT be delivered to sender`)
          }
          
          if (receiverSocketId) {
            logInfo('message.controller', `📤 Emitting messageImageUpdated to RECEIVER socket`)
            io.to(receiverSocketId).emit('messageImageUpdated', imageUpdateData)
          } else {
            logWarning('message.controller', `⚠️ Receiver socket NOT found - image update will NOT be delivered to receiver`)
          }

          // Check image for nudity ASYNCHRONOUSLY (non-blocking)
          if (!rawImageData.isSvg) {
            const imageBuffer = Buffer.from(rawImageData.base64Data, 'base64')
            checkImage(imageBuffer)
              .then((imageCheck) => {
                if (imageCheck.isNude) {
                  logWarning(
                    'message.controller',
                    `🚨 INAPPROPRIATE IMAGE - Message ${newMessage._id} may need review`
                  )
                }
              })
              .catch((error) => {
                logError(
                  'message.controller',
                  'Background nudity check failed',
                  error
                )
              })
          }
        } catch (error) {
          logError('message.controller', 'Background image processing failed', error)
        }
      })
    }
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
    let receiverSocketId = getReceiverSocketId(userChattingWithId)
    
    if (!receiverSocketId) {
      // Try looking up the user by _id to get their user_id for socket lookup
      try {
        const receiverUser = await User.findById(userChattingWithId).select('user_id')
        if (receiverUser && receiverUser.user_id) {
          receiverSocketId = getReceiverSocketId(receiverUser.user_id)
        }
      } catch (error) {
        logError('message.controller', 'Failed to lookup receiver for chat clear', error)
      }
    }
    
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
