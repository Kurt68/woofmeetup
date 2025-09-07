import { create } from 'zustand'
import axios from 'axios'
import { io } from 'socket.io-client'

const API_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000/api/auth'
    : '/api/auth'
const SOCKET_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000'
    : window.location.origin

axios.defaults.withCredentials = true

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  error: null,
  isLoading: false,
  isCheckingAuth: true,
  message: null,
  onlineUsers: [],
  socket: null,

  signup: async (email, password, userName) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.post(`${API_URL}/signup`, {
        email,
        password,
        userName,
      })
      set({ user: response.data.user, isAuthenticated: true, isLoading: false })
      get().connectSocket()
    } catch (error) {
      set({
        error: error.response.data.message || 'Error signing up',
        isLoading: false,
      })
      throw error
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password })
      set({
        isAuthenticated: true,
        user: response.data.user,
        error: null,
        isLoading: false,
      })
      get().connectSocket()
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error logging in',
        isLoading: false,
      })
      throw error
    }
  },
  logout: async () => {
    set({ isLoading: true, error: null })
    try {
      await axios.post(`${API_URL}/logout`)
      set({
        user: null,
        isAuthenticated: false,
        error: null,
        isLoading: false,
      })
      get().disconnectSocket()
    } catch (error) {
      set({ error: 'Error logging out', isLoading: false })
      throw error
    }
  },

  verifyEmail: async (code) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.post(`${API_URL}/verify-email`, { code })
      set({ user: response.data.user, isAuthenticated: true, isLoading: false })
      return response.data
    } catch (error) {
      set({
        error: error.response.data.message || 'Error verifying email',
        isLoading: false,
      })
      throw error
    }
  },
  checkAuth: async () => {
    // await new Promise((resolve) => setTimeout(resolve, 2000))
    set({ isCheckingAuth: true, error: null })
    try {
      const response = await axios.get(`${API_URL}/check-auth`)
      set({
        user: response.data.user,
        isAuthenticated: true,
        isCheckingAuth: false,
      })
      get().connectSocket()
    } catch (error) {
      set({ error: null, isCheckingAuth: false, isAuthenticated: false })
    }
  },
  forgotPassword: async (email) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.post(`${API_URL}/forgot-password`, { email })
      set({ message: response.data.message, isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error:
          error.response.data.message || 'Error sending reset password email',
      })
      throw error
    }
  },
  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.post(`${API_URL}/reset-password/${token}`, {
        password,
      })
      set({ message: response.data.message, isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error.response.data.message || 'Error resetting password',
      })
      throw error
    }
  },

  connectSocket: () => {
    const { user } = get()
    if (!user || get().socket?.connected) return

    const socket = io(SOCKET_URL, {
      query: {
        userId: user._id,
      },
    })
    socket.connect()

    set({ socket: socket })

    socket.on('getOnlineUsers', (userIds) => {
      set({ onlineUsers: userIds })
    })
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect()
  },
}))
