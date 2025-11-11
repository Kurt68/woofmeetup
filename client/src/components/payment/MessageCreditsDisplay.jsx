import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { MessageSquareMore, Sparkles } from 'lucide-react'

const MessageCreditsDisplay = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  if (!user) return null

  // Don't show for premium/vip users with active subscriptions
  if (
    (user.subscription === 'premium' || user.subscription === 'vip') &&
    user.subscriptionStatus === 'active'
  ) {
    return (
      <div className="credits-display unlimited">
        <span className="credits-icon">
          <Sparkles />
        </span>
        <span className="credits-text">Unlimited Messages</span>
      </div>
    )
  }

  const credits = user.messageCredits || 0
  const isLow = credits <= 3
  const isEmpty = credits === 0

  return (
    <div
      className={`credits-display ${isLow ? 'low' : ''} ${
        isEmpty ? 'empty' : ''
      }`}
    >
      <span className="credits-icon">
        <MessageSquareMore />
      </span>
      <span className="credits-text">
        {credits} message{credits !== 1 ? 's' : ''} left
      </span>
      {isLow && (
        <button
          className="buy-credits-btn"
          onClick={() => navigate('/pricing')}
        >
          {isEmpty ? 'Buy Credits' : 'Get More'}
        </button>
      )}
    </div>
  )
}

export default MessageCreditsDisplay
