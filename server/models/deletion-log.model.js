import mongoose from 'mongoose'
import crypto from 'crypto'

const deletionLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    deletedAt: {
      type: Date,
      required: false, // Not required for scheduled deletions
      default: null,
    },
    scheduledDeletionDate: {
      type: Date,
      required: false,
    },
    hadActiveSubscription: {
      type: Boolean,
      default: false,
    },
    voidedCredits: {
      type: Number,
      default: 0,
    },
    stripeCustomerId: String,
    subscriptionEndDate: Date,
    // Prevent same email from recovering credits
    emailHash: {
      type: String,
      required: false, // Set by pre-save hook
      index: true,
    },
  },
  { timestamps: true }
)

// Hash email for privacy but allow duplicate prevention
deletionLogSchema.pre('save', function (next) {
  if (this.email && !this.emailHash) {
    this.emailHash = crypto.createHash('sha256').update(this.email.toLowerCase()).digest('hex')
  }
  next()
})

export const DeletionLog = mongoose.model('DeletionLog', deletionLogSchema)
