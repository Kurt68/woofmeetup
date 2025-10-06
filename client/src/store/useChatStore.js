import { create } from 'zustand'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useAuthStore } from './useAuthStore'

const API_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000/api/messages'
    : '/api/messages'

axios.defaults.withCredentials = true

export const useChatStore = create((set, get) => ({
  messages: [],
  selectedUser: null,
  isMessagesLoading: false,

  getMessages: async (userId) => {
    set({ isMessagesLoading: true })
    try {
      const res = await axios.get(`${API_URL}/${userId}`)
      set({ messages: res.data })
    } catch (error) {
      toast.error(error.response.data.message)
    } finally {
      set({ isMessagesLoading: false })
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get()
    try {
      const res = await axios.post(
        `${API_URL}/send/${selectedUser._id}`,
        messageData
      )
      set({ messages: [...messages, res.data] })
    } catch (error) {
      toast.error(error.response.data.message)
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get()
    if (!selectedUser) return

    const socket = useAuthStore.getState().socket

    socket.on('newMessage', (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id
      if (!isMessageSentFromSelectedUser) return

      set({
        messages: [...get().messages, newMessage],
      })
    })
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket
    socket.off('newMessage')
  },

  clearMessages: async () => {
    const { selectedUser } = get()
    if (!selectedUser) return

    try {
      await axios.delete(`${API_URL}/${selectedUser._id}`)
      set({ messages: [] })
      toast.success('Chat cleared successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to clear chat')
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}))
