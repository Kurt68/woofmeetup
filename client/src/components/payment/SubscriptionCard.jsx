import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { usePaymentStore } from '../../store/usePaymentStore'

const SubscriptionCard = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    subscription,
    fetchSubscriptionStatus,
    cancelSubscription,
    reactivateSubscription,
    createPortalSession,
    isLoading,
  } = usePaymentStore()

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [fetchSubscriptionStatus])

  const handleCancelSubscription = async () => {
    if (
      window.confirm(
        'Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.'
      )
    ) {
      try {
        await cancelSubscription()
      } catch (error) {
        // Error canceling subscription
      }
    }
  }

  const handleReactivateSubscription = async () => {
    try {
      await reactivateSubscription()
    } catch (error) {
      // Error reactivating subscription
    }
  }

  const handleManageBilling = async () => {
    try {
      await createPortalSession()
    } catch (error) {
      // Error opening billing portal
    }
  }

  const getPlanName = (plan) => {
    const plans = {
      free: 'Free',
      premium: 'Premium',
      vip: 'VIP',
    }
    return plans[plan] || 'Free'
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: 'Active', class: 'status-active' },
      canceling: { text: 'Canceling', class: 'status-canceling' },
      past_due: { text: 'Past Due', class: 'status-past-due' },
      trialing: { text: 'Trial', class: 'status-trial' },
    }
    return badges[status] || { text: 'Inactive', class: 'status-inactive' }
  }

  if (!subscription) {
    return (
      <div className="subscription-card">
        <div className="loading">Loading subscription details...</div>
      </div>
    )
  }

  return (
    <div className="subscription-card">
      <div className="subscription-header">
        <h3>Your Subscription</h3>
        {subscription.status && (
          <span
            className={`status-badge ${
              getStatusBadge(subscription.status).class
            }`}
          >
            {getStatusBadge(subscription.status).text}
          </span>
        )}
      </div>

      <div className="subscription-details">
        <div className="detail-row">
          <span className="label">Current Plan:</span>
          <span className="value plan-name">
            {getPlanName(subscription.plan)}
          </span>
        </div>

        {subscription.plan !== 'free' && (
          <>
            {subscription.endDate && subscription.status === 'canceling' && (
              <div className="detail-row">
                <span className="label">Access Until:</span>
                <span className="value">
                  {new Date(subscription.endDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </>
        )}

        <div className="detail-row">
          <span className="label">Message Credits:</span>
          <span className="value credits">
            {subscription.plan === 'free'
              ? `${subscription.messageCredits} remaining`
              : 'Unlimited'}
          </span>
        </div>

        <div className="detail-row">
          <span className="label">Total Messages Sent:</span>
          <span className="value">{subscription.totalMessagesSent}</span>
        </div>
      </div>

      <div className="subscription-actions">
        {subscription.plan === 'free' ? (
          <button
            className="primary-button"
            onClick={() => navigate('/pricing')}
          >
            Upgrade Plan
          </button>
        ) : (
          <>
            {subscription.status === 'canceling' ? (
              <button
                className="primary-button"
                onClick={handleReactivateSubscription}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Reactivate Subscription'}
              </button>
            ) : (
              <>
                <button
                  className="secondary-button"
                  onClick={handleManageBilling}
                  disabled={isLoading}
                >
                  Manage Billing
                </button>
                <button
                  className="danger-button"
                  onClick={handleCancelSubscription}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Cancel Subscription'}
                </button>
              </>
            )}
          </>
        )}

        {subscription.plan === 'free' && subscription.messageCredits < 10 && (
          <button
            className="secondary-button"
            onClick={() => navigate('/pricing')}
          >
            Buy More Credits
          </button>
        )}
      </div>

      {subscription.plan === 'free' && subscription.messageCredits === 0 && (
        <div className="warning-message">
          <p>⚠️ You've run out of message credits!</p>
          <p>Upgrade to Premium for unlimited messages or buy more credits.</p>
        </div>
      )}
    </div>
  )
}

export default SubscriptionCard
