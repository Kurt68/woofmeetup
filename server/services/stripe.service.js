import Stripe from 'stripe'
import { logError, logInfo } from '../utilities/logger.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const stripeService = {
  // Create or retrieve Stripe customer
  async createCustomer(email, userId) {
    try {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId: userId,
        },
      })
      return customer
    } catch (error) {
      logError('stripe.service', 'Error creating Stripe customer', error)
      throw error
    }
  },

  // Validate that a customer exists in current Stripe API mode
  // Throws error if customer not found (e.g., test mode ID in live mode)
  async validateCustomer(customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId)
      return customer
    } catch (error) {
      logError('stripe.service', 'Error validating Stripe customer', error)
      throw error
    }
  },

  // Create checkout session for subscription
  async createSubscriptionCheckout(customerId, priceId, userId, successUrl, cancelUrl) {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        locale: 'auto',
        metadata: {
          userId: userId,
        },
      })
      return session
    } catch (error) {
      logError('stripe.service', 'Error creating subscription checkout', error)
      throw error
    }
  },

  // Create checkout session for one-time credit purchase
  async createCreditsCheckout(customerId, amount, credits, userId, successUrl, cancelUrl) {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${credits} Message Credits`,
                description: `Purchase ${credits} message credits for Woof Meetup`,
              },
              unit_amount: Math.round(amount * 100), // Convert to cents (must be integer)
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        locale: 'auto',
        metadata: {
          userId: userId,
          credits: credits.toString(),
          type: 'credits',
        },
      })
      return session
    } catch (error) {
      logError('stripe.service', 'Error creating credits checkout', error)
      throw error
    }
  },

  // Cancel subscription at period end
  async cancelSubscription(subscriptionId, reason = 'user_requested') {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
        metadata: {
          cancellation_reason: reason,
          canceled_at: new Date().toISOString(),
        },
      })
      return subscription
    } catch (error) {
      logError('stripe.service', 'Error canceling subscription', error)
      throw error
    }
  },

  // Cancel subscription at period end (user keeps access until paid period expires)
  async cancelSubscriptionAtPeriodEnd(subscriptionId, reason = 'user_requested') {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
        metadata: {
          cancellation_reason: reason,
          canceled_at: new Date().toISOString(),
        },
      })
      return subscription
    } catch (error) {
      logError('stripe.service', 'Error canceling subscription at period end', error)
      throw error
    }
  },

  // Reactivate subscription
  async reactivateSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      })
      return subscription
    } catch (error) {
      logError('stripe.service', 'Error reactivating subscription', error)
      throw error
    }
  },

  // Get subscription details
  async getSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      return subscription
    } catch (error) {
      logError('stripe.service', 'Error retrieving subscription', error)
      throw error
    }
  },

  // Get customer portal session
  async createPortalSession(customerId, returnUrl) {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      })
      return session
    } catch (error) {
      logError('stripe.service', 'Error creating portal session', error)
      throw error
    }
  },

  // Construct and verify webhook event with enhanced security checks
  // Security: Validates webhook signature to prevent forged events from unauthorized sources
  // Returns verified event or throws error if verification fails
  constructWebhookEvent(payload, signature, secret) {
    try {
      // Security validation: Check that signature header is present
      if (!signature) {
        const error = new Error('Webhook signature header missing - possible attack attempt')
        error.code = 'MISSING_SIGNATURE'
        throw error
      }

      // Security validation: Check that secret is configured
      if (!secret) {
        const error = new Error(
          'Webhook secret not configured - cannot verify webhook authenticity'
        )
        error.code = 'MISSING_SECRET'
        throw error
      }

      // Construct event using Stripe's built-in verification
      // Stripe verifies the HMAC signature against the raw request body
      const event = stripe.webhooks.constructEvent(payload, signature, secret)

      // Security validation: Ensure event has required fields
      if (!event || !event.type || !event.id) {
        const error = new Error('Webhook event missing required fields')
        error.code = 'INVALID_EVENT_STRUCTURE'
        throw error
      }

      // Log successful webhook verification
      logInfo('stripe.service', `✅ Webhook verified: ${event.type} (ID: ${event.id})`)

      return event
    } catch (error) {
      // Log different error types for security monitoring
      if (error.code === 'MISSING_SIGNATURE') {
        logError(
          'stripe.service',
          'Security Alert: Webhook signature verification failed - missing signature header',
          { code: error.code }
        )
      } else if (error.code === 'MISSING_SECRET') {
        logError('stripe.service', 'Critical: Webhook secret not configured', {
          code: error.code,
        })
      } else if (error.message && error.message.includes('Timestamp outside the tolerance zone')) {
        // This indicates a replay attack attempt or severe clock skew
        logError(
          'stripe.service',
          'Security Alert: Webhook timestamp verification failed - possible replay attack',
          {
            message: 'Clock skew or replay attack detected',
          }
        )
      } else if (error.message && error.message.includes('No matching key version')) {
        // This indicates an invalid signing secret
        logError(
          'stripe.service',
          'Security Alert: Webhook signed with unknown key - possible impersonation',
          { code: 'INVALID_KEY_VERSION' }
        )
      } else {
        logError(
          'stripe.service',
          'Webhook signature verification failed - unauthorized or forged webhook',
          {
            message: error.message,
            code: error.code,
          }
        )
      }
      throw error
    }
  },
}

export default stripe
