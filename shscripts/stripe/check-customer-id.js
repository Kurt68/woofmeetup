import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const userSchema = new mongoose.Schema({
  user_id: String,
  email: String,
  userName: String,
  stripeCustomerId: String,
  subscription: String,
  subscriptionStatus: String,
  stripeSubscriptionId: String,
  subscriptionEndDate: Date,
  messageCredits: Number,
})

const User = mongoose.model('User', userSchema)

async function checkCustomerId() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.URI
    
    if (!mongoUri) {
      console.error('❌ MongoDB URI not found in .env file')
      console.log('💡 Make sure MONGODB_URI or URI is set in .env')
      process.exit(1)
    }

    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB\n')

    const email = 'martincooldog@outlook.com'
    const stripeCustomerId = 'cus_TP9LXWaVWyqYDf'

    console.log('🔍 Searching for user...')
    console.log('📧 Email:', email)
    console.log('💳 Stripe Customer ID:', stripeCustomerId)
    console.log('')

    const userByEmail = await User.findOne({ email })
    const userByCustomerId = await User.findOne({ stripeCustomerId })

    if (userByEmail) {
      console.log('✅ User found by email!')
      console.log('📧 Email:', userByEmail.email)
      console.log('👤 Username:', userByEmail.userName)
      console.log('🔑 User ID:', userByEmail.user_id)
      console.log('💳 Stripe Customer ID:', userByEmail.stripeCustomerId || '❌ NOT SET')
      console.log('📦 Subscription:', userByEmail.subscription || 'free')
      console.log('📊 Subscription Status:', userByEmail.subscriptionStatus || 'none')
      console.log('🎫 Stripe Subscription ID:', userByEmail.stripeSubscriptionId || 'none')
      console.log('📅 Subscription End Date:', userByEmail.subscriptionEndDate || 'none')
      console.log('💰 Message Credits:', userByEmail.messageCredits || 0)
      console.log('')

      if (!userByEmail.stripeCustomerId) {
        console.log('⚠️  PROBLEM FOUND: User does not have stripeCustomerId set!')
        console.log('💡 This is why the webhook cannot find the user.')
        console.log('')
        console.log('🔧 FIX: Update the user with the Stripe Customer ID')
        console.log(`   Run this in MongoDB shell or Compass:`)
        console.log(`   db.users.updateOne(`)
        console.log(`     { email: "${email}" },`)
        console.log(`     { $set: { stripeCustomerId: "${stripeCustomerId}" } }`)
        console.log(`   )`)
      } else if (userByEmail.stripeCustomerId !== stripeCustomerId) {
        console.log('⚠️  MISMATCH: User has different Stripe Customer ID!')
        console.log('   Database:', userByEmail.stripeCustomerId)
        console.log('   Webhook:', stripeCustomerId)
      } else {
        console.log('✅ Stripe Customer ID matches!')
      }
    } else {
      console.log('❌ User NOT found by email:', email)
    }

    console.log('')

    if (userByCustomerId) {
      console.log('✅ User found by Stripe Customer ID!')
      console.log('📧 Email:', userByCustomerId.email)
      console.log('👤 Username:', userByCustomerId.userName)
    } else {
      console.log('❌ User NOT found by Stripe Customer ID:', stripeCustomerId)
    }

    console.log('')
    console.log('📋 All users with Stripe Customer IDs:')
    const usersWithStripe = await User.find(
      { stripeCustomerId: { $exists: true, $ne: null } },
      { email: 1, userName: 1, stripeCustomerId: 1, subscription: 1, _id: 0 }
    ).limit(10)
    
    if (usersWithStripe.length > 0) {
      console.table(usersWithStripe)
    } else {
      console.log('   No users with Stripe Customer IDs found')
    }

    await mongoose.disconnect()
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
    process.exit(1)
  }
}

checkCustomerId()
