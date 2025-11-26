import express from 'express'
import { body, validationResult } from 'express-validator'
import { verifyToken } from '../middleware/verifyToken.js'
import { csrfProtection } from '../middleware/csrf.js'
import {
  createSubscriptionCheckout,
  createCreditsCheckout,
  cancelSubscription,
  reactivateSubscription,
  getSubscriptionStatus,
  getPaymentHistory,
  createPortalSession,
  getCreditPackages,
} from '../controllers/payment.controller.js'
import { handleStripeWebhook } from '../controllers/webhook.controller.js'
import { stripeLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// Protected routes (require authentication)
// Security: Validate planType parameter to prevent invalid subscription requests
router.post(
  '/create-subscription-checkout',
  csrfProtection,
  verifyToken,
  body('planType')
    .notEmpty()
    .withMessage('planType is required')
    .isIn(['premium', 'vip'])
    .withMessage('planType must be one of: premium, vip'),
  createSubscriptionCheckout
)
router.post(
  '/create-credits-checkout',
  csrfProtection,
  verifyToken,
  body('packageType')
    .notEmpty()
    .withMessage('packageType is required')
    .isIn(['small', 'medium', 'large'])
    .withMessage('packageType must be one of: small, medium, large'),
  createCreditsCheckout
)
router.post('/cancel-subscription', csrfProtection, verifyToken, cancelSubscription)
router.post('/reactivate-subscription', csrfProtection, verifyToken, reactivateSubscription)
router.get('/subscription-status', verifyToken, getSubscriptionStatus)
router.get('/payment-history', verifyToken, getPaymentHistory)
router.post('/create-portal-session', csrfProtection, verifyToken, createPortalSession)
router.get('/credit-packages', getCreditPackages)

export default router

// Export webhook handler separately for raw body parsing
export const webhookRouter = express.Router({ strict: false })
// Security: Apply rate limiting to prevent webhook endpoint flooding and DoS attacks
// Security: Max 100 requests per 1 minute per IP
// Handle both /webhook and /webhook/ paths
webhookRouter.post(
  '/',
  stripeLimiter,
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
)
webhookRouter.post(
  '',
  stripeLimiter,
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
)
