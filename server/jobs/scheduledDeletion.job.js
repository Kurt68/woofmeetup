import cron from 'node-cron'
import { User } from '../models/user.model.js'
import { DeletionLog } from '../models/deletion-log.model.js'
import Message from '../models/message.model.js'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront'

const bucketName = process.env.AWS_BUCKET_NAME
const bucketRegion = process.env.AWS_BUCKET_REGION
const accessKey = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const cloudFrontDistId = process.env.CLOUD_FRONT_DIST_ID

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
})

const cloudFront = new CloudFrontClient({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
})

// Helper function to permanently delete a user account
async function performPermanentDeletion(user) {
  const voidedCredits = user.messageCredits || 0

  // Update deletion log
  await DeletionLog.findOneAndUpdate(
    { userId: user.user_id, deletedAt: null },
    {
      deletedAt: new Date(),
      voidedCredits: voidedCredits,
    }
  )

  // Delete user image from S3
  if (user.image) {
    try {
      const deleteParams = {
        Bucket: bucketName,
        Key: user.image,
      }
      const command = new DeleteObjectCommand(deleteParams)
      await s3.send(command)

      // Invalidate CloudFront cache
      const invalidationParams = {
        DistributionId: cloudFrontDistId,
        InvalidationBatch: {
          CallerReference: user.image,
          Paths: {
            Quantity: 1,
            Items: ['/' + user.image],
          },
        },
      }
      const invalidationCommand = new CreateInvalidationCommand(
        invalidationParams
      )
      await cloudFront.send(invalidationCommand)
    } catch (imageError) {
      // Silent error handling - image deletion is non-critical for account deletion
    }
  }

  // Delete all user messages
  await Message.deleteMany({
    $or: [{ senderId: user._id }, { receiverId: user._id }],
  })

  // Remove from other users' matches
  await User.updateMany(
    { matches: user.user_id },
    { $pull: { matches: user.user_id } }
  )

  // Delete user account
  await User.deleteOne({ user_id: user.user_id })
}

// Process scheduled deletions
async function processScheduledDeletions() {
  try {
    const now = new Date()

    // Find all users with pending deletion whose scheduled date has passed
    const usersToDelete = await User.find({
      pendingDeletion: true,
      scheduledDeletionDate: { $lte: now },
    })

    if (usersToDelete.length === 0) {
      return
    }

    for (const user of usersToDelete) {
      try {
        await performPermanentDeletion(user)
      } catch (error) {
        // Silent error handling - continue processing other deletions
      }
    }
  } catch (error) {
    // Silent error handling - job will retry on next scheduled run
  }
}

// Run every day at 2 AM
export function startScheduledDeletionJob() {
  // Cron format: minute hour day month weekday
  // '0 2 * * *' = At 2:00 AM every day
  cron.schedule('0 2 * * *', async () => {
    await processScheduledDeletions()
  })
}

// For testing: run immediately
export async function runScheduledDeletionNow() {
  await processScheduledDeletions()
}
