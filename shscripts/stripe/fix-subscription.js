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

async function fixSubscription() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.URI
    
    if (!mongoUri) {
      console.error('❌ MongoDB URI not found in .env file')
      process.exit(1)
    }

    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB\n')

    const email = 'martincooldog@outlook.com'
    const subscriptionData = {
      subscriptionId: 'sub_1SSMgrLIapPWbhRsEv9N9wN0',
      customerId: 'cus_TP9LXWaVWyqYDf',
      priceId: 'price_1SRxWILIapPWbhRsgizmZoS6',
      status: 'active',
      currentPeriodEnd: 1765479194,
    }

    console.log('🔍 Finding user...')
    const user = await User.findOne({ email })

    if (!user) {
      console.log('❌ User not found:', email)
      process.exit(1)
    }

    console.log('✅ User found!')
    console.log('📧 Email:', user.email)
    console.log('👤 Username:', user.userName)
    console.log('')

    console.log('📝 Current subscription data:')
    console.log('   Subscription:', user.subscription || 'free')
    console.log('   Status:', user.subscriptionStatus || 'none')
    console.log('   Stripe Subscription ID:', user.stripeSubscriptionId || 'none')
    console.log('   End Date:', user.subscriptionEndDate || 'none')
    console.log('')

    const STRIPE_PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID
    const STRIPE_VIP_PRICE_ID = process.env.STRIPE_VIP_PRICE_ID

    console.log('🔑 Price IDs from .env:')
    console.log('   Premium:', STRIPE_PREMIUM_PRICE_ID)
    console.log('   VIP:', STRIPE_VIP_PRICE_ID)
    console.log('   Webhook Price:', subscriptionData.priceId)
    console.log('')

    const planType = subscriptionData.priceId === STRIPE_VIP_PRICE_ID ? 'vip' : 'premium'

    console.log('🎯 Determined plan type:', planType)
    console.log('')

    console.log('🔄 Updating user subscription...')
    user.subscription = planType
    user.subscriptionStatus = subscriptionData.status
    user.stripeSubscriptionId = subscriptionData.subscriptionId
    user.subscriptionEndDate = new Date(subscriptionData.currentPeriodEnd * 1000)
    await user.save()

    console.log('✅ Subscription updated successfully!')
    console.log('')
    console.log('📝 New subscription data:')
    console.log('   Subscription:', user.subscription)
    console.log('   Status:', user.subscriptionStatus)
    console.log('   Stripe Subscription ID:', user.stripeSubscriptionId)
    console.log('   End Date:', user.subscriptionEndDate)
    console.log('')

    console.log('🎉 Done! User subscription has been manually updated.')
    console.log('💡 The webhook should work automatically for future subscriptions.')

    await mongoose.disconnect()
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
    process.exit(1)
  }
}

fixSubscription()
