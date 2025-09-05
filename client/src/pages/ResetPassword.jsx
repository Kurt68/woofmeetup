import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const ResetPassword = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { resetPassword, error, isLoading, message } = useAuthStore()

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

      toast.success('Password reset successfully, redirecting to home page...')
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'Error resetting password')
    }
  }

  return (
    <div className="overlay">
      <div className="auth-modal">
        <h2>Reset Password</h2>
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
            {isLoading ? 'Resetting...' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
export default ResetPassword
