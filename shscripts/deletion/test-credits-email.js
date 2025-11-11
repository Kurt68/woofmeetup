import { sendCreditsPurchaseEmail } from '../../server/mailtrap/emails.js'

/**
 * Test script for credits purchase confirmation email
 *
 * Usage: node shscripts/deletion/test-credits-email.js <email> [credits] [newBalance] [amount]
 *
 * Examples:
 *   node shscripts/deletion/test-credits-email.js your-email@example.com
 *   node shscripts/deletion/test-credits-email.js your-email@example.com 50 75 9.99
 */

const testEmail = process.argv[2]
const credits = process.argv[3] || '50'
const newBalance = process.argv[4] || '75'
const amount = parseFloat(process.argv[5] || '9.99')

if (!testEmail) {
  console.error('❌ Error: Email address is required')
  console.log(
    '\nUsage: node shscripts/deletion/test-credits-email.js <email> [credits] [newBalance] [amount]'
  )
  console.log('\nExample:')
  console.log(
    '  node shscripts/deletion/test-credits-email.js your-email@example.com 50 75 9.99'
  )
  process.exit(1)
}

console.log('🧪 Testing Credits Purchase Email')
console.log('================================')
console.log(`Email: ${testEmail}`)
console.log(`Credits Purchased: ${credits}`)
console.log(`New Balance: ${newBalance}`)
console.log(`Amount Paid: $${amount.toFixed(2)}`)
console.log('================================\n')

try {
  await sendCreditsPurchaseEmail(
    testEmail,
    'Test User',
    credits,
    newBalance,
    amount
  )

  console.log('✅ Credits purchase email sent successfully!')
  console.log('\n📧 Check your inbox at:', testEmail)
  console.log('\nEmail details:')
  console.log(`  - Subject: Credits Purchase Confirmed - Woof Meetup`)
  console.log(`  - Credits: ${credits}`)
  console.log(`  - New Balance: ${newBalance}`)
  console.log(`  - Amount: $${amount.toFixed(2)}`)
} catch (error) {
  console.error('❌ Error sending email:', error.message)
  process.exit(1)
}
