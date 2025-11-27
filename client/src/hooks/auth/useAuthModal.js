import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
  checkEmail,
  checkPassword,
  checkUserName,
} from '../../utilities/validators'
import { useAuthStore } from '../../store/useAuthStore'
import { ensureCsrfToken } from '../../services/csrfService'
import { trackSignup, trackLogin } from '../../services/analyticsService'

const SERVER_URL =
  import.meta.env.MODE === 'development' ? 'http://localhost:8000' : ''

export const useAuthModal = (isSignUp, referralSource) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userName, setUserName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMatchError, setPasswordMatchError] = useState('')
  const [isAfterFirstSubmit, setIsAfterFirstSubmit] = useState(false)
  const [serverError, setServerError] = useState(null)

  // Turnstile state
  // For signup: show Turnstile first, then form after verification
  // For login: show form directly without Turnstile
  const [showSignUpForm, setShowSignUpForm] = useState(!isSignUp) // true for login, false for signup
  const [showTurnstile, setShowTurnstile] = useState(isSignUp) // true for signup, false for login
  const [turnstileError, setTurnstileError] = useState('')

  const { signup, login, error, isLoading, clearError } = useAuthStore()
  const navigate = useNavigate()

  const emailErrors = useMemo(() => {
    const errors = isAfterFirstSubmit ? checkEmail(email) : []
    if (import.meta.env.MODE === 'development') {
      console.log('🔍 EMAIL VALIDATION:', { email, isAfterFirstSubmit, errors })
    }
    return errors
  }, [isAfterFirstSubmit, email])

  const passwordErrors = useMemo(() => {
    return isAfterFirstSubmit ? checkPassword(password, isSignUp) : []
  }, [isAfterFirstSubmit, password, isSignUp])

  const userNameErrors = useMemo(() => {
    return isAfterFirstSubmit ? checkUserName(userName) : []
  }, [isAfterFirstSubmit, userName])

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    setServerError(null) // Clear server error when user starts typing
    if (e.target.value === confirmPassword) {
      setPasswordMatchError('')
    }
  }

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value)
    setServerError(null) // Clear server error when user starts typing
    if (e.target.value === password) {
      setPasswordMatchError('')
    }
  }

  const handleSubmit = async (e) => {
    if (import.meta.env.MODE === 'development') {
      console.log('📝 [handleSubmit] FORM SUBMITTED START', { isSignUp, email, timestamp: Date.now() })
    }
    e.preventDefault()
    if (import.meta.env.MODE === 'development') {
      console.log('📝 [handleSubmit] preventDefault called')
    }
    setIsAfterFirstSubmit(true)
    if (import.meta.env.MODE === 'development') {
      console.log('📝 [handleSubmit] setIsAfterFirstSubmit called')
    }

    // Validate email and password synchronously
    if (import.meta.env.MODE === 'development') {
      console.log('📝 [handleSubmit] Starting validation...')
    }
    const emailValidationErrors = checkEmail(email)
    const passwordValidationErrors = checkPassword(password, isSignUp)
    if (import.meta.env.MODE === 'development') {
      console.log('📝 [handleSubmit] Validation complete:', {
        emailValidationErrors: emailValidationErrors.length,
        passwordValidationErrors: passwordValidationErrors.length,
      })
    }

    // Validate userName only for signup
    const userNameValidationErrors = isSignUp ? checkUserName(userName) : []

    // Check for validation errors and don't proceed if any exist
    if (
      emailValidationErrors.length > 0 ||
      passwordValidationErrors.length > 0 ||
      userNameValidationErrors.length > 0
    ) {
      if (import.meta.env.MODE === 'development') {
        console.error('❌ [handleSubmit] Validation errors - early return', {
          emailErrors: emailValidationErrors.length,
          passwordErrors: passwordValidationErrors.length,
          userNameErrors: userNameValidationErrors.length,
        })
      }
      return
    }

    if (isSignUp && password !== confirmPassword) {
      if (import.meta.env.MODE === 'development') {
        console.error('❌ [handleSubmit] Password mismatch - early return')
      }
      setPasswordMatchError('Passwords need to match!')
      return
    }
    
    if (import.meta.env.MODE === 'development') {
      console.log('✅ [handleSubmit] All validation passed, proceeding to auth...')
    }

    try {
      if (import.meta.env.MODE === 'development') {
        console.log('🔐 [handleSubmit] Ensuring CSRF token...')
      }
      // SECURITY FIX: Ensure CSRF token is loaded before making authenticated requests
      // This prevents race conditions where the form is submitted before the token is fetched
      const csrfToken = await ensureCsrfToken()
      if (import.meta.env.MODE === 'development') {
        console.log('🔐 [handleSubmit] CSRF token result:', csrfToken ? 'SUCCESS' : 'FAILED')
      }
      if (!csrfToken) {
        if (import.meta.env.MODE === 'development') {
          console.error('🔐 CSRF token unavailable - delaying submission')
        }
        setServerError(
          'Security initialization incomplete. Please try again in a moment.'
        )
        return
      }
      if (import.meta.env.MODE === 'development') {
        console.log('🔐 [handleSubmit] CSRF token ready, proceeding...')
      }

      if (isSignUp) {
        await signup(email, password, userName, referralSource)
        trackSignup('email')
        toast.success('Your profile is now public on Woof. You can change this anytime in Account Settings.', { duration: 6000 })
        navigate('/verify-email')
      } else {
        if (import.meta.env.MODE === 'development') {
          console.log('📝 [useAuthModal] About to login...')
        }
        await login(email, password)
        if (import.meta.env.MODE === 'development') {
          console.log('✅ [useAuthModal] login() returned successfully')
        }
        trackLogin()
        if (import.meta.env.MODE === 'development') {
          console.log('📊 [useAuthModal] trackLogin() called')
        }
        // Check if user needs to verify email
        const authState = useAuthStore.getState()
        if (import.meta.env.MODE === 'development') {
          console.log('🔐 [useAuthModal] After login, authState.isAuthenticated:', authState.isAuthenticated)
          console.log('🔐 [useAuthModal] After login, authState.user:', authState.user)
          console.log('🔐 [useAuthModal] User isVerified:', authState.user?.isVerified)
        }
        if (authState.user && !authState.user.isVerified) {
          if (import.meta.env.MODE === 'development') {
            console.log('⚠️ [useAuthModal] NOT VERIFIED - navigating to /verify-email')
          }
          navigate('/verify-email')
        } else if (authState.user && authState.user.isVerified) {
          if (import.meta.env.MODE === 'development') {
            console.log('✅ [useAuthModal] VERIFIED - navigating to /dashboard')
          }
          navigate('/dashboard')
        } else {
          if (import.meta.env.MODE === 'development') {
            console.error('❌ [useAuthModal] NO USER OBJECT - cannot navigate!')
          }
        }
      }
    } catch (serverError) {
      // Enhanced error handling with specific messages
      if (import.meta.env.MODE === 'development') {
        console.error('📡 Auth error caught:', serverError)
      }
      let errorMessage = 'An error occurred. Please try again.'

      if (serverError.response) {
        const statusCode = serverError.response.status
        const errorCode = serverError.response.data?.code

        // CSRF token validation failure
        if (statusCode === 403 && errorCode === 'CSRF_TOKEN_INVALID') {
          if (import.meta.env.MODE === 'development') {
            console.error(
              '🔐 CSRF token validation failed during login - page may need refresh'
            )
          }
          errorMessage =
            'Security error: Please refresh the page and try again.'
        } else if (serverError.response.data?.message) {
          // Extract message from server response
          errorMessage = serverError.response.data.message
        } else if (serverError.response.data?.error) {
          errorMessage = serverError.response.data.error
        }
      } else if (serverError.request) {
        errorMessage = 'No response received from server'
      } else if (serverError.message) {
        errorMessage = serverError.message
      }

      // Clear store error to prevent duplicate error display
      clearError()
      setServerError(errorMessage)
    }
  }

  const handleTurnstileSuccess = (token) => {
    setTurnstileError('')

    axios
      .post(`${SERVER_URL}/verify-turnstile`, { token })
      .then((response) => {
        if (response.data.success) {
          setShowSignUpForm(true)
          setShowTurnstile(false)
        } else {
          setTurnstileError('Verification failed. Please try again.')
        }
      })
      .catch(() => {
        setTurnstileError(
          'Unable to verify. Please check your connection and try again.'
        )
      })
  }

  const handleTurnstileError = () => {
    setTurnstileError(
      'Security verification failed. Please refresh the page and try again.'
    )
  }

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    setServerError(null) // Clear server error when user starts typing
  }

  const handleUserNameChange = (e) => {
    setUserName(e.target.value)
    setServerError(null) // Clear server error when user starts typing
  }

  return {
    // Form state
    email,
    setEmail,
    password,
    userName,
    setUserName,
    confirmPassword,
    passwordMatchError,
    serverError,
    emailErrors,
    passwordErrors,
    userNameErrors,
    isLoading,
    authError: error,

    // Turnstile state
    showSignUpForm,
    showTurnstile,
    turnstileError,

    // Handlers
    handleEmailChange,
    handleUserNameChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleSubmit,
    handleTurnstileSuccess,
    handleTurnstileError,
  }
}
