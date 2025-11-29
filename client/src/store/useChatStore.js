import { create } from 'zustand'
import toast from 'react-hot-toast'
import axiosInstance from '../config/axiosInstance'
import { useAuthStore } from './useAuthStore'
import { getErrorMessage } from '../utilities/axiosUtils.js'
import { ensureCsrfToken } from '../services/csrfService.js'
import {
  trackMessageSent,
  trackFirstMessageConversion,
} from '../services/analyticsService.js'

let reconnectHandler = null
let imageUpdateHandler = null
const messageRefreshIntervals = new Map()
const pollTimers = new Map()

export const useChatStore = create((set, get) => ({
  messages: [],
  selectedUser: null,
  isMessagesLoading: false,
  isChatOpen: false,

  setIsChatOpen: (isOpen) => set({ isChatOpen: isOpen }),

  getMessages: async (userId) => {
    set({ isMessagesLoading: true })
    try {
      const res = await axiosInstance.get(`/api/messages/${userId}`, {
        params: { _t: Date.now() },
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      })
      set({ messages: res.data.data })
    } catch (error) {
      const msg = getErrorMessage(error, 'Failed to load messages')
      toast.error(msg)
    } finally {
      set({ isMessagesLoading: false })
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get()

    if (!selectedUser || !selectedUser._id) {
      toast.error('Please select a user to send a message')
      return
    }

    try {
      if (import.meta.env.MODE === 'development') {
        console.log('📨 Sending message:', {
          hasText: !!messageData.text,
          hasImageBlob: !!messageData.imageBlob,
          imageBlobType: messageData.imageBlob?.type || 'N/A',
          imageBlobSize: messageData.imageBlob?.size || 0,
        })
      }

      await ensureCsrfToken()
      const sendStart = performance.now()
      
      let postData = messageData
      let config = undefined
      
      // If sending image as blob, convert to FormData for binary transmission
      if (messageData.imageBlob) {
        postData = new FormData()
        postData.append('text', messageData.text || '')
        postData.append('image', messageData.imageBlob, 'image.jpg')
      }
      
      const res = await axiosInstance.post(
        `/api/messages/send/${selectedUser._id}`,
        postData,
        config
      )
      const sendEnd = performance.now()
      if (import.meta.env.MODE === 'development') {
        console.log(`⏱️ Message POST took ${(sendEnd - sendStart).toFixed(0)}ms`)
        console.log('📨 Server response:', res.status, res.data)
      }
      const newMessage = res.data.data
      if (import.meta.env.MODE === 'development') {
        console.log('📨 Adding message to state:', newMessage)
        console.log('📨 Current messages count:', messages.length, '→ will be:', messages.length + 1)
      }
      set({ messages: [...messages, newMessage] })
      if (import.meta.env.MODE === 'development') {
        console.log('📨 Message added to state, new messages:', get().messages.length)
      }
      trackMessageSent(1)

      if (messages.length === 0) {
        trackFirstMessageConversion()
      }

      // If image was sent, poll for image URL update as fallback
      if (messageData.imageBlob && newMessage._id) {
        if (import.meta.env.MODE === 'development') {
          console.log(`⏱️ Starting image poll for message ${newMessage._id}`)
        }
        
        // Clean up any existing timer for this message
        if (pollTimers.has(newMessage._id)) {
          clearInterval(pollTimers.get(newMessage._id))
          pollTimers.delete(newMessage._id)
        }
        
        let attempts = 0
        const pollTimer = setInterval(async () => {
          attempts++
          if (attempts > 30) {
            clearInterval(pollTimer)
            pollTimers.delete(newMessage._id)
            if (import.meta.env.MODE === 'development') {
              console.log(`⏱️ Image poll stopped after 30 attempts for ${newMessage._id}`)
            }
            return
          }
          try {
            const { data: { data: messageList } } = await axiosInstance.get(
              `/api/messages/${selectedUser._id}`,
              { params: { _t: Date.now() } }
            )
            const updated = messageList.find((m) => m._id === newMessage._id)
            if (updated && updated.image) {
              if (import.meta.env.MODE === 'development') {
                console.log(`✅ Image detected in poll for ${newMessage._id}`)
              }
              const current = get().messages
              const msgs = current.map((m) =>
                m._id === newMessage._id ? updated : m
              )
              set({ messages: msgs })
              clearInterval(pollTimer)
              pollTimers.delete(newMessage._id)
            }
          } catch (e) {
            if (import.meta.env.MODE === 'development') {
              console.error('Image poll error:', e)
            }
            if (attempts >= 30) {
              clearInterval(pollTimer)
              pollTimers.delete(newMessage._id)
            }
          }
        }, 500)
        
        pollTimers.set(newMessage._id, pollTimer)
      }

      // Update user's message credits in auth store
      const authState = useAuthStore.getState()
      if (authState.user && authState.user.subscription === 'free') {
        const updatedUser = {
          ...authState.user,
          messageCredits: Math.max(0, (authState.user.messageCredits || 0) - 1),
          totalMessagesSent: (authState.user.totalMessagesSent || 0) + 1,
        }
        useAuthStore.setState({ user: updatedUser })
      }
    } catch (error) {
      const msg = getErrorMessage(error, 'Failed to send message')
      toast.error(msg)
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get()
    if (!selectedUser) {
      return
    }

    const socket = useAuthStore.getState().socket
    if (!socket || !socket.connected) {
      if (import.meta.env.MODE === 'development') {
        console.warn('⚠️ Socket not connected yet, retrying...')
      }
      setTimeout(() => {
        get().subscribeToMessages()
      }, 500)
      return
    }

    if (import.meta.env.MODE === 'development') {
      console.log(
        '🔌 subscribeToMessages: Setting up listener for user:',
        selectedUser._id
      )
    }

    // Remove old listeners to prevent duplicates (memory leak fix)
    socket.off('newMessage')
    socket.off('chatCleared')

    const handleNewMessage = (newMessage, ack) => {
      const currentState = get()
      const isMessageForCurrentChat =
        (newMessage.senderId === selectedUser?._id ||
          newMessage.receiverId === selectedUser?._id)

      if (isMessageForCurrentChat) {
        set({
          messages: [...currentState.messages, newMessage],
        })
      }

      if (typeof ack === 'function') ack(true)
    }

    const handleChatCleared = (data, ack) => {
      // If the other user cleared the chat, clear messages on this side too
      if (data && data.userId === selectedUser._id) {
        set({
          messages: [],
        })
        try {
          if (toast && typeof toast.info === 'function') {
            toast.info('The chat has been cleared by the other user', {
              duration: 3000,
            })
          }
        } catch (error) {
          if (import.meta.env.MODE === 'development') {
            console.error('Error showing toast:', error)
          }
        }
        if (import.meta.env.MODE === 'development') {
          console.log('🗑️ Chat cleared by other user')
        }
      }
      // Send acknowledgment back to server
      if (typeof ack === 'function') ack(true)
    }

    const handleReconnect = async () => {
      const currentSelectedUser = get().selectedUser
      if (!currentSelectedUser) return
      
      if (import.meta.env.MODE === 'development') {
        console.log('🔄 Socket reconnected, fetching messages for:', currentSelectedUser._id)
      }
      setTimeout(async () => {
        try {
          await get().getMessages(currentSelectedUser._id)
          if (import.meta.env.MODE === 'development') {
            console.log('✅ Messages fetched after reconnect')
          }
        } catch (error) {
          if (import.meta.env.MODE === 'development') {
            console.error('Failed to fetch messages on reconnect:', error)
          }
        }
      }, 300)
    }

    const handleImageUpdated = (data) => {
      const { messageId, imageUrl } = data
      const currentState = get()
      if (import.meta.env.MODE === 'development') {
        console.log(`🖼️ handleImageUpdated received for ${messageId}, current messages:`, currentState.messages.length, 'messages')
      }
      const updatedMessages = currentState.messages.map((msg) => {
        if (msg._id === messageId) {
          if (import.meta.env.MODE === 'development') {
            console.log(`  ✅ Updated message ${messageId} with image URL`)
          }
          return { ...msg, image: imageUrl }
        }
        return msg
      })
      set({ messages: updatedMessages })
      if (import.meta.env.MODE === 'development') {
        console.log(`✅ Message ${messageId} image updated, new messages:`, updatedMessages.length)
      }
    }

    socket.on('newMessage', handleNewMessage)
    socket.on('chatCleared', handleChatCleared)
    socket.on('messageImageUpdated', handleImageUpdated)
    socket.on('connect', handleReconnect)
    
    reconnectHandler = handleReconnect
    imageUpdateHandler = handleImageUpdated
    
    if (import.meta.env.MODE === 'development') {
      console.log('✅ Socket listeners registered, including messageImageUpdated')
    }
    
    // Clean up any existing interval for this user before creating a new one
    if (messageRefreshIntervals.has(selectedUser._id)) {
      clearInterval(messageRefreshIntervals.get(selectedUser._id))
    }
    
    const interval = setInterval(async () => {
      try {
        await get().getMessages(selectedUser._id)
      } catch (error) {
        console.error('Periodic message refresh failed:', error)
      }
    }, 60000)
    
    messageRefreshIntervals.set(selectedUser._id, interval)
    
    if (import.meta.env.MODE === 'development') {
      console.log('✅ Message listeners registered for user:', selectedUser._id)
    }
  },

  unsubscribeFromMessages: () => {
    const { selectedUser } = get()
    const socket = useAuthStore.getState().socket
    
    socket.off('newMessage')
    socket.off('chatCleared')
    if (reconnectHandler) {
      socket.off('connect', reconnectHandler)
      reconnectHandler = null
    }
    if (imageUpdateHandler) {
      socket.off('messageImageUpdated', imageUpdateHandler)
      imageUpdateHandler = null
    }
    
    // Clean up message refresh interval for this user
    if (selectedUser && messageRefreshIntervals.has(selectedUser._id)) {
      clearInterval(messageRefreshIntervals.get(selectedUser._id))
      messageRefreshIntervals.delete(selectedUser._id)
    }
    
    // Clean up any pending poll timers for this user's messages
    pollTimers.forEach((timer, messageId) => {
      clearInterval(timer)
      pollTimers.delete(messageId)
    })
  },

  clearMessages: async () => {
    const { selectedUser } = get()
    if (!selectedUser) return

    try {
      await ensureCsrfToken()
      await axiosInstance.delete(`/api/messages/${selectedUser._id}`)
      set({ messages: [] })
      toast.success('Chat cleared successfully')
    } catch (error) {
      const msg = getErrorMessage(error, 'Failed to clear chat')
      toast.error(msg)
    }
  },

  setSelectedUser: async (selectedUser) => {
    set({ selectedUser })
    if (selectedUser) {
      setTimeout(async () => {
        try {
          await get().getMessages(selectedUser._id)
        } catch (error) {
          if (import.meta.env.MODE === 'development') {
            console.error('Failed to load messages for selected user:', error)
          }
        }
      }, 0)
    }
  },
}))
