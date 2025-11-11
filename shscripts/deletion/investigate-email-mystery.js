#!/usr/bin/env node

/**
 * Investigate Email Mystery
 *
 * This script helps diagnose why verification emails reach real inboxes
 * but other emails (deletion, subscription) don't.
 *
 * Usage:
 *   node shscripts/deletion/investigate-email-mystery.js
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') })

console.log('\n🔍 Email Mystery Investigation\n')
console.log('='.repeat(70))

console.log("\n📧 THEORY: Why verification emails work but others don't\n")

console.log('Possible Explanations:')
console.log('─'.repeat(70))

console.log('\n1️⃣  EMAIL FORWARDING IN MAILTRAP')
console.log('   Mailtrap allows per-category email forwarding.')
console.log('   Verification emails might have forwarding enabled.')
console.log('')
console.log('   ✅ How to check:')
console.log('      • Go to: https://mailtrap.io/inboxes')
console.log('      • Select your inbox')
console.log('      • Click "Email Forwarding" or "Settings"')
console.log('      • Look for forwarding rules')
console.log('')
console.log('   📋 Categories in your app:')
console.log('      • "Email Verification" (verification emails)')
console.log('      • "Subscription" (subscription welcome emails)')
console.log('      • "Account Deletion" (deletion emails)')
console.log('      • "Password Reset" (password reset emails)')

console.log('\n2️⃣  MAILTRAP TEMPLATE WITH FORWARDING')
console.log('   The welcome email uses a Mailtrap template UUID.')
console.log('   Templates might have different delivery settings.')
console.log('')
console.log('   🔍 Found in code:')
console.log(
  '      • Welcome email uses: template_uuid: "adb08bc7-8995-4a9c-8617-ccf679a92c12"'
)
console.log('      • Other emails use: html templates')
console.log('')
console.log('   ✅ How to check:')
console.log('      • Go to: https://mailtrap.io/email-templates')
console.log('      • Find template: adb08bc7-8995-4a9c-8617-ccf679a92c12')
console.log('      • Check if it has special delivery settings')

console.log('\n3️⃣  MULTIPLE MAILTRAP INBOXES')
console.log('   You might have multiple inboxes with different settings.')
console.log('   Verification emails might go to a different inbox.')
console.log('')
console.log('   ✅ How to check:')
console.log('      • Go to: https://mailtrap.io/inboxes')
console.log('      • Check all your inboxes')
console.log('      • Look for forwarding settings on each')

console.log('\n4️⃣  MAILTRAP SENDING API ALREADY CONFIGURED')
console.log('   Part of your app might already use Sending API.')
console.log('   But only for certain email types.')
console.log('')
console.log('   ✅ How to check:')
console.log('      • Go to: https://mailtrap.io/sending/streams')
console.log('      • Check if you have any sending streams')
console.log('      • Look at recent sent emails')

console.log('\n' + '='.repeat(70))
console.log('\n🎯 RECOMMENDED ACTIONS\n')

console.log('Step 1: Check Mailtrap Email Forwarding')
console.log('   Visit: https://mailtrap.io/inboxes')
console.log('   Look for: Email Forwarding settings')
console.log(
  '   Expected: "Email Verification" category has forwarding to kurt.ah@outlook.com'
)
console.log('')

console.log('Step 2: Enable Forwarding for All Categories')
console.log('   If forwarding exists for "Email Verification":')
console.log('   • Add forwarding for "Account Deletion"')
console.log('   • Add forwarding for "Subscription"')
console.log('   • Add forwarding for "Password Reset"')
console.log('')

console.log('Step 3: OR Switch to Sending API (Recommended)')
console.log('   For production-ready email delivery:')
console.log('   • Get token from: https://mailtrap.io/sending/streams')
console.log('   • Update .env: MAILTRAP_SENDING_TOKEN=your_token')
console.log('   • Update .env: USE_MAILTRAP_SENDING=true')
console.log('   • Restart server')
console.log('')

console.log('Step 4: Test Again')
console.log(
  '   node shscripts/deletion/test-deletion-email.js kurt.ah@outlook.com'
)
console.log('   Check your Outlook inbox!')

console.log('\n' + '='.repeat(70))
console.log('\n📊 CURRENT CONFIGURATION\n')

const nodeEnv = process.env.NODE_ENV || 'development'
const testingToken = process.env.MAILTRAP_TOKEN
const sendingToken = process.env.MAILTRAP_SENDING_TOKEN
const useSending = process.env.USE_MAILTRAP_SENDING

console.log(`Environment: ${nodeEnv}`)
console.log(`Testing Token: ${testingToken ? '✅ Set' : '❌ Not set'}`)
console.log(
  `Sending Token: ${
    sendingToken && sendingToken !== 'your_sending_api_token_here'
      ? '✅ Set'
      : '❌ Not set'
  }`
)
console.log(
  `Use Sending API: ${useSending === 'true' ? '✅ Enabled' : '❌ Disabled'}`
)

const isProduction = nodeEnv === 'production'
const willUseSending = useSending === 'true' || isProduction

console.log(
  `\nCurrent Mode: ${willUseSending ? '🚀 SENDING MODE' : '🧪 TESTING MODE'}`
)

console.log('\n' + '='.repeat(70))
console.log('\n💡 QUICK FIX\n')

console.log('If you just want emails to work NOW:')
console.log('')
console.log('Option A: Enable Mailtrap Email Forwarding (2 minutes)')
console.log('   1. Go to https://mailtrap.io/inboxes')
console.log('   2. Click your inbox → Email Forwarding')
console.log('   3. Add kurt.ah@outlook.com to forwarding list')
console.log('   4. Enable for all categories')
console.log(
  '   5. Test: node shscripts/deletion/test-deletion-email.js kurt.ah@outlook.com'
)
console.log('')

console.log('Option B: Use Sending API (5 minutes)')
console.log('   1. Follow: QUICK_EMAIL_SETUP.md')
console.log('   2. Get sending token')
console.log('   3. Update .env')
console.log('   4. Restart server')
console.log('')

console.log('='.repeat(70) + '\n')
