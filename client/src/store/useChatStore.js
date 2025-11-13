import { create } from 'zustand'
import toast from 'react-hot-toast'
import axiosInstance from '../config/axiosInstance'
import { useAuthStore } from './useAuthStore'
import { getErrorMessage } from '../utilities/axiosUtils.js'
import { ensureCsrfToken } from '../services/csrfService.js'

let reconnectHandler = null
let messageRefreshInterval = null

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
      set({ messages: res.data })
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
      console.log('📨 Sending message:', {
        hasText: !!messageData.text,
        hasImage: !!messageData.image,
        imageLength: messageData.image?.length || 0,
        imageType: typeof messageData.image,
        imagePreview: messageData.image?.substring(0, 100),
      })

      await ensureCsrfToken()
      const res = await axiosInstance.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      )
      set({ messages: [...messages, res.data] })

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
      console.warn('⚠️ Socket not connected yet, retrying...')
      setTimeout(() => {
        get().subscribeToMessages()
      }, 500)
      return
    }

    console.log(
      '🔌 subscribeToMessages: Setting up listener for user:',
      selectedUser._id
    )

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
          console.error('Error showing toast:', error)
        }
        console.log('🗑️ Chat cleared by other user')
      }
      // Send acknowledgment back to server
      if (typeof ack === 'function') ack(true)
    }

    const handleReconnect = async () => {
      const currentSelectedUser = get().selectedUser
      if (!currentSelectedUser) return
      
      console.log('🔄 Socket reconnected, fetching messages for:', currentSelectedUser._id)
      setTimeout(async () => {
        try {
          await get().getMessages(currentSelectedUser._id)
          console.log('✅ Messages fetched after reconnect')
        } catch (error) {
          console.error('Failed to fetch messages on reconnect:', error)
        }
      }, 300)
    }

    socket.on('newMessage', handleNewMessage)
    socket.on('chatCleared', handleChatCleared)
    socket.on('connect', handleReconnect)
    
    reconnectHandler = handleReconnect
    
    if (messageRefreshInterval) clearInterval(messageRefreshInterval)
    messageRefreshInterval = setInterval(async () => {
      try {
        await get().getMessages(selectedUser._id)
      } catch (error) {
        console.error('Periodic message refresh failed:', error)
      }
    }, 10000)
    
    console.log('✅ Message listeners registered for user:', selectedUser._id)
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket
    socket.off('newMessage')
    socket.off('chatCleared')
    if (reconnectHandler) {
      socket.off('connect', reconnectHandler)
      reconnectHandler = null
    }
    if (messageRefreshInterval) {
      clearInterval(messageRefreshInterval)
      messageRefreshInterval = null
    }
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
          console.error('Failed to load messages for selected user:', error)
        }
      }, 0)
    }
  },
}))
