/**
 * Socket.IO Connection Service
 * Centralized management of Socket.IO connections and lifecycle
 * Extracted from useAuthStore for better separation of concerns
 */

import { io } from 'socket.io-client'

const SOCKET_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000'
    : window.location.origin

let socketInstance = null

/**
 * Connect to Socket.IO server
 * @param {string} userId - User ID
 * @param {string} mongoId - MongoDB user ID
 * @param {Function} onOnlineUsersChange - Callback when online users change
 * @returns {Socket} Socket.IO instance
 */
export const connectSocket = (userId, mongoId, onOnlineUsersChange) => {
  // Prevent multiple connections
  if (socketInstance?.connected) {
    console.log('✅ Socket already connected:', socketInstance.id)
    return socketInstance
  }

  // Security Fix: JWT tokens are now stored in httpOnly cookies
  // Socket.IO will automatically send cookies with the handshake request
  // We don't extract the token manually from sessionStorage anymore to prevent XSS
  socketInstance = io(SOCKET_URL, {
    // Critical: withCredentials must be true to send httpOnly cookies in cross-origin requests
    // In development: frontend (localhost:5173) → backend (localhost:8000) are different origins
    // Browser security requires explicit credential sending in this case
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: 15,
    reconnectionAttemptDelay: 2000,
    // Polling-specific config for mobile reliability
    rememberUpgrade: true,
    upgrade: true,
  })

  // Debug polling transport issues
  if (socketInstance.io.engine) {
    socketInstance.io.engine.on('upgrade', (transport) => {
      console.log(`🔄 Socket.io upgraded to transport:`, transport.name)
    })
  }

  // Handle connection events
  socketInstance.on('connect', () => {
    const transport = socketInstance.io.engine.transport.name
    console.log('✅ Socket connected:', socketInstance.id, `(transport: ${transport})`)
  })

  socketInstance.on('disconnect', () => {
    console.log('❌ Socket disconnected')
  })

  socketInstance.on('connect_error', (error) => {
    console.error('🔴 Socket connection error:', error.message)
  })

  socketInstance.on('disconnect_reason', (reason) => {
    console.warn('⚠️ Socket disconnect reason:', reason)
  })

  socketInstance.on('getOnlineUsers', (userIds) => {
    if (onOnlineUsersChange) {
      onOnlineUsersChange(userIds)
    }
  })

  return socketInstance
}

/**
 * Disconnect Socket.IO
 */
export const disconnectSocket = () => {
  if (socketInstance?.connected) {
    socketInstance.disconnect()
    socketInstance = null
    console.log('❌ Socket disconnected')
  }
}

/**
 * Get current socket instance
 * @returns {Socket|null} Socket instance or null if not connected
 */
export const getSocket = () => {
  return socketInstance
}

/**
 * Check if socket is connected
 * @returns {boolean} True if socket is connected
 */
export const isSocketConnected = () => {
  return socketInstance?.connected || false
}
