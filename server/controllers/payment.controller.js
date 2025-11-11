import { User } from '../models/user.model.js'
import { Transaction } from '../models/transaction.model.js'
import { stripeService } from '../services/stripe.service.js'
import { logError, logInfo } from '../utilities/logger.js'
import { getClientUrl } from '../utilities/getClientUrl.js'
import { sanitizeErrorMessage } from '../utilities/errorSanitizer.js'
import { validateRedirectUrl } from '../utilities/sanitizeInput.js'
import { validationResult } from 'express-validator'

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
    const customer = await stripeService.createCustomer(
      user.email,
      user.user_id
    )
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
        const customer = await stripeService.createCustomer(
          user.email,
          user.user_id
        )
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
  // Security: Check for validation errors from express-validator middleware
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request',
      errors: errors.array(),
    })
  }

  try {
    const { planType } = req.body
    const user = await User.findOne({ user_id: req.userId })

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const customerId = await ensureStripeCustomer(user)

    const priceId =
      planType === 'premium'
        ? process.env.STRIPE_PREMIUM_PRICE_ID
        : process.env.STRIPE_VIP_PRICE_ID

    if (!priceId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan type or price ID not configured',
      })
    }

    const clientUrl = getClientUrl(req) // SECURITY: Gets validated URL from whitelist, detects www vs non-www

    // SECURITY FIX: Validate base URLs first (without Stripe template placeholders)
    // Ensures constructed URLs contain no dangerous patterns or malformed paths
    try {
      validateRedirectUrl(`${clientUrl}/payment-success`)
      validateRedirectUrl(`${clientUrl}/pricing`)
    } catch (error) {
      logError('payment.controller', 'Invalid redirect URL constructed', error)
      return res.status(500).json({
        success: false,
        message: 'Payment configuration error',
      })
    }

    // Now construct the final URLs with Stripe template placeholders
    const successUrl = `${clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${clientUrl}/pricing?canceled=true`

    const session = await stripeService.createSubscriptionCheckout(
      customerId,
      priceId,
      user.user_id,
      successUrl,
      cancelUrl
    )

    res.json({ success: true, sessionId: session.id, url: session.url })
  } catch (error) {
    logError('payment.controller', 'createSubscriptionCheckout error', error)
    res.status(500).json({
      success: false,
      message: sanitizeErrorMessage(error, 'createSubscriptionCheckout'),
    })
  }
}

// Create checkout session for credits
export const createCreditsCheckout = async (req, res) => {
  // Validate input
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request',
      errors: errors.array(),
    })
  }

  try {
    const { packageType } = req.body
    const user = await User.findOne({ user_id: req.userId })

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Check if user has an active subscription
    if (user.subscription !== 'free' && user.subscriptionStatus === 'active') {
      return res.status(400).json({
        success: false,
        message:
          'You already have an active subscription with unlimited messages. No need to buy credits!',
      })
    }

    const creditPackage = CREDIT_PACKAGES[packageType]
    if (!creditPackage) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid package type' })
    }

    const customerId = await ensureStripeCustomer(user)

    const clientUrl = getClientUrl(req) // SECURITY: Gets validated URL from whitelist, detects www vs non-www

    // SECURITY FIX: Validate base URLs first (without Stripe template placeholders)
    // Ensures constructed URLs contain no dangerous patterns or malformed paths
    try {
      validateRedirectUrl(`${clientUrl}/payment-success`)
      validateRedirectUrl(`${clientUrl}/pricing`)
    } catch (error) {
      logError('payment.controller', 'Invalid redirect URL constructed', error)
      return res.status(500).json({
        success: false,
        message: 'Payment configuration error',
      })
    }

    // Now construct the final URLs with Stripe template placeholders
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

    res.json({ success: true, sessionId: session.id, url: session.url })
  } catch (error) {
    logError('payment.controller', 'createCreditsCheckout error', error)
    res.status(500).json({
      success: false,
      message: sanitizeErrorMessage(error, 'createCreditsCheckout'),
    })
  }
}

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.userId })

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (!user.stripeSubscriptionId) {
      return res
        .status(400)
        .json({ success: false, message: 'No active subscription found' })
    }

    const subscription = await stripeService.cancelSubscription(
      user.stripeSubscriptionId
    )

    user.subscriptionStatus = 'canceling'
    user.subscriptionEndDate = new Date(subscription.current_period_end * 1000)
    await user.save()

    res.json({
      success: true,
      message: 'Subscription will be canceled at period end',
      endDate: user.subscriptionEndDate,
    })
  } catch (error) {
    logError('payment.controller', 'cancelSubscription error', error)
    res.status(500).json({
      success: false,
      message: sanitizeErrorMessage(error, 'cancelSubscription'),
    })
  }
}

// Reactivate subscription
export const reactivateSubscription = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.userId })

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (!user.stripeSubscriptionId) {
      return res
        .status(400)
        .json({ success: false, message: 'No subscription found' })
    }

    await stripeService.reactivateSubscription(user.stripeSubscriptionId)

    user.subscriptionStatus = 'active'
    user.subscriptionEndDate = null
    await user.save()

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
    })
  } catch (error) {
    logError('payment.controller', 'reactivateSubscription error', error)
    res.status(500).json({
      success: false,
      message: sanitizeErrorMessage(error, 'reactivateSubscription'),
    })
  }
}

// Get subscription status
export const getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.userId })

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.json({
      success: true,
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
    res.status(500).json({
      success: false,
      message: sanitizeErrorMessage(error, 'getSubscriptionStatus'),
    })
  }
}

// Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)

    res.json({ success: true, transactions })
  } catch (error) {
    logError('payment.controller', 'getPaymentHistory error', error)
    res.status(500).json({
      success: false,
      message: sanitizeErrorMessage(error, 'getPaymentHistory'),
    })
  }
}

// Create portal session for managing subscription
export const createPortalSession = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.userId })

    if (!user || !user.stripeCustomerId) {
      return res
        .status(404)
        .json({ success: false, message: 'No customer found' })
    }

    const session = await stripeService.createPortalSession(
      user.stripeCustomerId,
      `${getClientUrl(req)}/dashboard`
    )

    res.json({ success: true, url: session.url })
  } catch (error) {
    logError('payment.controller', 'createPortalSession error', error)
    res.status(500).json({
      success: false,
      message: sanitizeErrorMessage(error, 'createPortalSession'),
    })
  }
}

// Get available credit packages
export const getCreditPackages = async (req, res) => {
  try {
    res.json({ success: true, packages: CREDIT_PACKAGES })
  } catch (error) {
    logError('payment.controller', 'getCreditPackages error', error)
    res.status(500).json({
      success: false,
      message: sanitizeErrorMessage(error, 'getCreditPackages'),
    })
  }
}
