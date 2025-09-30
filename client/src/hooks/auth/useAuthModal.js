import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { checkEmail, checkPassword } from '../../utilities/validators'
import { useAuthStore } from '../../store/useAuthStore'

const SERVER_URL =
  import.meta.env.MODE === 'development' ? 'http://localhost:8000' : ''

export const useAuthModal = (isSignUp) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userName, setUserName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMatchError, setPasswordMatchError] = useState('')
  const [isAfterFirstSubmit, setIsAfterFirstSubmit] = useState(false)
  const [serverError, setServerError] = useState(null)

  // Turnstile state
  const [showSignUpForm, setShowSignUpForm] = useState(false)
  const [showTurnstile, setShowTurnstile] = useState(true)
  const [turnstileError, setTurnstileError] = useState('')

  const { signup, login, error, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const emailErrors = useMemo(() => {
    return isAfterFirstSubmit ? checkEmail(email) : []
  }, [isAfterFirstSubmit, email])

  const passwordErrors = useMemo(() => {
    return isAfterFirstSubmit ? checkPassword(password) : []
  }, [isAfterFirstSubmit, password])

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    if (e.target.value === confirmPassword) {
      setPasswordMatchError('')
    }
  }

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value)
    if (e.target.value === password) {
      setPasswordMatchError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsAfterFirstSubmit(true)

    if (isSignUp && password !== confirmPassword) {
      setPasswordMatchError('Passwords need to match!')
      return
    }

    try {
      if (isSignUp) {
        await signup(email, password, userName)
        navigate('/verify-email')
      } else {
        await login(email, password)
        navigate('/dashboard')
      }
    } catch (serverError) {
      if (serverError.response) {
        setServerError(serverError.response.data)
      } else if (serverError.request) {
        setServerError('No response received from server')
      } else {
        setServerError('Error setting up request')
      }
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
        console.error('Turnstile verification error:', error)
        setTurnstileError(
          'Unable to verify. Please check your connection and try again.'
        )
      })
  }

  const handleTurnstileError = (errorCode) => {
    console.error('Turnstile widget error:', errorCode)
    setTurnstileError(
      'Security verification failed. Please refresh the page and try again.'
    )
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
    isLoading,
    authError: error,

    // Turnstile state
    showSignUpForm,
    showTurnstile,
    turnstileError,

    // Handlers
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleSubmit,
    handleTurnstileSuccess,
    handleTurnstileError,
  }
}
