import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import Nav from '../components/layout/Nav'
import { PageHead } from '../components/PageHead'
import axiosInstance from '../config/axiosInstance'
import { trackPaymentCompleted } from '../services/analyticsService'

const PaymentSuccess = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated } = useAuthStore()
  const sessionId = searchParams.get('session_id')
  const [countdown, setCountdown] = useState(3)
  const [isRefreshing, setIsRefreshing] = useState(true)

  useEffect(() => {
    if (sessionId && isAuthenticated) {
      const refreshUserData = async () => {
        try {
          // Wait a bit for webhook to process the payment
          await new Promise((resolve) => setTimeout(resolve, 1000))

          const response = await axiosInstance.get('/api/auth/check-auth')
          if (response.data.data.user) {
            useAuthStore.setState({ user: response.data.data.user })
            console.log(
              '✅ User credits updated:',
              response.data.data.user.messageCredits
            )
            trackPaymentCompleted(0, 'completed')
          }
        } catch (error) {
          console.error('⚠️ Failed to refresh user data:', error.message)
          // Continue anyway - user can see updated credits on dashboard refresh
        } finally {
          setIsRefreshing(false)
        }
      }

      refreshUserData()
    } else if (!sessionId) {
      setIsRefreshing(false)
    }
  }, [sessionId, isAuthenticated])

  // Start countdown and redirect after refresh is done
  useEffect(() => {
    if (isRefreshing) return

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1
        if (next <= 0) {
          clearInterval(countdownInterval)
          // Navigate to dashboard with state to trigger success message
          navigate('/dashboard', { state: { fromPayment: true } })
        }
        return next
      })
    }, 1000)

    return () => clearInterval(countdownInterval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRefreshing])

  const handleGoToDashboard = () => {
    // Navigate to dashboard with state to trigger success message
    navigate('/dashboard', { state: { fromPayment: true } })
  }

  return (
    <>
      <PageHead
        title="Payment Successful"
        description="Your payment was successful! Your credits have been added to your account."
      />
      <div className="overlay">
        <Nav minimal={true} />
        <div className="payment-success-page">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h1>Payment Successful!</h1>
          <p>Thank you for your purchase. Your account has been updated.</p>
          {isRefreshing ? (
            <p className="redirect-message">Refreshing your account...</p>
          ) : (
            <p className="redirect-message">
              Redirecting to dashboard in {countdown} second
              {countdown !== 1 ? 's' : ''}...
            </p>
          )}
          <div className="success-actions">
            <button
              className="primary-button"
              onClick={handleGoToDashboard}
              disabled={isRefreshing}
            >
              Go to Dashboard Now
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}

export default PaymentSuccess
