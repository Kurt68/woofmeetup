import mongoose from 'mongoose'
import { compare } from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const userSchema = new mongoose.Schema({
  user_id: String,
  email: String,
  password: String,
  userName: String,
  isAdmin: Boolean,
})

const User = mongoose.model('User', userSchema)

async function checkUser() {
  try {
    await mongoose.connect(process.env.URI)
    console.log('✅ Connected to MongoDB\n')

    const email = 'kurt.ah@outlook.com'
    const password = 'midces-nEbsi3-vetpad'

    // Find user
    const user = await User.findOne({ email })

    if (!user) {
      console.log('❌ User NOT found with email:', email)
      console.log('\n📋 Available users:')
      const allUsers = await User.find(
        {},
        { email: 1, userName: 1, isAdmin: 1, _id: 0 }
      ).limit(10)
      console.table(allUsers)
      process.exit(1)
    }

    console.log('✅ User found!')
    console.log('📧 Email:', user.email)
    console.log('👤 Username:', user.userName)
    console.log('🔑 User ID:', user.user_id)
    console.log('👑 Is Admin:', user.isAdmin)
    console.log('')

    // Check password
    const isPasswordValid = await compare(password, user.password)

    if (isPasswordValid) {
      console.log('✅ Password is CORRECT!')
      console.log('\n🎉 You should be able to log in with these credentials')
    } else {
      console.log('❌ Password is INCORRECT!')
      console.log("\n💡 The user exists but the password doesn't match")
      console.log('   Try resetting the password or use the correct one')
    }

    await mongoose.disconnect()
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkUser()
