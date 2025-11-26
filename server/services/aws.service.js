/**
 * AWS S3 and CloudFront Service
 * Centralized singleton for S3 client initialization
 * SECURITY FIX #6: Moved from auth.controller.js to avoid repeated credential loading
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront'
import { logError, logInfo } from '../utilities/logger.js'
import AppError from '../utilities/AppError.js'
import { ErrorCodes } from '../constants/errorCodes.js'

// Validate required AWS environment variables
const validateAwsConfig = () => {
  const required = [
    'AWS_BUCKET_NAME',
    'AWS_BUCKET_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'CLOUD_FRONT_DIST_ID',
  ]

  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw AppError.internalError(ErrorCodes.EXTERNAL_SERVICE_ERROR, `Missing AWS configuration: ${missing.join(', ')}. Configure these in .env`)
  }
}

// Initialize AWS clients once at module load time (singleton pattern)
let s3Client = null
let cloudFrontClient = null

const initializeAwsClients = () => {
  try {
    validateAwsConfig()

    const credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }

    s3Client = new S3Client({
      credentials,
      region: process.env.AWS_BUCKET_REGION,
    })

    cloudFrontClient = new CloudFrontClient({
      credentials,
      region: process.env.AWS_BUCKET_REGION,
    })

    logInfo('aws.service', 'AWS S3 and CloudFront clients initialized')
  } catch (error) {
    logError('aws.service', 'Failed to initialize AWS clients', error)
    throw error
  }
}

// Initialize clients on module import
// Startup will fail if AWS is not configured
initializeAwsClients()

export const getS3Client = () => s3Client
export const getCloudFrontClient = () => cloudFrontClient

export const awsService = {
  /**
   * Upload file to S3
   * @param {string} fileName - S3 object key/filename
   * @param {Buffer} fileBuffer - File content
   * @param {string} contentType - MIME type
   * @returns {Promise<Object>} Upload response
   */
  async uploadToS3(fileName, fileBuffer, contentType) {
    try {
      const params = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
      })

      const result = await s3Client.send(params)
      logInfo('aws.service', `File uploaded to S3: ${fileName}`)
      return result
    } catch (error) {
      logError('aws.service', 'S3 upload failed', error, { fileName })
      throw error
    }
  },

  /**
   * Delete file from S3
   * @param {string} fileName - S3 object key/filename to delete
   * @returns {Promise<Object>} Delete response
   */
  async deleteFromS3(fileName) {
    try {
      const params = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
      })

      const result = await s3Client.send(params)
      logInfo('aws.service', `File deleted from S3: ${fileName}`)
      return result
    } catch (error) {
      logError('aws.service', 'S3 deletion failed', error, { fileName })
      throw error
    }
  },

  /**
   * Create CloudFront cache invalidation
   * @param {Array<string>} paths - Paths to invalidate (e.g., ['/profile/*', '/images/*'])
   * @returns {Promise<Object>} Invalidation response
   */
  async invalidateCloudFront(paths) {
    try {
      const params = new CreateInvalidationCommand({
        DistributionId: process.env.CLOUD_FRONT_DIST_ID,
        InvalidationBatch: {
          Paths: {
            Quantity: paths.length,
            Items: paths,
          },
          CallerReference: `${Date.now()}-${Math.random()}`,
        },
      })

      const result = await cloudFrontClient.send(params)
      logInfo('aws.service', `CloudFront invalidation created: ${result.Invalidation.Id}`)
      return result
    } catch (error) {
      logError('aws.service', 'CloudFront invalidation failed', error, {
        paths,
      })
      throw error
    }
  },

  /**
   * Get S3 client for advanced operations
   * @returns {S3Client} The S3 client instance
   */
  getS3Client() {
    return s3Client
  },

  /**
   * Get CloudFront client for advanced operations
   * @returns {CloudFrontClient} The CloudFront client instance
   */
  getCloudFrontClient() {
    return cloudFrontClient
  },
}

export default awsService
