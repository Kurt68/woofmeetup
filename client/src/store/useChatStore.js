import { create } from 'zustand'
import toast from 'react-hot-toast'
import axiosInstance from '../config/axiosInstance'
import { useAuthStore } from './useAuthStore'
import { getErrorMessage } from '../utilities/axiosUtils.js'
import { ensureCsrfToken } from '../services/csrfService.js'

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
      console.log('❌ subscribeToMessages: No selected user')
      return
    }

    const socket = useAuthStore.getState().socket
    if (!socket) {
      console.log('❌ subscribeToMessages: No socket available')
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
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id

      console.log(
        '📨 newMessage event received from server. Sender:',
        newMessage.senderId,
        'Selected user:',
        selectedUser._id,
        'Match:',
        isMessageSentFromSelectedUser
      )

      if (!isMessageSentFromSelectedUser) {
        // Still acknowledge even if not for this user
        if (typeof ack === 'function') ack(true)
        return
      }

      set({
        messages: [...get().messages, newMessage],
      })
      console.log('✅ Message added to store:', newMessage._id)

      // Send acknowledgment back to server
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

    socket.on('newMessage', handleNewMessage)
    socket.on('chatCleared', handleChatCleared)
    console.log('✅ Message listeners registered for user:', selectedUser._id)
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket
    socket.off('newMessage')
    socket.off('chatCleared')
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

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}))
