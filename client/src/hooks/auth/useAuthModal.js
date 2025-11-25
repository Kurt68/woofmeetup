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
    console.log('🔍 EMAIL VALIDATION:', { email, isAfterFirstSubmit, errors })
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
    console.log('📝 FORM SUBMITTED')
    e.preventDefault()
    setIsAfterFirstSubmit(true)

    // Validate email and password synchronously
    const emailValidationErrors = checkEmail(email)
    const passwordValidationErrors = checkPassword(password, isSignUp)
    console.log('✅ SYNC VALIDATION:', {
      emailValidationErrors,
      passwordValidationErrors,
    })

    // Validate userName only for signup
    const userNameValidationErrors = isSignUp ? checkUserName(userName) : []

    // Check for validation errors and don't proceed if any exist
    if (
      emailValidationErrors.length > 0 ||
      passwordValidationErrors.length > 0 ||
      userNameValidationErrors.length > 0
    ) {
      return
    }

    if (isSignUp && password !== confirmPassword) {
      setPasswordMatchError('Passwords need to match!')
      return
    }

    try {
      // SECURITY FIX: Ensure CSRF token is loaded before making authenticated requests
      // This prevents race conditions where the form is submitted before the token is fetched
      const csrfToken = await ensureCsrfToken()
      if (!csrfToken) {
        console.error('🔐 CSRF token unavailable - delaying submission')
        setServerError(
          'Security initialization incomplete. Please try again in a moment.'
        )
        return
      }

      if (isSignUp) {
        await signup(email, password, userName, referralSource)
        trackSignup('email')
        toast.success('Your profile is now public on Woof. You can change this anytime in Account Settings.', { duration: 6000 })
        navigate('/verify-email')
      } else {
        await login(email, password)
        trackLogin()
        navigate('/dashboard')
      }
    } catch (serverError) {
      // Enhanced error handling with specific messages
      console.error('📡 Auth error caught:', serverError)
      let errorMessage = 'An error occurred. Please try again.'

      if (serverError.response) {
        const statusCode = serverError.response.status
        const errorCode = serverError.response.data?.code

        // CSRF token validation failure
        if (statusCode === 403 && errorCode === 'CSRF_TOKEN_INVALID') {
          console.error(
            '🔐 CSRF token validation failed during login - page may need refresh'
          )
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
      .catch((error) => {
        setTurnstileError(
          'Unable to verify. Please check your connection and try again.'
        )
      })
  }

  const handleTurnstileError = (errorCode) => {
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
