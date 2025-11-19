import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { usePaymentStore } from '../store/usePaymentStore'
import { Nav } from '../components/layout'
import { PageHead } from '../components/PageHead'
import toast from 'react-hot-toast'

const PricingPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isAuthenticated } = useAuthStore()
  const {
    createSubscriptionCheckout,
    createCreditsCheckout,
    isLoading,
    loadingPackage,
    fetchCreditPackages,
    creditPackages,
  } = usePaymentStore()
  const [activeTab, setActiveTab] = useState('subscription')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    fetchCreditPackages()
  }, [fetchCreditPackages])

  useEffect(() => {
    const canceled = searchParams.get('canceled')

    if (canceled) {
      toast.error('Payment canceled')
    }
  }, [searchParams])

  const handleSubscriptionPurchase = async (planType) => {
    try {
      await createSubscriptionCheckout(planType)
    } catch (error) {
      // Error handled by store
    }
  }

  const handleCreditsPurchase = async (packageType) => {
    // Check if user has an active subscription
    if (
      user?.subscription !== 'free' &&
      user?.subscriptionStatus === 'active'
    ) {
      toast.error(
        'You already have an active subscription with unlimited messages. No need to buy credits!'
      )
      return
    }

    try {
      await createCreditsCheckout(packageType)
    } catch (error) {
      // Error handled by store
    }
  }

  return (
    <>
      <PageHead
        title="Pricing Plans"
        description="Choose the perfect plan for your dog dating needs. Affordable credits and subscriptions available."
      />
      <div className="background-color">
        <Nav minimal={true} />
      <div className="pricing-page">
        <Link to="/dashboard" className="back-to-dashboard">
          &lt;&lt; Back to Dashboard
        </Link>
        <h1>Choose Your Plan</h1>
        <p className="subtitle">
          Get unlimited messages or buy credits as you go <br />1 credit = 1
          message sent
        </p>

        <div className="pricing-tabs">
          <button
            className={`tab-button ${
              activeTab === 'subscription' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('subscription')}
          >
            Monthly Plans
          </button>
          <button
            className={`tab-button ${activeTab === 'credits' ? 'active' : ''}`}
            onClick={() => setActiveTab('credits')}
          >
            Buy Credits
          </button>
        </div>

        {activeTab === 'subscription' && (
          <div className="pricing-cards">
            {/* Free Plan */}
            <div className="pricing-card">
              <div className="plan-header">
                <h3>Free</h3>
                <div className="price">
                  <span className="amount">$0</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="features">
                <li>✓ 10 chat messages (credits) upon sign up</li>
                <li>✓ Create profile</li>
                <li>✓ Wag right and match</li>
                <li>✓ Basic features</li>
              </ul>
              <button className="plan-button" disabled>
                Current Plan
              </button>
            </div>

            {/* Premium Plan */}
            <div className="pricing-card featured">
              <div className="badge">Great Value</div>
              <div className="plan-header">
                <h3>Premium</h3>
                <div className="price">
                  <span className="amount">$9.99</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="features">
                <li>✓ Unlimited messages</li>
                <li>✓ All Free features</li>
                <li>✓ Priority support</li>
                <li>✓ New features as we add them</li>
              </ul>
              <button
                className="plan-button primary"
                onClick={() => handleSubscriptionPurchase('premium')}
                disabled={isLoading || user?.subscription === 'premium'}
              >
                {user?.subscription === 'premium'
                  ? 'Current Plan'
                  : isLoading
                  ? 'Processing...'
                  : 'Get Premium'}
              </button>
            </div>

            {/* VIP Plan - Commented out until features are ready */}
            {/* <div className="pricing-card">
              <div className="plan-header">
                <h3>VIP</h3>
                <div className="price">
                  <span className="amount">$19.99</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="features">
                <li>✓ Everything in Premium</li>
                <li>✓ Profile boost</li>
                <li>✓ See who liked you</li>
                <li>✓ Advanced filters</li>
                <li>✓ VIP badge</li>
              </ul>
              <button
                className="plan-button"
                onClick={() => handleSubscriptionPurchase('vip')}
                disabled={isLoading || user?.subscription === 'vip'}
              >
                {user?.subscription === 'vip'
                  ? 'Current Plan'
                  : isLoading
                  ? 'Processing...'
                  : 'Get VIP'}
              </button>
            </div> */}
          </div>
        )}

        {activeTab === 'credits' && (
          <div className="pricing-cards">
            {creditPackages && (
              <>
                {/* Small Package */}
                <div className="pricing-card">
                  <div className="plan-header">
                    <h3>Starter Pack</h3>
                    <div className="price">
                      <span className="amount">
                        ${creditPackages.small.price}
                      </span>
                    </div>
                  </div>
                  <div className="credits-amount">
                    {creditPackages.small.credits} Messages
                  </div>
                  <p className="credits-note">Perfect for casual users</p>
                  <button
                    className="plan-button"
                    onClick={() => handleCreditsPurchase('small')}
                    disabled={loadingPackage === 'small'}
                  >
                    {loadingPackage === 'small' ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>

                {/* Medium Package */}
                <div className="pricing-card featured">
                  <div className="badge">Best Value</div>
                  <div className="plan-header">
                    <h3>Popular Pack</h3>
                    <div className="price">
                      <span className="amount">
                        ${creditPackages.medium.price}
                      </span>
                    </div>
                  </div>
                  <div className="credits-amount">
                    {creditPackages.medium.credits} Messages
                  </div>
                  <p className="credits-note">Most popular choice</p>
                  <button
                    className="plan-button primary"
                    onClick={() => handleCreditsPurchase('medium')}
                    disabled={loadingPackage === 'medium'}
                  >
                    {loadingPackage === 'medium' ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>

                {/* Large Package */}
                <div className="pricing-card">
                  <div className="plan-header">
                    <h3>Power Pack</h3>
                    <div className="price">
                      <span className="amount">
                        ${creditPackages.large.price}
                      </span>
                    </div>
                  </div>
                  <div className="credits-amount">
                    {creditPackages.large.credits} Messages
                  </div>
                  <p className="credits-note">Maximum value</p>
                  <button
                    className="plan-button"
                    onClick={() => handleCreditsPurchase('large')}
                    disabled={loadingPackage === 'large'}
                  >
                    {loadingPackage === 'large' ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="pricing-footer">
          <p>
            Cancel anytime. <br /> Credits/Subscriptions are valid for 30 days
            before permanent automatic (user initiated) deletion of data.
          </p>
        </div>
      </div>
      </div>
    </>
  )
}

export default PricingPage
