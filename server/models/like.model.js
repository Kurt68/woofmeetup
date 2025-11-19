import mongoose from 'mongoose'

const likeSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

likeSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true })
likeSchema.index({ toUserId: 1, read: 1 })

export const Like = mongoose.model('Like', likeSchema)
