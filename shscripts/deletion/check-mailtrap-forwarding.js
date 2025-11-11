#!/usr/bin/env node

/**
 * Check Mailtrap Email Forwarding Configuration
 *
 * This script helps diagnose why some emails reach real inboxes while others don't.
 * It checks your current Mailtrap configuration and provides recommendations.
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..', '..')

dotenv.config({ path: join(rootDir, '.env') })

console.log('\n🔍 MAILTRAP CONFIGURATION CHECK\n')
console.log('='.repeat(60))

// Check environment variables
const mailtrapToken = process.env.MAILTRAP_TOKEN
const sendingToken = process.env.MAILTRAP_SENDING_TOKEN
const useSending = process.env.USE_MAILTRAP_SENDING === 'true'
const nodeEnv = process.env.NODE_ENV

console.log('\n📋 Current Configuration:')
console.log('-'.repeat(60))
console.log(`Environment: ${nodeEnv}`)
console.log(`Testing API Token: ${mailtrapToken ? '✅ Set' : '❌ Missing'}`)
console.log(
  `Sending API Token: ${
    sendingToken && sendingToken !== 'your_sending_api_token_here'
      ? '✅ Set'
      : '❌ Not configured'
  }`
)
console.log(
  `USE_MAILTRAP_SENDING: ${
    useSending ? '✅ true (Sending API)' : '❌ false (Testing API)'
  }`
)

console.log('\n🎯 Current Mode:')
console.log('-'.repeat(60))
if (useSending || nodeEnv === 'production') {
  console.log('📤 SENDING API MODE (Real Email Delivery)')
  console.log('   Emails will be sent to real inboxes')
} else {
  console.log('📥 TESTING API MODE (Sandbox)')
  console.log('   Emails are captured in Mailtrap inbox')
  console.log(
    '   ⚠️  Emails only reach real inboxes if Email Forwarding is enabled'
  )
}

console.log('\n📧 Email Categories in Your App:')
console.log('-'.repeat(60))
const categories = [
  {
    name: 'Email Verification',
    function: 'sendVerificationEmail',
    status: '?',
  },
  { name: 'Password Reset', function: 'sendPasswordResetEmail', status: '?' },
  {
    name: 'Subscription',
    function: 'sendSubscriptionWelcomeEmail',
    status: '?',
  },
  {
    name: 'Account Deletion',
    function: 'sendAccountDeletionEmail',
    status: '?',
  },
]

categories.forEach((cat) => {
  console.log(`   • ${cat.name}`)
  console.log(`     Function: ${cat.function}()`)
})

console.log('\n❓ THE MYSTERY:')
console.log('-'.repeat(60))
console.log('You mentioned:')
console.log(
  '   ✅ Verification emails REACH your real inbox (kurt.ah@outlook.com)'
)
console.log('   ❌ Deletion/Subscription emails ONLY appear in Mailtrap')
console.log('   ℹ️  You never set up Email Forwarding')
console.log('')
console.log('This is puzzling because:')
console.log('   • All emails use the SAME mailtrapClient.send() method')
console.log('   • All emails use the SAME sender configuration')
console.log("   • You're in Testing API mode (sandbox)")
console.log("   • Testing API doesn't send to real inboxes by default")

console.log('\n🔎 POSSIBLE EXPLANATIONS:')
console.log('-'.repeat(60))
console.log('\n1️⃣  Email Forwarding IS enabled (but you forgot)')
console.log('   → Check: https://mailtrap.io/inboxes')
console.log('   → Click your inbox → "Email Forwarding" tab')
console.log('   → Look for forwarding rules for "Email Verification" category')

console.log("\n2️⃣  You're using a different Mailtrap account/inbox")
console.log('   → The token might be for a Sending API account')
console.log('   → Check: https://mailtrap.io/api-tokens')

console.log('\n3️⃣  Mailtrap changed their default behavior')
console.log('   → Some categories might auto-forward by default now')
console.log('   → Check Mailtrap documentation for recent changes')

console.log('\n4️⃣  Browser extension or email client is fetching from Mailtrap')
console.log('   → Some tools can pull emails from Mailtrap and forward them')
console.log('   → Check your browser extensions')

console.log('\n✅ RECOMMENDED ACTIONS:')
console.log('-'.repeat(60))
console.log('\n📍 Step 1: Check Mailtrap Email Forwarding')
console.log('   1. Go to https://mailtrap.io/inboxes')
console.log('   2. Click your inbox')
console.log('   3. Click "Email Forwarding" tab')
console.log('   4. Check which categories have forwarding enabled')
console.log('   5. Take a screenshot and review')

console.log('\n📍 Step 2: Test Each Email Type')
console.log(
  '   Run these commands and check BOTH Mailtrap AND your real inbox:'
)
console.log('')
console.log('   # Test verification email')
console.log(
  '   node shscripts/deletion/test-deletion-email.js kurt.ah@outlook.com'
)
console.log('')
console.log('   # Check your real inbox (kurt.ah@outlook.com)')
console.log('   # Check Mailtrap inbox (https://mailtrap.io/inboxes)')

console.log('\n📍 Step 3: Choose Your Solution')
console.log('')
console.log('   Option A: Enable Email Forwarding for ALL categories')
console.log('   → Quick fix (2 minutes)')
console.log('   → Good for development/testing')
console.log('   → Go to Mailtrap → Email Forwarding → Enable all categories')
console.log('')
console.log('   Option B: Switch to Sending API')
console.log('   → Production-ready (5 minutes)')
console.log('   → Recommended for production')
console.log('   → Follow guide in QUICK_EMAIL_SETUP.md')

console.log('\n📚 Documentation:')
console.log('-'.repeat(60))
console.log('   • EMAIL_QUICK_REFERENCE.md - Quick fixes')
console.log('   • EMAIL_MYSTERY_SOLVED.md - Detailed explanation')
console.log('   • QUICK_EMAIL_SETUP.md - Sending API setup')
console.log('   • docs/EMAIL_SETUP.md - Complete guide')

console.log('\n' + '='.repeat(60))
console.log('💡 TIP: The fact that verification emails work means there IS')
console.log('    a way for emails to reach your inbox. We just need to find')
console.log('    out what that mechanism is and apply it to all categories!')
console.log('='.repeat(60) + '\n')
