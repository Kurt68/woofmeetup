import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
// import { v4 as uuidv4 } from 'uuid' // COMMENTED OUT: No longer needed for custom captcha
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

  // COMMENTED OUT: Custom CAPTCHA state - Replaced with Cloudflare Turnstile
  // const [captchaToken, setCaptchaToken] = useState('')
  // const [captchaChallenge, setCaptchaChallenge] = useState('')
  // const [captchaInput, setCaptchaInput] = useState('')
  // const [validationResult, setValidationResult] = useState('')

  // const [showSignUpForm, setShowSignUpForm] = useState(false)
  // const [showCardCaptcha, setCardCaptcha] = useState(true)

  // Cloudflare Turnstile state
  const [showSignUpForm, setShowSignUpForm] = useState(false)
  const [showTurnstile, setShowTurnstile] = useState(true)

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

  // COMMENTED OUT: Custom CAPTCHA logic - Replaced with Cloudflare Turnstile
  // useEffect(() => {
  //   if (validationResult) {
  //     const messageTimeOut = setTimeout(() => {
  //       setShowSignUpForm(true)
  //       setCardCaptcha(false)
  //     }, 1500)

  //     return () => clearTimeout(messageTimeOut)
  //   }
  // }, [validationResult])

  // useEffect(() => {
  //   generateCaptchaToken()
  // }, [])

  // const generateCaptchaToken = () => {
  //   const newToken = uuidv4()
  //   setCaptchaToken(newToken)

  //   // Request a new CAPTCHA challenge from the server, including a timestamp
  //   axios
  //     .post(`${SERVER_URL}/generate-captcha`, {
  //       captchaToken: newToken,
  //       timestamp: Date.now(),
  //     })
  //     .then((response) => {
  //       setCaptchaChallenge(response.data.challenge)
  //     })
  //     .catch((serverError) => {
  //       console.error(serverError)
  //     })
  // }

  // const validateCaptcha = () => {
  //   // Send the CAPTCHA token, user input, and timestamp to the server for validation
  //   axios
  //     .post(`${SERVER_URL}/validate-captcha`, {
  //       captchaToken,
  //       captchaInput,
  //       timestamp: Date.now(),
  //     })
  //     .then((response) => {
  //       setValidationResult(response.data.message)

  //       setCaptchaChallenge('')
  //       setCaptchaInput('')
  //       generateCaptchaToken()
  //     })
  //     .catch((serverError) => {
  //       alert('Invalid CAPTCHA.\n\nPlease complete the challenge.')
  //       console.error(serverError)
  //     })
  // }

  // Cloudflare Turnstile functions
  const handleTurnstileSuccess = (token) => {
    // Verify the token with your server
    axios
      .post(`${SERVER_URL}/verify-turnstile`, { token })
      .then((response) => {
        if (response.data.success) {
          setShowSignUpForm(true)
          setShowTurnstile(false)
        }
      })
      .catch((error) => {
        console.error('Turnstile verification failed:', error)
        alert('Verification failed. Please try again.')
      })
  }

  const handleTurnstileError = () => {
    console.error('Turnstile widget failed to load')
    alert('Verification widget failed to load. Please refresh the page.')
  }

  return (
    <div className="auth-modal">
      <div className="close-icon" onClick={handleClick}>
        &#x2715;
      </div>
      <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>

      <p className="modal-copy">
        By clicking {isSignUp ? 'Create Account' : 'Log In'}, you agree to our
        terms. Learn how we process your data in our Privacy Policy, Terms of
        Service and Cookie Policy.
      </p>

      {showTurnstile && (
        <div className="card">
          <div>
            <p className="captcha-challenge">
              <strong>Security Verification</strong>
              <br className="challenge" />
              Please complete the verification below to continue.
            </p>
            <TurnstileWidget
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={handleTurnstileSuccess}
              onError={handleTurnstileError}
            />
          </div>
        </div>
      )}

      {/* COMMENTED OUT: Custom CAPTCHA UI - Replaced with Cloudflare Turnstile */}
      {/* {showCardCaptcha && (
        <div className="card">
          <div>
            <svg
              className="captcha-logo"
              xmlns="http://www.w3.org/2000/svg"
              width="54.8"
              height="54.799"
              viewBox="0 0 54.8 54.799"
            >
              <g transform="translate(-9.114 -1.067)">
                <g transform="translate(9.114 1.067)">
                  <path
                    d="M161.494,70.517l-6.38,4.035a.8.8,0,0,0-.126,1.309,12.291,12.291,0,0,1,3.342,6.672l-2.13.052a1.713,1.713,0,0,0-1.449,2.63l3.067,4.849,4.836,7.649a1.712,1.712,0,0,0,2.9,0l7.9-12.5a1.677,1.677,0,0,0,.259-.936,1.984,1.984,0,0,0-.294-.963A1.659,1.659,0,0,0,172,82.58l-2.255-.034a23.173,23.173,0,0,0-2.933-9.65,25.8,25.8,0,0,0-2.8-3.993c-.333-.385-.756-.289-1.025.142a4.367,4.367,0,0,1-1.5,1.472Z"
                    transform="translate(-118.912 -56.989)"
                  />
                  <path
                    d="M179.892,78.445l-4.035-6.38a.8.8,0,0,0-1.309-.126,12.291,12.291,0,0,1-6.672,3.342l-.052-2.13a1.713,1.713,0,0,0-2.63-1.449l-4.849,3.067L152.7,79.6a1.711,1.711,0,0,0,0,2.9l12.5,7.9a1.678,1.678,0,0,0,.936.259,1.983,1.983,0,0,0,.963-.294,1.658,1.658,0,0,0,.736-1.413l.035-2.255a23.172,23.172,0,0,0,9.65-2.933,25.826,25.826,0,0,0,3.993-2.8c.385-.333.289-.756-.141-1.025a4.362,4.362,0,0,1-1.472-1.5Z"
                    transform="translate(-138.621 -35.864)"
                  />
                  <path
                    d="M162.576,96.844l6.38-4.035a.8.8,0,0,0,.126-1.309,12.291,12.291,0,0,1-3.342-6.672l2.131-.052a1.713,1.713,0,0,0,1.449-2.63L166.253,77.3l-4.836-7.649a1.712,1.712,0,0,0-2.9,0l-7.9,12.5a1.678,1.678,0,0,0-.259.936,1.984,1.984,0,0,0,.294.963,1.659,1.659,0,0,0,1.413.736l2.255.034a23.174,23.174,0,0,0,2.933,9.65,25.805,25.805,0,0,0,2.8,3.993c.333.385.756.289,1.025-.142a4.368,4.368,0,0,1,1.5-1.472Z"
                    transform="translate(-150.357 -55.573)"
                  />
                  <path
                    d="M153.566,79.527l4.035,6.38a.8.8,0,0,0,1.309.126,12.292,12.292,0,0,1,6.672-3.342l.052,2.13a1.713,1.713,0,0,0,2.63,1.449l4.849-3.067,7.649-4.836a1.711,1.711,0,0,0,0-2.9l-12.5-7.9a1.678,1.678,0,0,0-.936-.259,1.982,1.982,0,0,0-.963.294,1.658,1.658,0,0,0-.736,1.413l-.035,2.255a23.174,23.174,0,0,0-9.65,2.933,25.835,25.835,0,0,0-3.993,2.8c-.385.333-.289.756.141,1.025a4.363,4.363,0,0,1,1.472,1.5Z"
                    transform="translate(-140.037 -67.308)"
                  />
                </g>
              </g>
            </svg>
            <p className="captcha-challenge">
              <strong>CAPTCHA Challenge</strong> <br className="challenge" />{' '}
              What is {captchaChallenge} ?
            </p>
            <input
              type="text"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
            />
            <button
              className="secondary-button"
              type="submit"
              onClick={validateCaptcha}
            >
              Submit
            </button>

            <p>{validationResult}</p>
          </div>
        </div>
      )*/}

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
