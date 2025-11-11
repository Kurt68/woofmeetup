import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  SUBSCRIPTION_WELCOME_TEMPLATE,
  ACCOUNT_DELETION_SCHEDULED_TEMPLATE,
  CREDITS_PURCHASE_TEMPLATE,
} from './emailTemplates.js'
import { mailtrapClient, senders } from './mailtrap.config.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { logError, logInfo } from '../utilities/logger.js'
import {
  safeTemplateReplace,
  sanitizeTemplateVariable,
} from '../utilities/htmlEscaper.js'
import {
  getAllowedEmailImagePaths,
  safeReadFile,
} from '../utilities/pathValidator.js'

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Helper function to get logo attachment
const getLogoAttachment = () => {
  try {
    // MEDIUM SECURITY FIX: Use safe path validation to prevent directory traversal
    const emailImagePaths = getAllowedEmailImagePaths()
    const logoBuffer = safeReadFile('logo.png', emailImagePaths.base)
    const logoBase64 = logoBuffer.toString('base64')

    return {
      content: logoBase64,
      filename: 'logo.png',
      type: 'image/png',
      disposition: 'inline',
      content_id: 'logo',
    }
  } catch (error) {
    logError('emails', 'Failed to load logo attachment', error)
    // Return empty attachment list if logo fails to load
    return null
  }
}

export const sendVerificationEmail = async (email, verificationToken) => {
  const recipient = [{ email }]

  try {
    const logoAttachment = getLogoAttachment()
    const attachments = logoAttachment ? [logoAttachment] : []

    await mailtrapClient.send({
      from: senders.verification,
      to: recipient,
      subject: 'Verify your email',
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        '{verificationCode}',
        verificationToken
      ),
      category: 'Email Verification',
      attachments,
    })
  } catch (error) {
    throw new Error(`Error sending verification email: ${error}`)
  }
}

export const sendWelcomeEmail = async (email, userName) => {
  const recipient = [{ email }]

  try {
    await mailtrapClient.send({
      from: senders.welcome,
      to: recipient,
      template_uuid: '9b6607d9-0d70-4aea-9471-d8e81184aaa5',
      template_variables: {
        name: userName,
        company_info_name: 'woofmeetup.com',
        company_info_address: '218 E Ramona Ave',
        company_info_city: 'Salt Lake City, UT',
        company_info_zip_code: '84115',
        company_info_country: 'USA',
      },
    })
  } catch (error) {
    throw new Error(`Error sending welcome email: ${error}`)
  }
}

export const sendPasswordResetEmail = async (email, resetURL) => {
  const recipient = [{ email }]

  try {
    // MEDIUM SECURITY FIX: HTML escape the resetURL to prevent template injection
    const safeResetURL = sanitizeTemplateVariable(resetURL, 'url')
    const logoAttachment = getLogoAttachment()
    const attachments = logoAttachment ? [logoAttachment] : []

    await mailtrapClient.send({
      from: senders.passwordReset,
      to: recipient,
      subject: 'Reset your password',
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace('{resetURL}', safeResetURL),
      category: 'Password Reset',
      attachments,
    })
  } catch (error) {
    throw new Error(`Error sending password reset email: ${error}`)
  }
}

export const sendResetSuccessEmail = async (email) => {
  const recipient = [{ email }]

  try {
    const logoAttachment = getLogoAttachment()
    const attachments = logoAttachment ? [logoAttachment] : []

    await mailtrapClient.send({
      from: senders.passwordReset,
      to: recipient,
      subject: 'Password Reset Successful',
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
      category: 'Password Reset',
      attachments,
    })
  } catch (error) {
    throw new Error(`Error sending password reset success email: ${error}`)
  }
}

export const sendSubscriptionWelcomeEmail = async (
  email,
  userName,
  planType
) => {
  const recipient = [{ email }]

  // Determine client URL based on environment
  const getClientUrl = () => {
    if (process.env.CLIENT_URL) {
      return process.env.CLIENT_URL
    }
    if (process.env.NODE_ENV === 'production') {
      return 'https://woofmeetup.com'
    }
    return 'http://localhost:8000'
  }

  const clientUrl = getClientUrl()
  const planName = planType === 'vip' ? 'VIP Plan' : 'Premium Plan'

  try {
    // MEDIUM SECURITY FIX: Use safeTemplateReplace to HTML-escape all user-controlled variables
    // Prevents template injection attacks from malicious usernames or planNames
    const htmlContent = safeTemplateReplace(SUBSCRIPTION_WELCOME_TEMPLATE, {
      planName: sanitizeTemplateVariable(planName, 'text'),
      userName: sanitizeTemplateVariable(userName, 'text'),
      dashboardUrl: sanitizeTemplateVariable(`${clientUrl}/dashboard`, 'url'),
    })

    const logoAttachment = getLogoAttachment()
    const attachments = logoAttachment ? [logoAttachment] : []

    await mailtrapClient.send({
      from: senders.subscription,
      to: recipient,
      subject: `Welcome to ${planName}! 🎉`,
      html: htmlContent,
      category: 'Subscription',
      attachments,
    })
  } catch (error) {
    logError('emails', 'Error sending subscription welcome email', error)
    // Don't throw error - email failure shouldn't break subscription flow
  }
}

export const sendAccountDeletionEmail = async (
  email,
  userName,
  deletionDate,
  hasSubscription,
  subscriptionPlan,
  messageCredits
) => {
  const recipient = [{ email }]

  // Determine client URL based on environment
  const getClientUrl = () => {
    if (process.env.CLIENT_URL) {
      return process.env.CLIENT_URL
    }
    if (process.env.NODE_ENV === 'production') {
      return 'https://woofmeetup.com'
    }
    return 'http://localhost:8000'
  }

  const clientUrl = getClientUrl()

  // Format deletion date
  const formattedDate = new Date(deletionDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Build dynamic content based on user's subscription/credits status
  let subscriptionInfo = ''
  let creditsInfo = ''
  let voidedCreditsInfo = ''
  let subscriptionCancellationInfo = ''

  if (hasSubscription) {
    const planName = subscriptionPlan === 'vip' ? 'VIP' : 'Premium'
    subscriptionInfo = `<p style="margin: 10px 0; font-size: 15px;"><strong>Active Subscription:</strong> ${planName} Plan (will be canceled)</p>`
    subscriptionCancellationInfo = `<li>Your ${planName} subscription will be automatically canceled</li>`
  }

  if (messageCredits > 0) {
    creditsInfo = `<p style="margin: 10px 0; font-size: 15px;"><strong>Remaining Credits:</strong> ${messageCredits} message credits</p>`
    voidedCreditsInfo = `<li>Your ${messageCredits} remaining message credits will be voided</li>`
  }

  try {
    // Determine if this is immediate (today) or scheduled (future date)
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const isImmediate = formattedDate === today

    // Build deletion type and date info
    const deletionType = isImmediate ? 'Confirmed' : 'Scheduled'
    const dateInfoContent = isImmediate
      ? `<p style="margin: 10px 0; font-size: 15px;"><strong>Status:</strong> Deleted immediately</p>`
      : `<p style="margin: 10px 0; font-size: 15px;"><strong>Scheduled Deletion Date:</strong> ${sanitizeTemplateVariable(
          formattedDate,
          'text'
        )}</p>`

    // Build dynamic info content (subscription and credits info)
    let dynamicInfo = subscriptionInfo + creditsInfo

    // Build dynamic list content (items to void or cancel)
    let dynamicList = voidedCreditsInfo + subscriptionCancellationInfo

    // MEDIUM SECURITY FIX: Use safeTemplateReplace to HTML-escape user-controlled variables
    // Then use raw string.replace for pre-built HTML content to avoid double-escaping
    let htmlContent = safeTemplateReplace(ACCOUNT_DELETION_SCHEDULED_TEMPLATE, {
      userName: sanitizeTemplateVariable(userName, 'text'),
      deletionType: deletionType,
    })

    // Replace HTML content directly without escaping
    htmlContent = htmlContent.replace(/{dateInfo}/g, dateInfoContent)
    htmlContent = htmlContent.replace(/{dynamicInfo}/g, dynamicInfo)
    htmlContent = htmlContent.replace(/{dynamicList}/g, dynamicList)

    const logoAttachment = getLogoAttachment()
    const attachments = logoAttachment ? [logoAttachment] : []

    await mailtrapClient.send({
      from: senders.accountDeletion,
      to: recipient,
      subject: 'Account Deletion Scheduled - Woof Meetup',
      html: htmlContent,
      category: 'Account Deletion',
      attachments,
    })
  } catch (error) {
    logError('emails', 'Error sending account deletion email', error)
    // Don't throw error - email failure shouldn't break deletion flow
  }
}

export const sendCreditsPurchaseEmail = async (
  email,
  userName,
  credits,
  newBalance,
  amount
) => {
  const recipient = [{ email }]

  try {
    // MEDIUM SECURITY FIX: Use safeTemplateReplace to HTML-escape all user-controlled variables
    // Prevents template injection from usernames and user-provided data
    const htmlContent = safeTemplateReplace(CREDITS_PURCHASE_TEMPLATE, {
      userName: sanitizeTemplateVariable(userName, 'text'),
      credits: sanitizeTemplateVariable(String(credits), 'text'),
      newBalance: sanitizeTemplateVariable(String(newBalance), 'text'),
      amount: sanitizeTemplateVariable(`$${amount.toFixed(2)}`, 'text'),
    })

    const logoAttachment = getLogoAttachment()
    const attachments = logoAttachment ? [logoAttachment] : []

    await mailtrapClient.send({
      from: senders.creditsPurchase,
      to: recipient,
      subject: 'Credits Purchase Confirmed - Woof Meetup',
      html: htmlContent,
      category: 'Credits Purchase',
      attachments,
    })
  } catch (error) {
    logError('emails', 'Error sending credits purchase email', error)
    // Don't throw error - email failure shouldn't break purchase flow
  }
}
