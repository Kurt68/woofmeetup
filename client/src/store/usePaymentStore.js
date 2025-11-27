import { create } from 'zustand'
import axiosInstance from '../config/axiosInstance'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../utilities/axiosUtils.js'
import { ensureCsrfToken } from '../services/csrfService.js'
import { trackPaymentInitiated } from '../services/analyticsService.js'

export const usePaymentStore = create((set, get) => ({
  subscription: null,
  creditPackages: null,
  paymentHistory: [],
  isLoading: false,
  loadingPackage: null, // Track which package is being processed
  error: null,

  // Fetch subscription status
  fetchSubscriptionStatus: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosInstance.get(
        '/api/payments/subscription-status'
      )
      set({ subscription: response.data.data.subscription, isLoading: false })
      return response.data.data.subscription
    } catch (error) {
      const msg = getErrorMessage(error, 'Error fetching subscription')
      set({
        error: msg,
        isLoading: false,
      })
    }
  },

  // Create subscription checkout
  createSubscriptionCheckout: async (planType) => {
    set({ isLoading: true, error: null })
    try {
      await ensureCsrfToken()
      const response = await axiosInstance.post(
        '/api/payments/create-subscription-checkout',
        {
          planType,
        }
      )

      if (response.data.data.url) {
        trackPaymentInitiated(0, planType)
        window.location.href = response.data.data.url
      }

      set({ isLoading: false })
      return response.data.data
    } catch (error) {
      const msg = getErrorMessage(error, 'Error creating checkout')
      set({
        error: msg,
        isLoading: false,
      })
      toast.error('Failed to create checkout session')
    }
  },

  // Create credits checkout
  createCreditsCheckout: async (packageType) => {
    set({ loadingPackage: packageType, error: null })
    try {
      await ensureCsrfToken()
      const response = await axiosInstance.post(
        '/api/payments/create-credits-checkout',
        {
          packageType,
        }
      )

      if (response.data.data.url) {
        trackPaymentInitiated(0, packageType)
        window.location.href = response.data.data.url
      }

      set({ loadingPackage: null })
      return response.data.data
    } catch (error) {
      const msg = getErrorMessage(error, 'Error creating checkout')
      set({
        error: msg,
        loadingPackage: null,
      })
      toast.error(msg)
    }
  },

  // Cancel subscription
  cancelSubscription: async () => {
    set({ isLoading: true, error: null })
    try {
      await ensureCsrfToken()
      const response = await axiosInstance.post(
        '/api/payments/cancel-subscription'
      )

      // Update local subscription state
      const currentSub = get().subscription
      set({
        subscription: {
          ...currentSub,
          status: 'canceling',
          endDate: response.data.data.endDate,
        },
        isLoading: false,
      })

      toast.success('Subscription will be canceled at period end')
      return response.data.data
    } catch (error) {
      const msg = getErrorMessage(error, 'Error canceling subscription')
      set({
        error: msg,
        isLoading: false,
      })
      toast.error('Failed to cancel subscription')
    }
  },

  // Reactivate subscription
  reactivateSubscription: async () => {
    set({ isLoading: true, error: null })
    try {
      await ensureCsrfToken()
      const response = await axiosInstance.post(
        '/api/payments/reactivate-subscription'
      )

      // Update local subscription state
      const currentSub = get().subscription
      set({
        subscription: {
          ...currentSub,
          status: 'active',
          endDate: null,
        },
        isLoading: false,
      })

      toast.success('Subscription reactivated successfully')
      return response.data.data
    } catch (error) {
      const msg = getErrorMessage(error, 'Error reactivating subscription')
      set({
        error: msg,
        isLoading: false,
      })
      toast.error('Failed to reactivate subscription')
    }
  },

  // Fetch payment history
  fetchPaymentHistory: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosInstance.get('/api/payments/payment-history')
      set({ paymentHistory: response.data.data.transactions, isLoading: false })
      return response.data.data.transactions
    } catch (error) {
      const msg = getErrorMessage(error, 'Error fetching payment history')
      set({
        error: msg,
        isLoading: false,
      })
    }
  },

  // Fetch credit packages
  fetchCreditPackages: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosInstance.get('/api/payments/credit-packages')
      set({ creditPackages: response.data.data.packages, isLoading: false })
      return response.data.data.packages
    } catch (error) {
      const msg = getErrorMessage(error, 'Error fetching credit packages')
      set({
        error: msg,
        isLoading: false,
      })
    }
  },

  // Create portal session
  createPortalSession: async () => {
    set({ isLoading: true, error: null })
    try {
      await ensureCsrfToken()
      const response = await axiosInstance.post(
        '/api/payments/create-portal-session'
      )

      if (response.data.data.url) {
        window.location.href = response.data.data.url
      }

      set({ isLoading: false })
      return response.data.data
    } catch (error) {
      const msg = getErrorMessage(error, 'Error creating portal session')
      set({
        error: msg,
        isLoading: false,
      })
      toast.error('Failed to open billing portal')
    }
  },
}))
