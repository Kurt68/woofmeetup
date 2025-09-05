import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { Loader } from 'lucide-react'
import { Link } from 'react-router-dom'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const { isLoading, forgotPassword } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    await forgotPassword(email)
    setIsSubmitted(true)
  }

  return (
    <div className="overlay">
      <div className="auth-modal">
        <h2>Forgot Password</h2>
        <br />
        {!isSubmitted ? (
          <form onSubmit={handleSubmit}>
            <p className="modal-copy">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              style={{ height: '3.4rem' }}
              className="secondary-button"
              type="submit"
            >
              {isLoading ? (
                <Loader className="spin" size={28} />
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        ) : (
          <div className="forgot-password-message">
            <p className="">
              If <strong>{email}</strong>, has an account you will receive a
              password reset link shortly.
            </p>
          </div>
        )}
        <br />
        <Link style={{ color: 'black' }} to={'/'}>
          &lt;&lt; Back to Home Page
        </Link>
      </div>
    </div>
  )
}
export default ForgotPasswordPage
