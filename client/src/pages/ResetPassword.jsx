import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHead } from '../components/PageHead'
import toast from 'react-hot-toast'
import { Loader } from 'lucide-react'

const ResetPassword = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { resetPassword, logout, error, isLoading, message } = useAuthStore()

  const { token } = useParams()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    try {
      await resetPassword(token, password)

      toast.success('Password reset successfully, logging you out...')
      // Log out user for security - they need to login with new password
      await logout()
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (error) {
      toast.error(error.message || 'Error resetting password')
    }
  }

  return (
    <>
      <PageHead
        title="Reset Password"
        description="Create a new password for your Woof Meetup account."
      />
      <div className="overlay" aria-hidden="true">
        <div
          className="auth-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-password-heading"
      >
        <h2 id="reset-password-heading">Reset Password</h2>
        <br />
        {error && <p className="server-error">{error}</p>}
        {message && <p className="">{message}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <br />
          <button
            className="secondary-button"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <Loader className="spin" size={28} />
                <span>Resetting</span>
              </div>
            ) : (
              'Set New Password'
            )}
          </button>
        </form>
      </div>
      </div>
    </>
  )
}
export default ResetPassword
