import { create } from 'zustand'
import axiosInstance from '../config/axiosInstance'
import { getErrorMessage } from '../utilities/axiosUtils.js'
import { ensureCsrfToken } from '../services/csrfService.js'
import {
  connectSocket,
  disconnectSocket,
  isSocketConnected,
} from '../services/socketService.js'

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  error: null,
  isLoading: false,
  isCheckingAuth: true,
  message: null,
  onlineUsers: [],
  socket: null,

  signup: async (email, password, userName, referralSource) => {
    set({ isLoading: true, error: null })
    try {
      await ensureCsrfToken()
      const signupData = {
        email,
        password,
        userName,
      }
      if (referralSource) {
        signupData.referral_source = referralSource
      }
      const response = await axiosInstance.post('/api/auth/signup', signupData)
      // Security Fix: JWT token is now stored in httpOnly cookies by backend
      // Removed sessionStorage usage to prevent XSS token theft
      // Backend automatically sets secure cookie, no need to store locally
      set({ user: response.data.user, isAuthenticated: true, isLoading: false })
      try {
        get().connectSocket()
      } catch (socketError) {
        console.error('⚠️ Failed to connect socket after signup:', socketError)
      }
    } catch (error) {
      const msg = getErrorMessage(error, 'Error signing up')
      set({
        error: msg,
        isLoading: false,
      })
      // Rethrow error so handleSubmit in useAuthModal can catch it and prevent navigation
      throw error
    }
  },

  login: async (email, password) => {
    console.log('🔐 [useAuthStore] login START', { email })
    set({ isLoading: true, error: null })
    try {
      await ensureCsrfToken()
      console.log('🔐 [useAuthStore] CSRF token obtained')
      const response = await axiosInstance.post('/api/auth/login', {
        email,
        password,
      })
      console.log('🔐 [useAuthStore] login response:', response.data)
      // Security Fix: JWT token is now stored in httpOnly cookies by backend
      // Removed sessionStorage usage to prevent XSS token theft
      // Backend automatically sets secure cookie, no need to store locally
      set({
        isAuthenticated: true,
        user: response.data.user,
        error: null,
        isLoading: false,
      })
      console.log('🔐 [useAuthStore] state updated, isAuthenticated=true')
      try {
        get().connectSocket()
      } catch (socketError) {
        console.error('⚠️ Failed to connect socket after login:', socketError)
      }
    } catch (error) {
      console.error('🔐 [useAuthStore] login ERROR:', error.message)
      const msg = getErrorMessage(error, 'Error logging in')
      set({
        error: msg,
        isLoading: false,
      })
      // Rethrow error so handleSubmit in useAuthModal can catch it and prevent navigation
      throw error
    }
  },
  logout: async () => {
    set({ isLoading: true, error: null })
    try {
      await ensureCsrfToken()
      await axiosInstance.post('/api/auth/logout')
      // Security Fix: JWT token is automatically cleared by httpOnly cookie expiration
      // No manual sessionStorage cleanup needed
      set({
        user: null,
        isAuthenticated: false,
        error: null,
        isLoading: false,
      })
      get().disconnectSocket()
    } catch (error) {
      set({ error: 'Error logging out', isLoading: false })
    }
  },

  verifyEmail: async (code) => {
    set({ isLoading: true, error: null })
    try {
      await ensureCsrfToken()
      const response = await axiosInstance.post('/api/auth/verify-email', {
        code,
      })
      set({ user: response.data.user, isAuthenticated: true, isLoading: false })
      return response.data
    } catch (error) {
      const msg = getErrorMessage(error, 'Error verifying email')
      set({
        error: msg,
        isLoading: false,
      })
      throw error
    }
  },
  checkAuth: async () => {
    set({ isCheckingAuth: true, error: null })
    try {
      const response = await axiosInstance.get('/api/auth/check-auth', {
        params: { _t: Date.now() },
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      })
      // Security Fix: JWT token is now stored in httpOnly cookies by backend
      // Removed sessionStorage usage - cookies are automatically sent with requests
      // No need to manually manage token storage
      set({
        user: response.data.user,
        isAuthenticated: true,
        isCheckingAuth: false,
      })
      try {
        get().connectSocket()
      } catch (socketError) {
        console.error('⚠️ Failed to connect socket after checkAuth:', socketError)
      }
    } catch (error) {
      set({ error: null, isCheckingAuth: false, isAuthenticated: false })
    }
  },
  forgotPassword: async (email) => {
    set({ isLoading: true, error: null })
    try {
      await ensureCsrfToken()
      const response = await axiosInstance.post('/api/auth/forgot-password', {
        email,
      })
      set({ message: response.data.message, isLoading: false })
    } catch (error) {
      const msg = getErrorMessage(error, 'Error sending reset password email')
      set({
        isLoading: false,
        error: msg,
      })
    }
  },
  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null })
    try {
      await ensureCsrfToken()
      const response = await axiosInstance.post(
        `/api/auth/reset-password/${token}`,
        {
          password,
        }
      )
      set({ message: response.data.message, isLoading: false })
    } catch (error) {
      const msg = getErrorMessage(error, 'Error resetting password')
      set({
        isLoading: false,
        error: msg,
      })
    }
  },

  connectSocket: () => {
    const { user } = get()
    if (!user || isSocketConnected()) return

    const socket = connectSocket(user.user_id, user._id, (onlineUsers) => {
      set({ onlineUsers })
    })

    set({ socket })
  },
  disconnectSocket: () => {
    disconnectSocket()
    set({ socket: null })
  },

  unmatchUser: async (matchedUserId) => {
    const { user } = get()
    await ensureCsrfToken()
    await axiosInstance.put('/api/auth/removematch', {
      userId: user.user_id,
      matchedUserId: matchedUserId,
    })

    // Update local user state to remove the match
    const updatedMatches = user.matches.filter(
      (match) => match.user_id !== matchedUserId
    )
    set({
      user: {
        ...user,
        matches: updatedMatches,
      },
    })

    return { success: true }
  },

  clearError: () => {
    set({ error: null })
  },

  setUser: (userData) => {
    set({ user: userData })
  },

  fetchPublicProfile: async (userId, coordinates) => {
    let url = `/api/auth/public-profile/${userId}`
    if (coordinates) {
      const params = new URLSearchParams({
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
      })
      url += `?${params.toString()}`
    }
    const response = await axiosInstance.get(url)
    return response.data.user
  },

  updateProfileVisibility: async (userId, isProfilePublic) => {
    await ensureCsrfToken()
    const response = await axiosInstance.patch('/api/auth/profile-visibility', {
      userId,
      isProfilePublic,
    })
    set((state) => ({
      user: {
        ...state.user,
        isProfilePublic,
      },
    }))
    return response.data
  },
}))
