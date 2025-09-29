import { useState, useMemo } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { checkEmail, checkPassword } from '../utilities/validators'
import { Loader } from 'lucide-react'
import TurnstileWidget from './TurnstileWidget'

import { useAuthStore } from '../store/useAuthStore'

const SERVER_URL =
  import.meta.env.MODE === 'development' ? 'http://localhost:8000' : ''

const AuthModal = ({ setShowModal, isSignUp }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userName, setUserName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [passwordMatchError, setPasswordMatchError] = useState('') // email and password validation from utilities directory
  const [isAfterFirstSubmit, setIsAfterFirstSubmit] = useState(false)
  const [serverError, setServerError] = useState(null) // server error using express-validator

  const { signup, login, error, isLoading } = useAuthStore() // state management zustand

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

  // Cloudflare Turnstile state
  const [showSignUpForm, setShowSignUpForm] = useState(false)
  const [showTurnstile, setShowTurnstile] = useState(true)
  const [turnstileError, setTurnstileError] = useState('')

  let navigate = useNavigate()

  const handleClick = () => {
    setShowModal(false)
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
      } else if (ErrorEvent.request) {
        setServerError('No response received from server')
      } else {
        setServerError('Error setting up request')
      }
    }
  }

  // Cloudflare Turnstile functions
  const handleTurnstileSuccess = (token) => {
    // Clear any previous errors
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

  return (
    <div className="auth-modal">
      <div className="close-icon" onClick={handleClick}>
        &#x2715;
      </div>
      <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>

      {showTurnstile && (
        <div>
          <TurnstileWidget
            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
            onSuccess={handleTurnstileSuccess}
            onError={handleTurnstileError}
          />
          {turnstileError && (
            <div className="msg" style={{ color: 'red', marginTop: '10px' }}>
              {turnstileError}
            </div>
          )}
        </div>
      )}
      <p className="modal-copy">
        By clicking {isSignUp ? 'Create Account' : 'Log In'}, you agree to our
        terms. Learn how we process your data in our Privacy Policy, Terms of
        Service and Cookie Policy.
      </p>

      {showSignUpForm && (
        <form onSubmit={handleSubmit} className="form">
          <div
            className={`form-group ${emailErrors.length > 0 ? 'error' : ''}`}
          >
            <label className="label" htmlFor="name">
              Your First Name
            </label>
            <input
              className="input"
              type="text"
              id="name"
              placeholder="First Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              className="input"
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              // required={true}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {emailErrors.length > 0 && <div className="msg">{emailErrors}</div>}
          </div>
          <div
            className={`form-group ${passwordErrors.length > 0 ? 'error' : ''}`}
          >
            <br />
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              className="input"
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              // required={true}
              value={password}
              onChange={handlePasswordChange}
            />

            {passwordErrors.length > 0 && (
              <div className="msg">{passwordErrors}</div>
            )}
          </div>
          {!isSignUp && (
            <Link to="/forgot-password" className="forgot-password">
              Forgot Password
            </Link>
          )}

          {isSignUp && (
            <div
              className={`form-group ${
                passwordMatchError || serverError ? 'error' : ''
              }`}
            >
              <br />
              <label className="label" htmlFor="password-check">
                Password Confirm
              </label>
              <input
                type="password"
                id="password-check"
                name="password-check"
                placeholder="Confirm Password"
                value={confirmPassword}
                // required={true}
                onChange={handleConfirmPasswordChange}
              />
              {passwordMatchError && (
                <div className="msg">{passwordMatchError}</div>
              )}
            </div>
          )}
          <button
            className="secondary-button"
            style={{ height: '3.4rem' }}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? <Loader className="spin" size={28} /> : 'Submit'}
          </button>
          {/* Server error  */}
          {typeof serverError === 'string' ? (
            <p className="server-error">{serverError}</p>
          ) : null}

          <br />
          {/* authError */}
          {error && <p className="server-error">{error}</p>}
        </form>
      )}

      {/* <hr />
      <h2>Get the App</h2> */}
    </div>
  )
}

export default AuthModal
