import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now(),
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,

    image: {
      type: String,
      required: false,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    profile_image: {
      type: String,
      required: false,
    },
    profileImageUrl: {
      type: String,
      required: false,
    },
    about: {
      type: String,
      required: false,
    },
    age: {
      type: String,
      required: false,
    },
    userAbout: {
      type: String,
      required: false,
    },
    userAge: {
      type: String,
      required: false,
    },
    current_user_search_radius: {
      type: Number,
      required: false,
    },
    dogs_name: {
      type: String,
      required: false,
    },
    matches: {
      type: Array,
      required: false,
    },
    meetup_interest: {
      type: String,
      required: false,
    },
    meetup_type: {
      type: String,
      required: false,
    },
    show_meetup_type: {
      type: Boolean,
      required: false,
    },
    isProfilePublic: {
      type: Boolean,
      default: true,
      required: false,
    },
    location: {
      type: Object,
      required: false,
    },
    // Payment & Subscription fields
    subscription: {
      type: String,
      enum: ['free', 'premium', 'vip'],
      default: 'free',
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'trialing', 'canceling'],
      default: null,
    },
    stripeCustomerId: {
      type: String,
      required: false,
    },
    stripeSubscriptionId: {
      type: String,
      required: false,
    },
    subscriptionEndDate: {
      type: Date,
      required: false,
    },
    // Credits system
    messageCredits: {
      type: Number,
      default: 10, // Free messages on signup
    },
    totalMessagesSent: {
      type: Number,
      default: 0,
    },
    // Account deletion tracking
    pendingDeletion: {
      type: Boolean,
      default: false,
    },
    scheduledDeletionDate: {
      type: Date,
      required: false,
    },
    deletionReason: {
      type: String,
      required: false,
    },
    // Admin role
    isAdmin: {
      type: Boolean,
      default: false,
    },
    // Referral tracking
    referral_source: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
)
userSchema.index({ 'location': '2dsphere' })

export const User = mongoose.model('User', userSchema)
