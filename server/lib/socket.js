import { Server } from 'socket.io'
import http from 'http' // built into Node.js
import express from 'express'
import { logSocketEvent, logSocketError, logInfo } from '../utilities/logger.js'
import jwt from 'jsonwebtoken'
import { User } from '../models/user.model.js'

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === 'development'
        ? ['http://localhost:5173', 'http://localhost:8000']
        : 'https://woofmeetup.com',
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'baggage',
      'sentry-trace',
    ],
  },
  transports: ['websocket', 'polling'],
  // Additional security settings for production
  cookie:
    process.env.NODE_ENV === 'production'
      ? {
          secure: true,
          httpOnly: true,
          sameSite: 'lax',
        }
      : false,
  // Security: Set max buffer size for chat images (60% compressed to ~800KB per image)
  maxHttpBufferSize: 5 * 1024 * 1024, // 5MB max message size for compressed images
})

/**
 * Socket.IO Event Rate Limiter
 * Security: Prevents message bombing and DoS attacks on socket events
 * Tracks event frequency per socket to prevent abuse
 */
class SocketEventRateLimiter {
  constructor() {
    this.socketLimits = {} // {socketId: {eventName: {count, resetTime, bandwidth}}}
    this.WINDOW_MS = 5 * 60 * 1000 // 5 minute window
    this.MAX_EVENTS_PER_WINDOW =
      process.env.NODE_ENV === 'production' ? 50 : 500
    this.MAX_BANDWIDTH_MB = process.env.NODE_ENV === 'production' ? 10 : 100 // MB per window
    // Cleanup interval for old entries (every 10 minutes)
    this.cleanupInterval = setInterval(() => this.cleanup(), 10 * 60 * 1000)
  }

  /**
   * Check if socket event is allowed based on rate limits
   * Security: Returns false if limits exceeded, true if allowed
   */
  checkRateLimit(socketId, eventName, payloadSize = 0) {
    const now = Date.now()

    // Initialize socket entry if it doesn't exist
    if (!this.socketLimits[socketId]) {
      this.socketLimits[socketId] = {}
    }

    // Initialize event tracker for this socket
    if (!this.socketLimits[socketId][eventName]) {
      this.socketLimits[socketId][eventName] = {
        count: 0,
        bandwidth: 0,
        resetTime: now + this.WINDOW_MS,
      }
    }

    const tracker = this.socketLimits[socketId][eventName]

    // Reset if window has expired
    if (now >= tracker.resetTime) {
      tracker.count = 0
      tracker.bandwidth = 0
      tracker.resetTime = now + this.WINDOW_MS
    }

    // Check event count limit
    if (tracker.count >= this.MAX_EVENTS_PER_WINDOW) {
      return false
    }

    // Check bandwidth limit (convert to MB)
    const bandwidthMB = (tracker.bandwidth + payloadSize) / (1024 * 1024)
    if (bandwidthMB > this.MAX_BANDWIDTH_MB) {
      return false
    }

    // Update tracker
    tracker.count++
    tracker.bandwidth += payloadSize

    return true
  }

  /**
   * Cleanup old entries to prevent memory leaks
   * Security: Removes inactive socket trackers
   */
  cleanup() {
    const now = Date.now()
    const threshold = now - 30 * 60 * 1000 // 30 minutes of inactivity

    for (const [socketId, events] of Object.entries(this.socketLimits)) {
      let hasEvents = false

      for (const [eventName, tracker] of Object.entries(events)) {
        if (tracker.resetTime < threshold) {
          delete this.socketLimits[socketId][eventName]
        } else {
          hasEvents = true
        }
      }

      if (!hasEvents) {
        delete this.socketLimits[socketId]
      }
    }
  }

  /**
   * Remove socket from tracking when it disconnects
   * Security: Prevents memory leaks from disconnected sockets
   */
  removeSocket(socketId) {
    delete this.socketLimits[socketId]
  }

  /**
   * Destroy the rate limiter and cleanup interval
   * Security: Call on server shutdown
   */
  destroy() {
    clearInterval(this.cleanupInterval)
    this.socketLimits = {}
  }
}

const eventRateLimiter = new SocketEventRateLimiter()

/**
 * Mask sensitive user IDs in logs to prevent enumeration
 * Security: Shows only first 4 chars and total count, never full ID
 */
function maskUserId(userId) {
  if (!userId) return 'UNKNOWN'
  const str = String(userId)
  if (str.length <= 4) return '****'
  return `${str.substring(0, 4)}...`
}

/**
 * Get receiver socket ID by user ID
 * Security: Masks user IDs in logs to prevent enumeration attacks
 * Note: userSocketMap stores both mongoId and userId for each connection,
 * so we count unique socket IDs, not map keys
 */
export function getReceiverSocketId(userId) {
  const socketId = userSocketMap[userId]
  const maskedId = maskUserId(userId)
  // Count unique socket IDs (each user has one socket, but two map entries)
  const uniqueSocketIds = new Set(Object.values(userSocketMap))
  const userCount = uniqueSocketIds.size

  if (socketId) {
    logInfo(
      'socket.lookup',
      `User ${maskedId} found online (${userCount} total online)`
    )
  } else {
    logInfo(
      'socket.lookup',
      `User ${maskedId} not found (${userCount} total online)`
    )
  }

  return socketId
}

// used to store online users
const userSocketMap = {} // {userId: socketId}

/**
 * Security: Rate limiting for socket connections
 * Prevents user enumeration and connection spam attacks
 * Tracks connection attempts per user IP/token to detect abuse
 */
const socketConnectionTracker = {} // {userId: { count, resetTime }}
const MAX_CONNECTIONS_PER_USER = 3 // Max 3 simultaneous connections
const CONNECTION_RESET_INTERVAL = 60 * 1000 // Reset every 1 minute

/**
 * Security: Check if user has exceeded maximum socket connections
 * Prevents connection spam and user enumeration attacks
 * @param {string} userId - The user ID to check
 * @returns {boolean} - True if within limits, false if exceeded
 */
function checkConnectionRateLimit(userId) {
  const now = Date.now()
  const userTracker = socketConnectionTracker[userId]

  // Initialize tracker for this user if it doesn't exist
  if (!userTracker) {
    socketConnectionTracker[userId] = {
      count: 1,
      resetTime: now + CONNECTION_RESET_INTERVAL,
    }
    return true
  }

  // Reset counter if time window has passed
  if (now >= userTracker.resetTime) {
    socketConnectionTracker[userId] = {
      count: 1,
      resetTime: now + CONNECTION_RESET_INTERVAL,
    }
    return true
  }

  // Check if user has exceeded maximum connections
  if (userTracker.count >= MAX_CONNECTIONS_PER_USER) {
    logSocketError(
      'socket.ratelimit',
      new Error(
        `User ${userId} exceeded max socket connections (${MAX_CONNECTIONS_PER_USER})`
      )
    )
    return false
  }

  // Increment counter and allow connection
  userTracker.count++
  return true
}

/**
 * Verify JWT token from socket handshake
 * Security: Validates JWT tokens from multiple sources in order of preference:
 * 1. httpOnly cookies (preferred - XSS safe)
 * 2. Auth headers (for backward compatibility)
 * CRITICAL SECURITY FIX #4: Query parameters DISABLED - tokens in URLs are logged in browser history/server logs
 * This function is used by the Socket.io authentication middleware
 * Returns: { userId, mongoId } for both user_id and _id references
 */
function verifySocketToken(socket) {
  try {
    // Try to extract token from secure sources only
    // Priority order: cookies > auth header
    // Query parameters are BLOCKED to prevent token exposure in logs/history
    let token = null

    // 1. Try httpOnly cookie first (most secure - XSS protected)
    if (socket.handshake.headers.cookie) {
      const cookies = socket.handshake.headers.cookie.split('; ')
      for (const cookie of cookies) {
        const [name, value] = cookie.split('=')
        if (name === 'token') {
          token = decodeURIComponent(value)
          logInfo('socket.auth', 'Token extracted from httpOnly cookie')
          break
        }
      }
    }

    // 2. Fallback to auth header
    if (!token && socket.handshake.auth?.token) {
      token = socket.handshake.auth.token
      logInfo('socket.auth', 'Token extracted from auth header')
    }

    // SECURITY FIX #4: Query parameter tokens DISABLED
    // Tokens in query parameters get logged in browser history, server logs, and proxies
    // If clients are still using query params, they will now fail with clear error
    if (!token && socket.handshake.query?.token) {
      logInfo(
        'socket.auth',
        'BLOCKED: Token attempted via query parameter (security risk). Use cookies or auth header instead.'
      )
      // Do NOT accept query parameter token
    }

    if (!token) {
      logInfo('socket.auth', 'No token provided in socket handshake')
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (!decoded || !decoded.userId) {
      logInfo(
        'socket.auth',
        'Token decoded but no userId found - token payload invalid'
      )
      return null
    }

    return { userId: decoded.userId, mongoId: decoded._id }
  } catch (error) {
    // Log specific JWT errors
    if (error.name === 'TokenExpiredError') {
      logInfo(
        'socket.auth',
        `Token verification failed: token expired at ${error.expiredAt}`
      )
    } else if (error.name === 'JsonWebTokenError') {
      logInfo('socket.auth', `Token verification failed: invalid signature`)
    } else {
      logInfo('socket.auth', `Token verification failed: ${error.message}`)
    }
    return null
  }
}

/**
 * Socket Event Validation Middleware
 * Security: Validates all socket events with same rigor as HTTP routes
 * Prevents injection attacks and ensures proper event structure
 */
function createSocketEventValidator(eventName, validator) {
  return (socket, next) => {
    socket.on(eventName, (data, callback) => {
      try {
        // Security: Check rate limits on incoming events
        const payloadSize = JSON.stringify(data).length
        if (
          !eventRateLimiter.checkRateLimit(socket.id, eventName, payloadSize)
        ) {
          logSocketError(
            'socket.event.ratelimit',
            new Error(
              `Rate limit exceeded for event: ${eventName} on socket ${socket.id}`
            )
          )
          const errorMsg = 'Event rate limit exceeded'
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: errorMsg })
          }
          return
        }

        // Security: Validate event payload if validator provided
        if (validator) {
          const validationResult = validator(data)
          if (!validationResult.valid) {
            logInfo(
              'socket.event.validation',
              `Invalid event ${eventName}: ${validationResult.error}`
            )
            const errorMsg = validationResult.error || 'Invalid event data'
            if (callback && typeof callback === 'function') {
              callback({ success: false, error: errorMsg })
            }
            return
          }
        }

        // Event is valid and within rate limits
        // Let the event handler proceed
        socket.emit(`__validated_${eventName}`, data, callback)
      } catch (error) {
        logSocketError('socket.event.validation', error)
        if (callback && typeof callback === 'function') {
          callback({ success: false, error: 'Event validation failed' })
        }
      }
    })
    next()
  }
}

/**
 * Socket.io Authentication Middleware
 * CRITICAL SECURITY: Validates JWT tokens BEFORE allowing socket connections
 * Prevents authentication bypass vulnerability
 * Security: Also enforces rate limiting and event validation to prevent attacks
 */
io.use((socket, next) => {
  const tokenData = verifySocketToken(socket)

  if (!tokenData) {
    logSocketError(
      'socket.auth',
      new Error('Authentication failed - invalid or missing token')
    )
    return next(new Error('Authentication failed: Invalid or missing token'))
  }

  // Security: Check connection rate limit to prevent user enumeration and spam
  if (!checkConnectionRateLimit(tokenData.userId)) {
    const maskedId = maskUserId(tokenData.userId)
    logSocketError(
      'socket.auth',
      new Error(
        `Rate limit exceeded for user ${maskedId}: Too many simultaneous connections`
      )
    )
    return next(
      new Error('Rate limit exceeded: Too many simultaneous connections')
    )
  }

  // Attach verified userId and mongoId to socket.data for use in handlers
  socket.data.userId = tokenData.userId
  socket.data.mongoId = tokenData.mongoId

  // Security: Store creation time for connection tracking
  socket.data.connectedAt = Date.now()

  next()
})

// Get filtered online matches for a user
async function getFilteredOnlineUsers(userId) {
  try {
    if (!userId) return []

    // Get user's matched users - query by user_id (UUID) not MongoDB _id
    const user = await User.findOne({ user_id: userId }).select('matches')
    if (!user || !user.matches) return []

    // Extract matched user IDs
    const matchedIds = user.matches.map((m) => m.user_id || m._id)

    // Filter to only online matched users
    const onlineMatches = Object.keys(userSocketMap).filter((id) =>
      matchedIds.some((mId) => String(mId) === String(id))
    )

    return onlineMatches
  } catch (error) {
    logSocketError('socket.filter', error)
    return [] // Safe fallback
  }
}

/**
 * Get all users who are matched with a specific user
 * Used to notify matches when user comes online/offline
 */
async function getMatchedUserIds(userId) {
  try {
    if (!userId) return []

    // Get the user's matches
    const user = await User.findOne({ user_id: userId }).select('matches')
    if (!user || !user.matches) return []

    // Return matched user IDs
    return user.matches.map((m) => m.user_id || m._id).filter(Boolean)
  } catch (error) {
    logSocketError('socket.matches.lookup', error)
    return []
  }
}

/**
 * Broadcast online status to all matched users
 * Sends updated online list to each match so they can see if this user is online/offline
 */
async function broadcastOnlineStatusToMatches(userId, isOnline) {
  try {
    if (!userId) return

    // Get all users matched with this user
    const matchedIds = await getMatchedUserIds(userId)
    if (!matchedIds.length) return

    // For each matched user, send them the updated online status if they're connected
    for (const matchedId of matchedIds) {
      const matchedSocketId = userSocketMap[matchedId]
      if (matchedSocketId) {
        try {
          // Get filtered online list for this matched user
          const filteredOnlineUsers = await getFilteredOnlineUsers(matchedId)
          // Emit to the matched user's socket
          io.to(matchedSocketId).emit('getOnlineUsers', filteredOnlineUsers)
        } catch (error) {
          logSocketError('socket.broadcast.error', error)
        }
      }
    }
  } catch (error) {
    logSocketError('socket.broadcast.matches', error)
  }
}

io.on('connection', (socket) => {
  // Use verified userId and mongoId from authentication middleware
  const userId = socket.data.userId
  const mongoId = socket.data.mongoId
  const maskedUserId = maskUserId(userId)
  const maskedMongoId = maskUserId(mongoId)

  // Register socket in map using mongoId (since message routes use _id)
  // Also store userId for backward compatibility
  userSocketMap[mongoId] = socket.id
  userSocketMap[userId] = socket.id

  logSocketEvent(
    'User connected',
    `${maskedUserId}/${maskedMongoId}`,
    socket.id
  )
  // Count unique socket IDs (each user has one socket, but two map entries)
  const uniqueConnected = new Set(Object.values(userSocketMap))
  logInfo(
    'socket.io',
    `✅ Socket registered - connection from ${maskedUserId} (${uniqueConnected.size} total online)`
  )

  // Send filtered online users (only matched users) to the newly connected client
  ;(async () => {
    try {
      const filteredOnlineUsers = await getFilteredOnlineUsers(userId)
      socket.emit('getOnlineUsers', filteredOnlineUsers)
    } catch (error) {
      logSocketError('socket.connect.filter', error)
      socket.emit('getOnlineUsers', []) // Fallback to empty list
    }

    // Real-time update: Notify all matched users that this user is now online
    try {
      await broadcastOnlineStatusToMatches(userId, true)
    } catch (error) {
      logSocketError('socket.connect.broadcast', error)
    }
  })()

  socket.on('disconnect', () => {
    logSocketEvent(
      'User disconnected',
      `${maskedUserId}/${maskedMongoId}`,
      socket.id
    )

    // Real-time update: Notify matched users before removing from map
    ;(async () => {
      try {
        await broadcastOnlineStatusToMatches(userId, false)
      } catch (error) {
        logSocketError('socket.disconnect.broadcast', error)
      }
    })()

    if (userId) delete userSocketMap[userId]
    if (mongoId) delete userSocketMap[mongoId]

    // Security: Decrement connection counter on disconnect
    if (userId && socketConnectionTracker[userId]) {
      socketConnectionTracker[userId].count = Math.max(
        0,
        socketConnectionTracker[userId].count - 1
      )
    }

    // Security: Remove socket from event rate limiter on disconnect
    // Prevents memory leaks from old socket tracking
    eventRateLimiter.removeSocket(socket.id)

    // Count unique socket IDs (each user has one socket, but two map entries)
    const uniqueRemaining = new Set(Object.values(userSocketMap))
    logInfo(
      'socket.io',
      `✅ Socket unregistered - ${maskedUserId} (${uniqueRemaining.size} remaining online)`
    )
  })

  socket.on('error', (error) => {
    const maskedId = maskUserId(userId)
    logSocketError(`socket.error[${maskedId}]`, error)
  })
})

export {
  io,
  app,
  server,
  eventRateLimiter,
  createSocketEventValidator,
  maskUserId,
}
