import { User } from '../models/user.model.js'
import { Transaction } from '../models/transaction.model.js'
import { stripeService } from '../services/stripe.service.js'
import { logError, logInfo } from '../utilities/logger.js'
import { getClientUrl } from '../utilities/getClientUrl.js'
import { sanitizeErrorMessage } from '../utilities/errorSanitizer.js'
import { validateRedirectUrl } from '../utilities/sanitizeInput.js'
import { validationResult } from 'express-validator'
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendInternalError,
} from '../utils/ApiResponse.js'

// Credit packages
const CREDIT_PACKAGES = {
  small: { credits: 20, price: 4.99 },
  medium: { credits: 45, price: 8.99 },
  large: { credits: 125, price: 19.99 },
}

// Helper function to ensure user has Stripe customer ID
// Also validates that the customer exists in the current API mode (test or live)
// Recreates customer if switching from test to live mode
async function ensureStripeCustomer(user) {
  if (!user.stripeCustomerId) {
    const customer = await stripeService.createCustomer(user.email, user.user_id)
    user.stripeCustomerId = customer.id
    await user.save()
  } else {
    try {
      await stripeService.validateCustomer(user.stripeCustomerId)
    } catch (error) {
      if (error.message && error.message.includes('No such customer')) {
        logInfo(
          'payment.controller',
          `Stripe customer ${user.stripeCustomerId} not found (likely test mode ID in live mode). Recreating...`
        )
        const customer = await stripeService.createCustomer(user.email, user.user_id)
        user.stripeCustomerId = customer.id
        await user.save()
      } else {
        throw error
      }
    }
  }
  return user.stripeCustomerId
}

// Create checkout session for subscription
export const createSubscriptionCheckout = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return sendValidationError(res, errors.array())
  }

  try {
    const { planType } = req.body
    const user = await User.findOne({ user_id: req.userId })

    if (!user) {
      return sendError(res, 'User not found', 404)
    }

    const customerId = await ensureStripeCustomer(user)

    const priceId =
      planType === 'premium' ? process.env.STRIPE_PREMIUM_PRICE_ID : process.env.STRIPE_VIP_PRICE_ID

    if (!priceId) {
      return sendError(res, 'Invalid plan type or price ID not configured', 400)
    }

    const clientUrl = getClientUrl(req)

    try {
      validateRedirectUrl(`${clientUrl}/payment-success`)
      validateRedirectUrl(`${clientUrl}/pricing`)
    } catch (error) {
      logError('payment.controller', 'Invalid redirect URL constructed', error)
      return sendError(res, 'Payment configuration error', 500)
    }

    const successUrl = `${clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${clientUrl}/pricing?canceled=true`

    const session = await stripeService.createSubscriptionCheckout(
      customerId,
      priceId,
      user.user_id,
      successUrl,
      cancelUrl
    )

    sendSuccess(res, { sessionId: session.id, url: session.url })
  } catch (error) {
    logError('payment.controller', 'createSubscriptionCheckout error', error)
    sendInternalError(res, error, {
      method: req.method,
      path: req.path,
    })
  }
}

// Create checkout session for credits
export const createCreditsCheckout = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return sendValidationError(res, errors.array())
  }

  try {
    const { packageType } = req.body
    const user = await User.findOne({ user_id: req.userId })

    if (!user) {
      return sendError(res, 'User not found', 404)
    }

    if (user.subscription !== 'free' && user.subscriptionStatus === 'active') {
      return sendError(
        res,
        'You already have an active subscription with unlimited messages. No need to buy credits!',
        400
      )
    }

    const creditPackage = CREDIT_PACKAGES[packageType]
    if (!creditPackage) {
      return sendError(res, 'Invalid package type', 400)
    }

    const customerId = await ensureStripeCustomer(user)

    const clientUrl = getClientUrl(req)

    try {
      validateRedirectUrl(`${clientUrl}/payment-success`)
      validateRedirectUrl(`${clientUrl}/pricing`)
    } catch (error) {
      logError('payment.controller', 'Invalid redirect URL constructed', error)
      return sendError(res, 'Payment configuration error', 500)
    }

    const successUrl = `${clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${clientUrl}/pricing?canceled=true`

    const session = await stripeService.createCreditsCheckout(
      customerId,
      creditPackage.price,
      creditPackage.credits,
      user.user_id,
      successUrl,
      cancelUrl
    )

    sendSuccess(res, { sessionId: session.id, url: session.url })
  } catch (error) {
    logError('payment.controller', 'createCreditsCheckout error', error)
    sendInternalError(res, error, {
      method: req.method,
      path: req.path,
    })
  }
}

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.userId })

    if (!user) {
      return sendError(res, 'User not found', 404)
    }

    if (!user.stripeSubscriptionId) {
      return sendError(res, 'No active subscription found', 400)
    }

    const subscription = await stripeService.cancelSubscription(user.stripeSubscriptionId)

    user.subscriptionStatus = 'canceling'
    user.subscriptionEndDate = new Date(subscription.current_period_end * 1000)
    await user.save()

    sendSuccess(
      res,
      {
        endDate: user.subscriptionEndDate,
      },
      'Subscription will be canceled at period end'
    )
  } catch (error) {
    logError('payment.controller', 'cancelSubscription error', error)
    sendInternalError(res, error, {
      method: req.method,
      path: req.path,
    })
  }
}

// Reactivate subscription
export const reactivateSubscription = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.userId })

    if (!user) {
      return sendError(res, 'User not found', 404)
    }

    if (!user.stripeSubscriptionId) {
      return sendError(res, 'No subscription found', 400)
    }

    await stripeService.reactivateSubscription(user.stripeSubscriptionId)

    user.subscriptionStatus = 'active'
    user.subscriptionEndDate = null
    await user.save()

    sendSuccess(res, null, 'Subscription reactivated successfully')
  } catch (error) {
    logError('payment.controller', 'reactivateSubscription error', error)
    sendInternalError(res, error, {
      method: req.method,
      path: req.path,
    })
  }
}

// Get subscription status
export const getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.userId })

    if (!user) {
      return sendError(res, 'User not found', 404)
    }

    sendSuccess(res, {
      subscription: {
        plan: user.subscription,
        status: user.subscriptionStatus,
        endDate: user.subscriptionEndDate,
        messageCredits: user.messageCredits,
        totalMessagesSent: user.totalMessagesSent,
      },
    })
  } catch (error) {
    logError('payment.controller', 'getSubscriptionStatus error', error)
    sendInternalError(res, error, {
      method: req.method,
      path: req.path,
    })
  }
}

// Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)

    sendSuccess(res, { transactions })
  } catch (error) {
    logError('payment.controller', 'getPaymentHistory error', error)
    sendInternalError(res, error, {
      method: req.method,
      path: req.path,
    })
  }
}

// Create portal session for managing subscription
export const createPortalSession = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.userId })

    if (!user || !user.stripeCustomerId) {
      return sendError(res, 'No customer found', 404)
    }

    const session = await stripeService.createPortalSession(
      user.stripeCustomerId,
      `${getClientUrl(req)}/dashboard`
    )

    sendSuccess(res, { url: session.url })
  } catch (error) {
    logError('payment.controller', 'createPortalSession error', error)
    sendInternalError(res, error, {
      method: req.method,
      path: req.path,
    })
  }
}

// Get available credit packages
export const getCreditPackages = async (req, res) => {
  try {
    sendSuccess(res, { packages: CREDIT_PACKAGES })
  } catch (error) {
    logError('payment.controller', 'getCreditPackages error', error)
    sendInternalError(res, error, {
      method: req.method,
      path: req.path,
    })
  }
}
