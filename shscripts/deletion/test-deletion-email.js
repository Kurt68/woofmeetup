#!/usr/bin/env node

/**
 * Test Account Deletion Email
 *
 * This script helps debug why account deletion emails aren't being sent.
 * It checks:
 * 1. User's subscription status
 * 2. User's credit status
 * 3. Whether email should be sent
 * 4. Attempts to send a test email
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import mongoose from 'mongoose'
import { User } from '../../server/models/user.model.js'
import { sendAccountDeletionEmail } from '../../server/mailtrap/emails.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from root directory
dotenv.config({ path: join(__dirname, '../../.env') })

const MONGODB_URI = process.env.URI

async function testDeletionEmail() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    // Get user email from command line or prompt
    const userEmail = process.argv[2]

    if (!userEmail) {
      console.error('❌ Please provide a user email as argument')
      console.log('Usage: node test-deletion-email.js user@example.com')
      process.exit(1)
    }

    console.log(`🔍 Looking up user: ${userEmail}`)
    const user = await User.findOne({ email: userEmail })

    if (!user) {
      console.error(`❌ User not found: ${userEmail}`)
      process.exit(1)
    }

    console.log('\n📊 User Details:')
    console.log('─────────────────────────────────────')
    console.log(`Name: ${user.userName}`)
    console.log(`Email: ${user.email}`)
    console.log(`Subscription: ${user.subscription || 'none'}`)
    console.log(`Message Credits: ${user.messageCredits}`)
    console.log(`Stripe Customer ID: ${user.stripeCustomerId || 'none'}`)
    console.log(`Subscription End Date: ${user.subscriptionEndDate || 'none'}`)
    console.log(`Pending Deletion: ${user.pendingDeletion || false}`)
    console.log(
      `Scheduled Deletion Date: ${user.scheduledDeletionDate || 'none'}`
    )

    // Check if user has active subscription
    const hasActiveSubscription =
      user.subscription && user.subscription !== 'free'
    console.log(`\n🔍 Has Active Subscription: ${hasActiveSubscription}`)

    // Check if user has purchased credits (more than default 10)
    const hasPurchasedCredits = user.messageCredits > 10
    console.log(
      `🔍 Has Purchased Credits: ${hasPurchasedCredits} (${user.messageCredits} credits)`
    )

    // Determine if email should be sent
    const shouldSendEmail = hasActiveSubscription || hasPurchasedCredits
    console.log(`\n📧 Should Send Email: ${shouldSendEmail}`)

    if (!shouldSendEmail) {
      console.log('\n⚠️  This user would be deleted immediately without email')
      console.log('   (Free tier with default 10 credits or less)')
      process.exit(0)
    }

    // Calculate scheduled deletion date
    let scheduledDate
    if (hasActiveSubscription && user.subscriptionEndDate) {
      scheduledDate = new Date(user.subscriptionEndDate)
    } else {
      scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + 30)
    }

    console.log(
      `\n📅 Scheduled Deletion Date: ${scheduledDate.toLocaleDateString(
        'en-US',
        {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }
      )}`
    )

    // Check Mailtrap configuration
    console.log('\n🔧 Mailtrap Configuration:')
    console.log('─────────────────────────────────────')
    console.log(
      `MAILTRAP_TOKEN: ${process.env.MAILTRAP_TOKEN ? '✅ Set' : '❌ Not set'}`
    )
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
    console.log(
      `CLIENT_URL: ${process.env.CLIENT_URL || 'not set (will use default)'}`
    )

    if (!process.env.MAILTRAP_TOKEN) {
      console.error('\n❌ MAILTRAP_TOKEN is not set in .env file')
      console.log('   Email cannot be sent without this configuration')
      process.exit(1)
    }

    // Attempt to send test email
    console.log('\n📧 Attempting to send test email...')
    console.log('─────────────────────────────────────')

    try {
      await sendAccountDeletionEmail(
        user.email,
        user.userName,
        scheduledDate,
        hasActiveSubscription,
        user.subscription,
        user.messageCredits
      )
      console.log('✅ Email sent successfully!')
      console.log(
        '\n📬 Check your Mailtrap inbox at: https://mailtrap.io/inboxes'
      )
    } catch (emailError) {
      console.error('❌ Failed to send email:')
      console.error(emailError)
      console.log('\nPossible issues:')
      console.log('1. Invalid MAILTRAP_API_KEY')
      console.log('2. Mailtrap account not configured')
      console.log('3. Network connectivity issues')
      console.log('4. Sender email not verified in Mailtrap')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

testDeletionEmail()
