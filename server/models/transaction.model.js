import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stripePaymentId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['subscription', 'credits', 'refund'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'usd',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    description: {
      type: String,
      required: false,
    },
    creditsAdded: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Object,
      required: false,
    },
  },
  { timestamps: true }
)

transactionSchema.index({ userId: 1, createdAt: -1 })
transactionSchema.index({ stripePaymentId: 1 })

export const Transaction = mongoose.model('Transaction', transactionSchema)
