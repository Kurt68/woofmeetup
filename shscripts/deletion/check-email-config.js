#!/usr/bin/env node

/**
 * Check Email Configuration
 *
 * Displays current email configuration and mode (Testing vs Sending)
 *
 * Usage:
 *   node shscripts/deletion/check-email-config.js
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') })

console.log('\n📧 Email Configuration Check\n')
console.log('='.repeat(60))

// Check environment
const nodeEnv = process.env.NODE_ENV || 'development'
console.log(`\n🌍 Environment: ${nodeEnv}`)

// Check tokens
const testingToken = process.env.MAILTRAP_TOKEN
const sendingToken = process.env.MAILTRAP_SENDING_TOKEN
const endpoint = process.env.MAILTRAP_ENDPOINT
const useSending = process.env.USE_MAILTRAP_SENDING

console.log('\n🔑 Tokens:')
console.log(
  `  Testing Token: ${
    testingToken
      ? '✅ Set (' + testingToken.substring(0, 8) + '...)'
      : '❌ Not set'
  }`
)
console.log(
  `  Sending Token: ${
    sendingToken && sendingToken !== 'your_sending_api_token_here'
      ? '✅ Set (' + sendingToken.substring(0, 8) + '...)'
      : '❌ Not set'
  }`
)
console.log(`  Endpoint: ${endpoint || '(not set)'}`)

// Determine mode
const isProduction = nodeEnv === 'production'
const willUseSending = useSending === 'true' || isProduction

console.log('\n📮 Email Mode:')
if (willUseSending) {
  console.log('  🚀 SENDING MODE (Real Email Delivery)')
  console.log('  └─ Emails will be sent to real inboxes')

  if (!sendingToken || sendingToken === 'your_sending_api_token_here') {
    console.log(
      '\n  ⚠️  WARNING: Sending mode enabled but no valid sending token!'
    )
    console.log('  └─ Get your token from: https://mailtrap.io/sending/streams')
  }
} else {
  console.log('  🧪 TESTING MODE (Sandbox)')
  console.log('  └─ Emails will be captured in Mailtrap inbox')
  console.log('  └─ View at: https://mailtrap.io/inboxes')
}

// Configuration details
console.log('\n⚙️  Configuration:')
console.log(`  USE_MAILTRAP_SENDING: ${useSending || 'false'}`)
console.log(`  NODE_ENV: ${nodeEnv}`)

// Sender info
console.log('\n📤 Sender:')
console.log('  Email: hello@woofmeetup.com')
console.log('  Name: Woof Meetup Onboarding')

// Next steps
console.log('\n📋 Next Steps:')
if (!willUseSending) {
  console.log('  To enable real email delivery:')
  console.log(
    '  1. Get sending token from: https://mailtrap.io/sending/streams'
  )
  console.log('  2. Set MAILTRAP_SENDING_TOKEN in .env')
  console.log('  3. Set USE_MAILTRAP_SENDING=true in .env')
  console.log('  4. Restart your server')
  console.log('\n  See docs/EMAIL_SETUP.md for detailed instructions')
} else {
  console.log('  ✅ Ready to send emails to real inboxes!')
  console.log(
    '  Test with: node shscripts/deletion/test-deletion-email.js your@email.com'
  )
}

console.log('\n' + '='.repeat(60) + '\n')
