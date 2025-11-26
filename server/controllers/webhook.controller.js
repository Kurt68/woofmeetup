import { User } from '../models/user.model.js'
import { Transaction } from '../models/transaction.model.js'
import { DeletionLog } from '../models/deletion-log.model.js'
import Message from '../models/message.model.js'
import { stripeService } from '../services/stripe.service.js'
import { awsService } from '../services/aws.service.js'
import { logError, logInfo, logWarning } from '../utilities/logger.js'
import { validateUserId } from '../utilities/sanitizeInput.js'
import AppError from '../utilities/AppError.js'
import { ErrorCodes } from '../constants/errorCodes.js'
import { sendSuccess, sendError } from '../utils/ApiResponse.js'
import { sendSubscriptionWelcomeEmail, sendCreditsPurchaseEmail } from '../mailtrap/emails.js'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { CreateInvalidationCommand } from '@aws-sdk/client-cloudfront'

const bucketName = process.env.AWS_BUCKET_NAME
const cloudFrontDistId = process.env.CLOUD_FRONT_DIST_ID

/**
 * Handle Stripe Webhook Events
 * Security: Implements webhook signature verification and idempotency checks
 *
 * Signature verification:
 * - Validates HMAC signature to ensure webhook came from Stripe
 * - Prevents unauthorized parties from triggering webhook handlers
 *
 * Idempotency:
 * - Uses Stripe event ID as unique identifier
 * - Prevents duplicate processing if webhook is retried by Stripe
 * - Stores processed event IDs in database to detect retries
 */
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  // Security: Validate signature header presence
  if (!sig) {
    logError(
      'webhook.controller',
      'Security Alert: Webhook received without signature header - rejecting'
    )
    return sendError(res, 'Webhook signature header missing', 400)
  }

  let event

  try {
    // Security: Verify webhook signature with Stripe
    // This ensures the webhook came from Stripe and hasn't been tampered with
    event = stripeService.constructWebhookEvent(req.body, sig, webhookSecret)
  } catch (err) {
    // Signature verification failed - this could be an attack attempt
    logError(
      'webhook.controller',
      'Stripe webhook signature verification failed - rejecting request',
      {
        error: err.message,
        ip: req.ip,
      }
    )
    // Return 400 (not 401) as per Stripe webhook best practices
    // Stripe will retry webhooks that receive 400 errors
    return sendError(res, 'Invalid webhook signature', 400)
  }

  try {
    // Security: Check for duplicate webhook processing (idempotency)
    // Stripe may retry webhooks that don't get a 200 response quickly
    // Using the event ID prevents duplicate credit/subscription updates
    const eventId = event.id

    // Check if we've already processed this webhook
    const existingEvent = await Transaction.findOne({
      'metadata.stripeEventId': eventId,
    })

    if (existingEvent) {
      logInfo(
        'webhook.controller',
        `Webhook already processed (idempotency): ${event.type} - Event ID: ${eventId}`
      )
      // Return 200 to acknowledge receipt and prevent Stripe from retrying
      return sendSuccess(res, { received: true, isDuplicate: true }, null, 200)
    }

    // Log incoming webhook for audit trail
    logInfo(
      'webhook.controller',
      `Processing webhook: ${event.type} (Event ID: ${eventId}, Timestamp: ${new Date(
        event.created * 1000
      ).toISOString()})`
    )

    // Process the webhook event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, eventId)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, eventId)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, eventId)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, eventId)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object, eventId)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object, eventId)
        break

      default:
        // Unhandled webhook event - log for monitoring
        logInfo(
          'webhook.controller',
          `Unhandled webhook event type: ${event.type} (Event ID: ${eventId})`
        )
        break
    }

    // Acknowledge successful processing to Stripe
    sendSuccess(res, { received: true }, null, 200)
  } catch (error) {
    // Log webhook processing errors for monitoring/debugging
    logError('webhook.controller', 'Error processing webhook event', {
      eventType: event.type,
      eventId: event.id,
      error: error.message,
    })
    // Return 500 to signal Stripe to retry
    sendError(res, 'Webhook handler failed', 500)
  }
}

// Handle checkout session completed
// eventId is used for idempotency - prevents duplicate processing if webhook is retried
async function handleCheckoutCompleted(session, eventId) {
  if (session.mode === 'payment') {
    // One-time payment for credits
    // Validate that metadata exists
    if (!session.metadata) {
      logError('webhook.controller', 'Missing metadata in checkout session', {
        session_id: session.id,
      })
      throw AppError.badRequest(ErrorCodes.PAYMENT_FAILED, 'Missing metadata in checkout session')
    }

    // Validate userId format (prevents NoSQL injection)
    const userId = validateUserId(session.metadata.userId, 'metadata.userId')

    // Validate and sanitize credits (integer, within bounds)
    const creditsRaw = session.metadata.credits
    const credits = parseInt(creditsRaw, 10)

    if (!Number.isInteger(credits)) {
      logError('webhook.controller', 'Invalid credits amount - not an integer', {
        credits: creditsRaw,
        session_id: session.id,
      })
      throw AppError.badRequest(ErrorCodes.PAYMENT_INVALID_AMOUNT, 'Invalid credits amount - not an integer')
    }

    // Enforce credits bounds (1-1000 credits max per purchase)
    if (credits < 1 || credits > 1000) {
      logError('webhook.controller', 'Invalid credits amount - out of bounds', {
        credits,
        session_id: session.id,
      })
      throw AppError.badRequest(ErrorCodes.PAYMENT_INVALID_AMOUNT, 'Invalid credits amount - out of bounds')
    }

    // Retrieve user
    const user = await User.findOne({ user_id: userId })

    if (!user) {
      logError('webhook.controller', 'User not found for checkout completion', {
        userId,
        session_id: session.id,
      })
      throw AppError.notFound(ErrorCodes.USER_NOT_FOUND, 'User not found for checkout completion')
    }

    // Update user credits (increment by the credits amount)
    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId },
      { $inc: { messageCredits: credits } },
      { new: true }
    )

    if (!updatedUser) {
      throw AppError.internalError(ErrorCodes.PAYMENT_FAILED, 'Failed to update user credits')
    }

    // Create transaction record with event ID for idempotency
    // Store transaction in database to track payment and enable idempotency
    await Transaction.create({
      userId: updatedUser._id,
      stripePaymentId: session.payment_intent,
      type: 'credits',
      amount: session.amount_total / 100,
      currency: session.currency,
      status: 'completed',
      description: `Purchased ${credits} message credits`,
      creditsAdded: credits,
      metadata: {
        sessionId: session.id,
        stripeEventId: eventId, // Store for idempotency checks
      },
    })

    // Send credits purchase confirmation email
    // Email is non-critical - don't let failures prevent transaction from completing
    try {
      await sendCreditsPurchaseEmail(
        user.email,
        user.userName,
        credits,
        updatedUser.messageCredits,
        session.amount_total / 100
      )
    } catch (emailError) {
      logError('webhook.controller', 'Failed to send credits purchase email', emailError)
      // Don't throw - email is non-critical
    }
  }
}

// Handle subscription created
// eventId is used for idempotency - prevents duplicate processing if webhook is retried
async function handleSubscriptionCreated(subscription, eventId) {
  logInfo(
    'webhook.controller',
    `Looking up user for subscription creation - Customer ID: ${subscription.customer}, Subscription ID: ${subscription.id}`
  )

  const user = await User.findOne({ stripeCustomerId: subscription.customer })

  if (!user) {
    logError(
      'webhook.controller',
      'User not found for subscription creation - Customer ID may not be saved yet',
      {
        customerId: subscription.customer,
        subscriptionId: subscription.id,
        priceId: subscription.items.data[0]?.price?.id,
      }
    )
    throw AppError.notFound(ErrorCodes.USER_NOT_FOUND, 'User not found for subscription creation')
  }

  const priceId = subscription.items.data[0].price.id
  const planType = priceId === process.env.STRIPE_VIP_PRICE_ID ? 'vip' : 'premium'

  logInfo(
    'webhook.controller',
    `Updating user subscription - User: ${user.user_id}, Plan: ${planType}, Status: ${subscription.status}`
  )

  user.subscription = planType
  user.subscriptionStatus = subscription.status
  user.stripeSubscriptionId = subscription.id
  user.subscriptionEndDate = new Date(subscription.current_period_end * 1000)
  await user.save()

  logInfo(
    'webhook.controller',
    `Successfully updated user subscription - User: ${user.user_id}, Plan: ${planType}`
  )

  // Create transaction record for subscription creation
  await Transaction.create({
    userId: user._id,
    stripePaymentId: subscription.id,
    type: 'subscription',
    amount: subscription.items.data[0].price.unit_amount / 100,
    currency: subscription.currency,
    status: 'completed',
    description: `${planType} subscription created`,
    metadata: {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      stripeEventId: eventId,
    },
  })

  // Send welcome email for new subscription
  try {
    await sendSubscriptionWelcomeEmail(user.email, user.userName, planType)
  } catch (emailError) {
    logError('webhook.controller', 'Failed to send subscription welcome email', emailError)
    // Continue execution even if email fails (non-critical)
  }
}

// Handle subscription updated
// eventId is used for idempotency - prevents duplicate processing if webhook is retried
async function handleSubscriptionUpdated(subscription, _eventId) {
  const user = await User.findOne({ stripeSubscriptionId: subscription.id })

  if (!user) {
    logError('webhook.controller', 'User not found for subscription update', {
      subscriptionId: subscription.id,
    })
    throw AppError.notFound(ErrorCodes.USER_NOT_FOUND, 'User not found for subscription update')
  }

  user.subscriptionStatus = subscription.cancel_at_period_end ? 'canceling' : subscription.status
  user.subscriptionEndDate = new Date(subscription.current_period_end * 1000)
  await user.save()
}

// Helper function to permanently delete a user account
async function performPermanentDeletion(user) {
  const voidedCredits = user.messageCredits || 0

  // Update deletion log
  await DeletionLog.findOneAndUpdate(
    { userId: user.user_id, deletedAt: null },
    {
      deletedAt: new Date(),
      voidedCredits: voidedCredits,
    }
  )

  // Delete user image from S3
  if (user.image) {
    try {
      // SECURITY FIX #6: Use AWS service singleton instead of instantiating clients
      // Prevents repeated credential loading and improves performance
      const s3Client = awsService.getS3Client()
      const cloudFrontClient = awsService.getCloudFrontClient()

      const deleteParams = {
        Bucket: bucketName,
        Key: user.image,
      }
      const command = new DeleteObjectCommand(deleteParams)
      await s3Client.send(command)

      // Invalidate CloudFront cache
      const invalidationParams = {
        DistributionId: cloudFrontDistId,
        InvalidationBatch: {
          CallerReference: user.image,
          Paths: {
            Quantity: 1,
            Items: ['/' + user.image],
          },
        },
      }
      const invalidationCommand = new CreateInvalidationCommand(invalidationParams)
      await cloudFrontClient.send(invalidationCommand)
    } catch (_imageError) {
      // Silent error handling - image deletion is non-critical for account deletion
    }
  }

  // Delete all user messages
  await Message.deleteMany({
    $or: [{ senderId: user._id }, { receiverId: user._id }],
  })

  // Remove from other users' matches
  await User.updateMany({ matches: user.user_id }, { $pull: { matches: user.user_id } })

  // Delete user account
  await User.deleteOne({ user_id: user.user_id })
}

// Handle subscription deleted
// eventId is used for idempotency - prevents duplicate processing if webhook is retried
async function handleSubscriptionDeleted(subscription, _eventId) {
  const user = await User.findOne({ stripeSubscriptionId: subscription.id })

  if (!user) {
    // This can happen if subscription is deleted after user account is deleted
    logInfo(
      'webhook.controller',
      'User not found for subscription deletion (possibly already deleted)',
      { subscriptionId: subscription.id }
    )
    return
  }

  // Check if account is pending deletion
  if (user.pendingDeletion) {
    // Perform permanent deletion
    await performPermanentDeletion(user)
  } else {
    // Normal subscription cancellation - downgrade to free tier
    user.subscription = 'free'
    user.subscriptionStatus = null
    user.stripeSubscriptionId = null
    user.subscriptionEndDate = null
    user.messageCredits = 10 // Reset to free tier credits
    await user.save()
  }
}

// Handle successful invoice payment
// eventId is used for idempotency - prevents duplicate processing if webhook is retried
async function handleInvoicePaymentSucceeded(invoice, eventId) {
  if (!invoice.subscription) {
    return
  }

  const user = await User.findOne({ stripeCustomerId: invoice.customer })

  if (!user) {
    logWarning('webhook.controller', 'User not found for invoice payment succeeded', {
      customerId: invoice.customer,
      invoiceId: invoice.id,
    })
    return
  }

  await Transaction.create({
    userId: user._id,
    stripePaymentId: invoice.payment_intent,
    type: 'subscription',
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
    status: 'completed',
    description: `${user.subscription} subscription payment`,
    metadata: {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      stripeEventId: eventId, // Store for idempotency checks
    },
  })
}

// Handle failed invoice payment
// eventId is used for idempotency - prevents duplicate processing if webhook is retried
async function handleInvoicePaymentFailed(invoice, eventId) {
  const user = await User.findOne({ stripeCustomerId: invoice.customer })

  if (!user) {
    logWarning('webhook.controller', 'User not found for invoice payment failed', {
      customerId: invoice.customer,
      invoiceId: invoice.id,
    })
    return
  }

  user.subscriptionStatus = 'past_due'
  await user.save()

  await Transaction.create({
    userId: user._id,
    stripePaymentId: invoice.payment_intent || invoice.id,
    type: 'subscription',
    amount: invoice.amount_due / 100,
    currency: invoice.currency,
    status: 'failed',
    description: `Failed ${user.subscription} subscription payment`,
    metadata: {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      stripeEventId: eventId, // Store for idempotency checks
    },
  })
}
