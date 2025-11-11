import { hash, compare } from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { isString, isArray } from 'lodash-es'
import { User } from '../models/user.model.js'
import { DeletionLog } from '../models/deletion-log.model.js'
import Message from '../models/message.model.js'

import { generatedVerificationToken } from '../utilities/generatedVerificationToken.js'
import { generateTokenAndSetCookie } from '../utilities/generateTokenAndSetCookie.js'
import { getClientUrl } from '../utilities/getClientUrl.js'
import { checkImage } from '../utilities/checkImage.js'
import { validateMagicBytes } from '../utilities/magicBytesValidator.js'
import { logError, logInfo } from '../utilities/logger.js'
import { sanitizeErrorMessage } from '../utilities/errorSanitizer.js'
import { logAuthzFailure } from '../utilities/securityLogger.js'
import { validationResult } from 'express-validator'
import { stripeService } from '../services/stripe.service.js'
import { io, getReceiverSocketId } from '../lib/socket.js'
import { validateUserId } from '../utilities/sanitizeInput.js'
import { getCloudFrontPrivateKey } from '../utilities/cloudFrontKeyParser.js'

import { getSignedUrl } from '@aws-sdk/cloudfront-signer'
import sharp from 'sharp'
import { randomBytes, timingSafeEqual } from 'crypto'

import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { CreateInvalidationCommand } from '@aws-sdk/client-cloudfront'

import {
  sendPasswordResetEmail,
  sendResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendAccountDeletionEmail,
} from '../mailtrap/emails.js'

// SECURITY FIX #6: Import AWS service singleton instead of initializing clients here
import { getS3Client, getCloudFrontClient } from '../services/aws.service.js'

const randomImageName = (bytes = 32) => randomBytes(bytes).toString('hex')

// Get singleton clients from AWS service
const getS3 = () => getS3Client()
const getCloudFront = () => getCloudFrontClient()
const bucketName = process.env.AWS_BUCKET_NAME
const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN

// Signup to the Database
export const signup = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    })
  }

  const { email, password, userName } = req.body

  const generatedUserId = uuidv4()
  const verificationToken = generatedVerificationToken()
  const hashedPassword = await hash(password, 10)

  try {
    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return res.status(409).send('User already exists. Please login')
    }

    const user = new User({
      email,
      user_id: generatedUserId,
      userName,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    })

    await user.save()

    const token = generateTokenAndSetCookie(
      res,
      user.user_id,
      user._id,
      user.email
    )

    // Send verification email (non-blocking - don't fail signup if email fails)
    sendVerificationEmail(user.email, verificationToken).catch((error) => {
      logError('auth.controller', 'Failed to send verification email', error)
    })

    res.status(201).json({
      success: true,
      message: 'User created successfuly',
      token,
      user: {
        ...user._doc,
        password: undefined,
      },
    })
  } catch (error) {
    logError('auth.controller', 'Signup error', error)
    res
      .status(500)
      .json({ success: false, message: 'An error occurred during signup' })
  }
}

// Log in to the Database
export const login = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    })
  }

  const { email, password } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'User does not exist. Please create an account.',
        })
    }
    const isPasswordValid = await compare(password, user.password)
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid credentials' })
    }

    const token = generateTokenAndSetCookie(
      res,
      user.user_id,
      user._id,
      user.email
    )

    user.lastLogin = new Date()
    await user.save()

    // Convert to plain object to add computed properties
    const userObj = user._doc

    // Generate signed URL for dog image if it exists
    if (user.image) {
      try {
        userObj.imageUrl = getSignedUrl({
          url: `https://${cloudfrontDomain}/` + user.image,
          dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
          privateKey: getCloudFrontPrivateKey(),
          keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
        })
      } catch (error) {
        logError(
          'auth.controller',
          'Failed to generate dog image URL during login',
          error
        )
      }
    }

    // Generate signed URL for profile image if it exists
    if (user.profile_image) {
      try {
        userObj.profileImageUrl = getSignedUrl({
          url: `https://${cloudfrontDomain}/` + user.profile_image,
          dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
          privateKey: getCloudFrontPrivateKey(),
          keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
        })
      } catch (error) {
        logError(
          'auth.controller',
          'Failed to generate profile image URL',
          error
        )
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        ...userObj,
        password: undefined,
      },
    })
  } catch (error) {
    logError('auth.controller', 'Login error', error)
    res
      .status(500)
      .json({ success: false, message: 'An error occurred during login' })
  }
}
// Logout
export const logout = async (req, res) => {
  // Must clear cookie with same options it was set with or browser won't remove it
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
  })

  res.status(200).json({ success: true, message: 'Logged out successfully' })
}

// Verify email
export const verifyEmail = async (req, res) => {
  const { code } = req.body
  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    })
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verificaiton code',
      })
    }
    user.isVerified = true
    user.verificationToken = undefined
    user.verificationTokenExpiresAt = undefined
    await user.save()

    await sendWelcomeEmail(user.email, user.userName)

    // Convert to plain object to add computed properties
    const userObj = user.toObject()

    // Generate signed URL for dog image if it exists
    if (user.image) {
      try {
        userObj.imageUrl = getSignedUrl({
          url: `https://${cloudfrontDomain}/` + user.image,
          dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
          privateKey: getCloudFrontPrivateKey(),
          keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
        })
      } catch (error) {
        logError(
          'auth.controller',
          'Failed to generate dog image URL during email verification',
          error
        )
      }
    }

    // Generate signed URL for profile image if it exists
    if (user.profile_image) {
      try {
        userObj.profileImageUrl = getSignedUrl({
          url: `https://${cloudfrontDomain}/` + user.profile_image,
          dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
          privateKey: getCloudFrontPrivateKey(),
          keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
        })
      } catch (error) {
        logError(
          'auth.controller',
          'Failed to generate profile image URL during email verification',
          error
        )
      }
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfuly',
      user: {
        ...userObj,
        password: undefined,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// Forgot password
export const forgotPassword = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    })
  }

  const { email } = req.body
  try {
    const user = await User.findOne({ email })

    if (!user) {
      // Don't reveal if email exists (prevents account enumeration)
      return res.status(200).json({
        success: true,
        message:
          'If an account exists with this email, you will receive password reset instructions',
      })
    }

    // Generate reset token with 30-minute expiration for better security
    // Security: Reduced from 1 hour to 30 minutes to mitigate brute force attacks
    const resetToken = randomBytes(20).toString('hex')
    const resetTokenExpiresAt = Date.now() + 30 * 60 * 1000 // 30 minutes

    user.resetPasswordToken = resetToken
    user.resetPasswordExpiresAt = resetTokenExpiresAt

    await user.save()

    // send email
    await sendPasswordResetEmail(
      user.email,
      `${getClientUrl(req)}/reset-password/${resetToken}`
    )

    res.status(200).json({
      success: true,
      message:
        'If an account exists with this email, you will receive password reset instructions',
    })
  } catch (error) {
    logError('auth.controller', 'Forgot password error', error)
    res.status(500).json({
      success: true,
      message:
        'If an account exists with this email, you will receive password reset instructions',
    })
  }
}
// Reset password
export const resetPassword = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    })
  }

  try {
    const { token } = req.params
    const { password } = req.body

    // Hash password before update to minimize time in critical section
    const hashedPassword = await hash(password, 10)

    // SECURITY FIX: Use atomic findOneAndUpdate to prevent race condition
    // This ensures token is invalidated IMMEDIATELY upon successful password update
    // No window exists where token could be reused by concurrent requests

    // Additional SECURITY FIX: Use constant-time comparison to prevent timing attacks
    // Even though token is checked in MongoDB query, we validate it here too for defense-in-depth
    // This prevents an attacker from measuring response times to guess the token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    }).select('_id email resetPasswordToken')

    if (!user) {
      // SECURITY FIX: Use constant-time wait to prevent timing attacks on token guessing
      // Random jitter (0-100ms) makes timing measurements less reliable
      // This prevents attackers from determining token validity by measuring response time
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 100))
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or expired reset token' })
    }

    // Constant-time comparison of tokens to prevent timing attacks
    // Even if token was found by chance, comparing times must be consistent
    if (user.resetPasswordToken && token) {
      try {
        const tokenBuffer = Buffer.from(token)
        const storedTokenBuffer = Buffer.from(user.resetPasswordToken)

        // timingSafeEqual throws if buffers are different lengths
        if (tokenBuffer.length !== storedTokenBuffer.length) {
          // SECURITY FIX: Use random jitter (0-100ms) to prevent timing attacks
          // Random delay makes timing measurements unreliable to attackers
          await new Promise((resolve) =>
            setTimeout(resolve, Math.random() * 100)
          )
          return res
            .status(400)
            .json({ success: false, message: 'Invalid or expired reset token' })
        }

        timingSafeEqual(tokenBuffer, storedTokenBuffer)
      } catch (error) {
        // timingSafeEqual threw - tokens don't match
        // SECURITY FIX: Use random jitter (0-100ms) to prevent timing attacks
        // Random delay makes timing measurements unreliable to attackers
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 100))
        return res
          .status(400)
          .json({ success: false, message: 'Invalid or expired reset token' })
      }
    }

    // Token is valid, now update password atomically
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          resetPasswordToken: undefined,
          resetPasswordExpiresAt: undefined,
        },
      },
      { new: true }
    )

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: 'An error occurred while resetting your password',
      })
    }

    await sendResetSuccessEmail(updatedUser.email)

    res
      .status(200)
      .json({ success: true, message: 'Password reset successful' })
  } catch (error) {
    logError('auth.controller', 'Reset password error', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password',
    })
  }
}

// Check Authorization
export const checkAuth = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.userId }).select('-password') // dont' select password
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' })
    }

    // Convert to plain object to add computed properties
    const userObj = user.toObject()

    // Generate signed URL for dog image if it exists
    if (user.image) {
      try {
        userObj.imageUrl = getSignedUrl({
          url: `https://${cloudfrontDomain}/` + user.image,
          dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
          privateKey: getCloudFrontPrivateKey(),
          keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
        })
      } catch (error) {
        logError(
          'auth.controller',
          'Failed to generate dog image URL during checkAuth',
          error
        )
      }
    }

    // Generate signed URL for profile image if it exists
    if (user.profile_image) {
      try {
        userObj.profileImageUrl = getSignedUrl({
          url: `https://${cloudfrontDomain}/` + user.profile_image,
          dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
          privateKey: getCloudFrontPrivateKey(),
          keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
        })
      } catch (error) {
        logError(
          'auth.controller',
          'Failed to generate profile image URL during checkAuth',
          error
        )
      }
    }

    // Get token from cookies for Socket.io authentication
    const token = req.cookies.token

    res.status(200).json({ success: true, token, user: userObj })
  } catch (error) {
    logError('auth.controller', 'Check auth error', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while checking authentication',
    })
  }
}
// Put current user radius form select value in the Database
export const putUserSelectDistance = async (req, res) => {
  const { userId, selectDistance } = req.body

  // SECURITY FIX #5: INCOMPLETE AUTHORIZATION - Require user_id from authenticated token
  // CRITICAL: Must validate userId against authenticated user to prevent privilege escalation
  // If userId is provided, it must match authenticated user
  // If userId is not provided, use authenticated user's ID
  const targetUserId = userId || req.userId

  // Authorization check: Ensure user can only modify their own search distance
  if (!targetUserId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required - user ID not found',
    })
  }

  if (targetUserId !== req.userId) {
    // Log authorization failure for IDOR attempt
    logAuthzFailure('idor_attempt', {
      userId: req.userId,
      endpoint: req.path,
      attemptedAction: 'update_search_distance',
      targetResource: targetUserId,
      ip: req.ip,
    })

    return res.status(403).json({
      success: false,
      message: 'Forbidden - cannot modify other user search distance',
    })
  }

  try {
    const query = { user_id: targetUserId }
    const updateDocument = {
      $set: {
        current_user_search_radius: parseInt(selectDistance),
      },
    }
    const insertedDistance = await User.updateOne(query, updateDocument)
    res.json(insertedDistance)
  } catch (error) {
    logError('auth.controller', 'Put user select distance error', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating search distance',
    })
  }
}
// Get all Users that swiped right for each other for the current user in the database. (for MatchesDisplay.jsx)
export const getMatches = async (req, res) => {
  try {
    // HIGH SECURITY FIX: Comprehensive input validation for userIds array
    // Prevent DoS attacks through oversized arrays and malformed data
    if (!req.query.userIds) {
      return res
        .status(400)
        .json({ success: false, message: 'userIds parameter required' })
    }

    let userIds
    try {
      userIds = JSON.parse(req.query.userIds)
    } catch (parseError) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid userIds format' })
    }

    // Validate it's an array
    if (!isArray(userIds)) {
      return res
        .status(400)
        .json({ success: false, message: 'userIds must be an array' })
    }

    // HIGH SECURITY FIX: Enforce maximum array size to prevent DoS attacks
    // Limit to 100 user IDs per request to prevent resource exhaustion
    const MAX_USER_IDS = 100
    if (userIds.length === 0 || userIds.length > MAX_USER_IDS) {
      return res.status(400).json({
        success: false,
        message: `userIds array must contain between 1 and ${MAX_USER_IDS} items`,
      })
    }

    // HIGH SECURITY FIX: Validate each element in the array
    // Ensure all elements are strings and are valid user IDs
    for (let i = 0; i < userIds.length; i++) {
      const id = userIds[i]

      // Verify each element is a string
      if (!isString(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid userIds format - element at index ${i} is not a string`,
        })
      }

      // Validate ID format (should be a valid UUID or MongoDB ObjectId)
      if (!id.match(/^[a-f0-9-]{36}$|^[a-f0-9]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: `Invalid user ID format at index ${i}`,
        })
      }

      // Prevent empty strings
      if (id.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: `Empty user ID at index ${i}`,
        })
      }
    }

    const pipeline = [
      {
        '$match': {
          'user_id': {
            '$in': userIds,
          },
        },
      },
      {
        $addFields: {
          imageUrl: {
            $concat: [
              'https://',
              {
                $let: {
                  vars: {
                    image: '$image',
                  },
                  in: {
                    $concat: [process.env.CLOUDFRONT_DOMAIN, '/', '$$image'],
                  },
                },
              },
            ],
          },
        },
      },
    ]

    const foundUsers = await User.aggregate(pipeline)
    for (const user of foundUsers) {
      if (user.image) {
        try {
          user.imageUrl = getSignedUrl({
            url: `https://${cloudfrontDomain}/` + user.image,
            dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
            privateKey: getCloudFrontPrivateKey(),
            keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
          })
        } catch (error) {
          logError(
            'auth.controller',
            'Failed to generate dog image URL in getMatches',
            error
          )
        }
      }

      // Generate signed URL for profile image if it exists
      if (user.profile_image) {
        try {
          user.profileImageUrl = getSignedUrl({
            url: `https://${cloudfrontDomain}/` + user.profile_image,
            dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
            privateKey: getCloudFrontPrivateKey(),
            keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
          })
        } catch (error) {
          logError(
            'auth.controller',
            'Failed to generate profile image URL in getMatches',
            error
          )
        }
      }
    }

    res.json(foundUsers)
  } catch (error) {
    logError('auth.controller', 'Get matches error', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching matches',
    })
  }
}
// Get current user (logged in user)
export const getUser = async (req, res) => {
  const userId = req.query.userId

  // SECURITY FIX #5: INCOMPLETE AUTHORIZATION - Require user_id from authenticated token
  // CRITICAL: Must validate userId against authenticated user
  const targetUserId = userId || req.userId

  // Authorization check: Ensure user can only fetch their own data
  if (!targetUserId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required - user ID not found',
    })
  }

  if (targetUserId !== req.userId) {
    // Log authorization failure for IDOR attempt
    logAuthzFailure('idor_attempt', {
      userId: req.userId,
      endpoint: req.path,
      attemptedAction: 'get_user_data',
      targetResource: targetUserId,
      ip: req.ip,
    })

    return res.status(403).json({
      success: false,
      message: 'Forbidden - cannot access other user data',
    })
  }

  try {
    const query = { user_id: targetUserId }

    const userDoc = await User.findOne(query)

    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    // Convert Mongoose document to plain object so we can add new properties
    const user = userDoc.toObject()

    // Generate signed URL for dog image if it exists
    if (user.image) {
      try {
        user.imageUrl = getSignedUrl({
          url: `https://${cloudfrontDomain}/` + user.image,
          dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
          privateKey: getCloudFrontPrivateKey(),
          keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
        })
      } catch (error) {
        logError(
          'auth.controller',
          'Failed to generate dog image URL in getUser',
          error
        )
      }
    }

    // Generate signed URL for profile image if it exists
    if (user.profile_image) {
      try {
        user.profileImageUrl = getSignedUrl({
          url: `https://${cloudfrontDomain}/` + user.profile_image,
          dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
          privateKey: getCloudFrontPrivateKey(),
          keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
        })
      } catch (error) {
        logError(
          'auth.controller',
          'Failed to generate profile image URL in getUser',
          error
        )
      }
    }
    res.json(user)
  } catch (error) {
    logError('auth.controller', 'Get user error', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching user information',
    })
  }
}
// Get current user meetup_interest and all users who have same meetup_interest or
// show all meetup activites to the user along with current_user_search_radius from the Database
export const getMeetupTypeUsers = async (req, res) => {
  const { userId } = req.query
  // Use validated numeric value from middleware, fallback to parsing if not present
  const overrideRadius =
    req.validatedQuery?.selectDistance ||
    (req.query.selectDistance ? parseInt(req.query.selectDistance) : undefined)

  // SECURITY FIX #5: INCOMPLETE AUTHORIZATION - Require user_id from authenticated token
  // CRITICAL: Must validate userId against authenticated user
  const targetUserId = userId || req.userId

  // Authorization check: Ensure user can only query their own meetup type users
  if (!targetUserId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required - user ID not found',
    })
  }

  if (targetUserId !== req.userId) {
    // Log authorization failure for IDOR attempt
    logAuthzFailure('idor_attempt', {
      userId: req.userId,
      endpoint: req.path,
      attemptedAction: 'get_meetup_type_users',
      targetResource: targetUserId,
      ip: req.ip,
    })

    return res.status(403).json({
      success: false,
      message: 'Forbidden - cannot query other user meetup data',
    })
  }

  try {
    // Use authenticated user ID
    const queryUserId = targetUserId
    // First, get the current user to access their location and preferences
    const currentUser = await User.findOne({ user_id: queryUserId })
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Ensure the user has location data
    if (!currentUser.location || !currentUser.location.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'User location not available. Please update your location.',
      })
    }

    // Determine the search radius to use (in miles)
    const searchRadius =
      !isNaN(overrideRadius) && overrideRadius > 0
        ? overrideRadius
        : currentUser.current_user_search_radius || 10 // Default to 10 miles if not set

    // Convert miles to meters for geoNear (1 mile = 1609.34 meters)
    const searchRadiusMeters = searchRadius * 1609.34

    // Create the aggregation pipeline with $geoNear
    const pipeline = [
      // First, we need to add a 2dsphere index to the location field in the User model
      // userSchema.index({ "location": "2dsphere" });

      // Stage 1: Use $geoNear for geospatial search
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: currentUser.location.coordinates,
          },
          distanceField: 'distance_to_other_users_meters',
          maxDistance: searchRadiusMeters,
          spherical: true,
          query: {
            // Exclude the current user
            user_id: { $ne: queryUserId },
          },
        },
      },

      // Stage 2: Convert distance from meters to miles and round
      {
        $addFields: {
          distance_to_other_users: {
            $round: [
              { $multiply: ['$distance_to_other_users_meters', 0.000621371] },
            ], // Convert meters to miles
          },
        },
      },

      // Stage 3: Filter by meetup interest
      {
        $match: {
          $expr: {
            $or: [
              // If current user wants to see all meetup activities
              {
                $eq: [currentUser.meetup_interest, 'Show all meetup activites'],
              },
              // Or if the other user has the same meetup interest
              { $eq: ['$meetup_interest', currentUser.meetup_interest] },
            ],
          },
        },
      },

      // Stage 4: Add CloudFront URL for images
      {
        $addFields: {
          imageUrl: {
            $concat: [`https://${process.env.CLOUDFRONT_DOMAIN}/`, '$image'],
          },
        },
      },

      // Stage 5: Project only the needed fields
      {
        $project: {
          _id: 0,
          user_id: 1,
          userName: 1,
          about: 1,
          age: 1,
          meetup_type: 1,
          dogs_name: 1,
          show_meetup_type: 1,
          imageUrl: 1,
          image: 1,
          profile_image: 1,
          userAge: 1,
          userAbout: 1,
          location: '$location.coordinates',
          distance_to_other_users: 1,
        },
      },
    ]

    // Execute the aggregation pipeline
    const foundUsers = await User.aggregate(pipeline)

    // Generate signed URLs for images
    for (const user of foundUsers) {
      if (user.image) {
        try {
          user.imageUrl = getSignedUrl({
            url: `https://${cloudfrontDomain}/` + user.image,
            dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
            privateKey: getCloudFrontPrivateKey(),
            keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
          })
        } catch (error) {
          logError(
            'auth.controller',
            'Failed to generate dog image URL in getMeetupTypeUsers',
            error
          )
        }
      }

      // Generate signed URL for profile image if it exists
      if (user.profile_image) {
        try {
          user.profileImageUrl = getSignedUrl({
            url: `https://${cloudfrontDomain}/` + user.profile_image,
            dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
            privateKey: getCloudFrontPrivateKey(),
            keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
          })
        } catch (error) {
          logError(
            'auth.controller',
            'Failed to generate profile image URL in getMeetupTypeUsers',
            error
          )
        }
      }
    }

    res.json(foundUsers)
  } catch (error) {
    logError('auth.controller', 'Get meetup type users error', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching users by meetup type',
    })
  }
}
// Set lon lat coordiantes
export const getCurrentPosition = async (req, res) => {
  const { userId, longitude, latitude } = req.body

  // SECURITY FIX #5: INCOMPLETE AUTHORIZATION - Require user_id from authenticated token
  // CRITICAL: Must validate userId against authenticated user to prevent privilege escalation
  const targetUserId = userId || req.userId

  // Authorization check: Ensure user can only update their own location
  if (!targetUserId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required - user ID not found',
    })
  }

  if (targetUserId !== req.userId) {
    // Log authorization failure for IDOR attempt
    logAuthzFailure('idor_attempt', {
      userId: req.userId,
      endpoint: req.path,
      attemptedAction: 'update_user_location',
      targetResource: targetUserId,
      ip: req.ip,
    })

    return res.status(403).json({
      success: false,
      message: 'Forbidden - cannot update other user location',
    })
  }

  try {
    const query = { user_id: targetUserId }

    const updateDocument = {
      $set: {
        location: { type: 'Point', coordinates: [longitude, latitude] },
      },
    }

    const userCoordinates = await User.updateOne(query, updateDocument)

    res.json({ userCoordinates })
  } catch (error) {
    logError('auth.controller', 'Get current position error', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching location',
    })
  }
}
// Put new user profile info in database
export const putUser = async (req, res) => {
  // Security: Check for validation errors from express-validator middleware
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    })
  }

  const formData = req.body.formData

  // SECURITY FIX #5: INCOMPLETE AUTHORIZATION - Require user_id from authenticated token
  // CRITICAL: Must validate userId against authenticated user
  const targetUserId = formData.user_id || req.userId

  // Authorization check: Ensure user can only modify their own profile
  if (!targetUserId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required - user ID not found',
    })
  }

  if (targetUserId !== req.userId) {
    // Log authorization failure for IDOR attempt
    logAuthzFailure('idor_attempt', {
      userId: req.userId,
      endpoint: req.path,
      attemptedAction: 'update_user_profile',
      targetResource: targetUserId,
      ip: req.ip,
    })

    return res.status(403).json({
      success: false,
      message: 'Forbidden - cannot modify other user profile',
    })
  }

  try {
    const query = { user_id: targetUserId }

    const updateDocument = {
      $set: {
        dogs_name: formData.dogs_name,
        age: formData.age,
        show_meetup_type: formData.show_meetup_type,
        meetup_type: formData.meetup_type,
        meetup_interest: formData.meetup_interest,
        about: formData.about,
        userAge: formData.userAge,
        userAbout: formData.userAbout,
        matches: [],
        current_user_search_radius: formData.current_user_search_radius,
      },
    }

    const insertedUser = await User.updateOne(query, updateDocument)
    res.json(insertedUser)
  } catch (error) {
    logError('auth.controller', 'Put user error', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating user information',
    })
  }
}
// Update User with a match
export const updateMatches = async (req, res) => {
  const { userId, matchedUserId } = req.body

  // SECURITY: Ensure user can only update their own matches
  const targetUserId = userId || req.userId

  if (targetUserId !== req.userId) {
    // Log authorization failure for IDOR attempt
    logAuthzFailure('idor_attempt', {
      userId: req.userId,
      endpoint: req.path,
      attemptedAction: 'update_matches',
      targetResource: targetUserId,
      ip: req.ip,
    })

    return res.status(403).json({
      success: false,
      message: 'Forbidden - cannot update matches for another user',
    })
  }

  try {
    // Validate user IDs to prevent NoSQL injection (defense in depth)
    validateUserId(userId, 'userId')
    validateUserId(matchedUserId, 'matchedUserId')

    const query = { user_id: userId }
    const updateDocument = {
      $push: { matches: { user_id: matchedUserId } },
    }
    const user = await User.updateOne(query, updateDocument)

    // Check if the other user also has this user in their matches (mutual match)
    const matchedUser = await User.findOne({ user_id: matchedUserId })
    const isMutualMatch = matchedUser?.matches?.some(
      (match) => match.user_id === userId
    )

    // If mutual match, notify both users via Socket.IO
    if (isMutualMatch) {
      const matchedUserSocketId = getReceiverSocketId(matchedUserId)
      const currentUserSocketId = getReceiverSocketId(userId)

      if (matchedUserSocketId) {
        io.to(matchedUserSocketId).emit('newMatch', {
          userId: userId,
          matchedUserId: matchedUserId,
        })
      }
      if (currentUserSocketId) {
        io.to(currentUserSocketId).emit('newMatch', {
          userId: userId,
          matchedUserId: matchedUserId,
        })
      }
    }

    res.json(user)
  } catch (error) {
    logError('auth.controller', 'Update matches error', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating matches',
    })
  }
}
// Remove a match (unmatch)
export const removeMatch = async (req, res) => {
  const { userId, matchedUserId } = req.body

  // SECURITY: Ensure user can only remove their own matches
  const targetUserId = userId || req.userId

  if (targetUserId !== req.userId) {
    // Log authorization failure for IDOR attempt
    logAuthzFailure('idor_attempt', {
      userId: req.userId,
      endpoint: req.path,
      attemptedAction: 'remove_match',
      targetResource: targetUserId,
      ip: req.ip,
    })

    return res.status(403).json({
      success: false,
      message: 'Forbidden - cannot remove matches for another user',
    })
  }

  try {
    // Validate user IDs to prevent NoSQL injection (defense in depth)
    validateUserId(userId, 'userId')
    validateUserId(matchedUserId, 'matchedUserId')

    // Remove the match from both users
    const query = { user_id: userId }
    const updateDocument = {
      $pull: { matches: { user_id: matchedUserId } },
    }
    await User.updateOne(query, updateDocument)

    // Also remove from the other user's matches
    const otherUserQuery = { user_id: matchedUserId }
    const otherUserUpdateDocument = {
      $pull: { matches: { user_id: userId } },
    }
    await User.updateOne(otherUserQuery, otherUserUpdateDocument)

    // Fetch updated user data to return
    const updatedUser = await User.findOne({ user_id: userId })

    // Notify both users via Socket.IO
    const matchedUserSocketId = getReceiverSocketId(matchedUserId)
    const currentUserSocketId = getReceiverSocketId(userId)

    if (matchedUserSocketId) {
      io.to(matchedUserSocketId).emit('userUnmatched', {
        userId: userId,
        matchedUserId: matchedUserId,
      })
    }
    if (currentUserSocketId) {
      io.to(currentUserSocketId).emit('userUnmatched', {
        userId: userId,
        matchedUserId: matchedUserId,
      })
    }

    res.json({
      success: true,
      message: 'Match removed successfully',
      user: updatedUser,
    })
  } catch (error) {
    logError('auth.controller', 'Remove match error', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while removing match',
    })
  }
}
// Upload dog photo endpoint - checks that image contains a dog
export const uploadImage = async (req, res) => {
  // SECURITY FIX: Use authenticated user from JWT token (req.userId)
  // FormData text fields are not automatically parsed by multer, so we rely on JWT authentication
  // The user is already verified by verifyToken middleware
  const userId = req.userId

  // Check if file was uploaded and passed validation
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded or file validation failed',
    })
  }

  try {
    // SECURITY FIX: Magic bytes validation to prevent file spoofing
    // Checks actual file signature instead of relying on MIME type header alone
    // This prevents attackers from uploading executables renamed as images
    const normalizedMimeType = req.file.mimetype.toLowerCase()
    if (!validateMagicBytes(req.file.buffer, normalizedMimeType)) {
      return res.status(400).json({
        success: false,
        message: `File content does not match declared type (${normalizedMimeType}). Possible spoofed file.`,
      })
    }

    // Check image contains a dog before processing
    const imageCheck = await checkImage(req.file.buffer)

    if (!imageCheck.isDog) {
      return res.status(400).json({
        success: false,
        message: 'This is not a dog please upload an image of your dog.',
        code: 'NO_DOG_DETECTED',
        reason: imageCheck.reason,
        dogBreeds: [],
      })
    }

    // resize image
    const buffer = await sharp(req.file.buffer)
      .resize({ height: 1920, width: 1080, fit: 'outside' })
      .jpeg({ quality: 40 })
      .withMetadata()
      .toBuffer()

    const image_name = randomImageName()

    const params = {
      Bucket: bucketName,
      Key: image_name,
      Body: buffer,
      ContentType: req.file.mimetype,
    }

    const command = new PutObjectCommand(params)
    await getS3().send(command)

    const query = { user_id: userId }

    const updateDocument = {
      $set: {
        image: image_name,
      },
    }
    const insertedImage = await User.updateOne(query, updateDocument)

    if (insertedImage.modifiedCount === 0) {
      logError(
        'auth.controller',
        'uploadImage',
        `Failed to update user image for user_id: ${userId}. Update result:`,
        insertedImage
      )
    }

    res.json({
      success: true,
      image: insertedImage,
      image_name: image_name, // Include the actual image name for debugging
      dogBreeds: imageCheck.dogBreeds,
    })
  } catch (error) {
    logError('auth.controller', 'uploadImage error', error)
    res.status(400).json({
      success: false,
      message: sanitizeErrorMessage(error, 'uploadImage'),
    })
  }
}

// Upload profile image to S3 and update user profile_image field
export const uploadProfileImage = async (req, res) => {
  // SECURITY FIX: Use authenticated user from JWT token (req.userId)
  // FormData text fields are not automatically parsed by multer, so we rely on JWT authentication
  // The user is already verified by verifyToken middleware
  const userId = req.userId

  try {
    // SECURITY FIX: Check if file was successfully uploaded by multer
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or file validation failed',
      })
    }

    // Check image for nudity before processing
    const imageCheck = await checkImage(req.file.buffer)

    if (imageCheck.isNude) {
      return res.status(400).json({
        success: false,
        message:
          'Profile photo rejected: This app is family-oriented. Please upload a non-nude photo.',
        code: 'NUDITY_DETECTED',
        confidence: imageCheck.confidence,
      })
    }

    const buffer = await sharp(req.file.buffer)
      .resize({ height: 1920, width: 1080, fit: 'outside' })
      .withMetadata()
      .jpeg({ quality: 40 })
      .toBuffer()

    const imageName = randomImageName()

    const params = {
      Bucket: bucketName,
      Key: imageName,
      Body: buffer,
      ContentType: req.file.mimetype,
    }

    const command = new PutObjectCommand(params)
    const s3Result = await getS3().send(command)

    const query = { user_id: userId }
    const updateDocument = {
      $set: {
        profile_image: imageName,
      },
    }
    const insertedImage = await User.updateOne(query, updateDocument)

    if (insertedImage.modifiedCount === 0) {
      logError(
        'auth.controller',
        'uploadProfileImage',
        `Failed to update user profile image for user_id: ${userId}. Update result:`,
        insertedImage
      )
    }

    // Generate signed URL for immediate response
    let imageURL = null
    try {
      imageURL = getSignedUrl({
        url: `https://${cloudfrontDomain}/${imageName}`,
        keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
        privateKey: getCloudFrontPrivateKey(),
        dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
      })
    } catch (error) {
      logError(
        'auth.controller',
        'Failed to generate signed URL in uploadProfileImage',
        error
      )
      // Continue with null URL rather than crashing
    }

    res.json({ success: true, imageURL, insertedImage })
  } catch (error) {
    logError('auth.controller', 'Upload profile image error', error)
    res.status(400).json({
      success: false,
      message: 'Failed to upload profile image',
    })
  }
}

// Get current user in database (for EditDogProfile.jsx)
export const getCurrentUserProfile = async (req, res) => {
  const userId = req.query.userId

  // SECURITY FIX #5: INCOMPLETE AUTHORIZATION - Require user_id from authenticated token
  // CRITICAL: Must validate userId against authenticated user
  const targetUserId = userId || req.userId

  // Authorization check: Ensure user can only fetch their own profile
  if (!targetUserId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required - user ID not found',
    })
  }

  if (targetUserId !== req.userId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden - cannot access other user profile',
    })
  }

  try {
    const query = { user_id: targetUserId }

    const currentUserProfile = await User.findOne(query)

    // Generate signed URLs for images
    if (currentUserProfile.image) {
      try {
        const privateKey = getCloudFrontPrivateKey()
        const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID

        if (!keyPairId) {
          logError('auth.controller', 'CloudFront key pair ID missing', {
            hasKeyPairId: !!keyPairId,
          })
          currentUserProfile.image = null
        } else {
          currentUserProfile.image = getSignedUrl({
            url:
              `https://${cloudfrontDomain}/` +
              currentUserProfile.image,
            dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
            privateKey: privateKey,
            keyPairId: keyPairId,
          })
        }
      } catch (signError) {
        logError(
          'auth.controller',
          'Failed to generate signed URL for dog image',
          signError
        )
        // If signed URL generation fails, set to null so frontend knows it failed
        currentUserProfile.image = null
      }
    }

    // Generate signed URL for profile image if it exists
    if (currentUserProfile.profile_image) {
      try {
        const privateKey = getCloudFrontPrivateKey()
        const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID

        if (!keyPairId) {
          logError(
            'auth.controller',
            'CloudFront key pair ID missing for profile image',
            {
              hasKeyPairId: !!keyPairId,
            }
          )
          currentUserProfile.profile_image = null
        } else {
          currentUserProfile.profile_image = getSignedUrl({
            url:
              `https://${cloudfrontDomain}/` +
              currentUserProfile.profile_image,
            dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
            privateKey: privateKey,
            keyPairId: keyPairId,
          })
        }
      } catch (signError) {
        logError(
          'auth.controller',
          'Failed to generate signed URL for profile image',
          signError
        )
        // If signed URL generation fails, set to null so frontend knows it failed
        currentUserProfile.profile_image = null
      }
    }

    res.json(currentUserProfile)
  } catch (error) {
    logError('auth.controller', 'Get current user profile error', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching your profile',
    })
  }
}

// Patch existing user profile info in database (for EditDogProfile.jsx)
export const patchCurrentUserProfile = async (req, res) => {
  // Security: Check for validation errors from express-validator middleware
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    })
  }

  const formData = req.body.formData

  // SECURITY FIX #5: INCOMPLETE AUTHORIZATION - Require user_id from authenticated token
  // CRITICAL: Must validate userId against authenticated user
  const targetUserId = formData.user_id || req.userId

  // Authorization check: Ensure user can only modify their own profile
  if (!targetUserId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required - user ID not found',
    })
  }

  if (targetUserId !== req.userId) {
    // Log authorization failure for IDOR attempt
    logAuthzFailure('idor_attempt', {
      userId: req.userId,
      endpoint: req.path,
      attemptedAction: 'patch_user_profile',
      targetResource: targetUserId,
      ip: req.ip,
    })

    return res.status(403).json({
      success: false,
      message: 'Forbidden - cannot modify other user profile',
    })
  }

  try {
    const query = { user_id: targetUserId }

    const updateDocument = {
      $set: {
        dogs_name: formData.dogs_name,
        age: formData.age,
        show_meetup_type: formData.show_meetup_type,
        meetup_type: formData.meetup_type,
        meetup_interest: formData.meetup_interest,
        about: formData.about,
        userAge: formData.userAge,
        userAbout: formData.userAbout,
        current_user_search_radius: formData.current_user_search_radius,
      },
    }

    const insertedUser = await User.updateOne(query, updateDocument)

    if (insertedUser.modifiedCount === 0 && insertedUser.matchedCount === 0) {
      logInfo('auth.controller', 'User not found during profile update', {
        targetUserId,
      })
    }

    res.json(insertedUser)
  } catch (error) {
    logError('auth.controller', 'Patch current user profile error', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating your profile',
    })
  }
}

// delete from s3 bucket and invalidate cloudfront cache because image is cached for 24 hours
export const deleteImage = async (req, res) => {
  const userId = req.query.userId

  // SECURITY FIX #5: INCOMPLETE AUTHORIZATION - Require user_id from authenticated token
  // CRITICAL: Must validate userId against authenticated user
  const targetUserId = userId || req.userId

  // Authorization check: Ensure user can only delete their own image
  if (!targetUserId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required - user ID not found',
    })
  }

  if (targetUserId !== req.userId) {
    // Log authorization failure for IDOR attempt
    logAuthzFailure('idor_attempt', {
      userId: req.userId,
      endpoint: req.path,
      attemptedAction: 'delete_dog_image',
      targetResource: targetUserId,
      ip: req.ip,
    })

    return res.status(403).json({
      success: false,
      message: 'Forbidden - cannot delete other user image',
    })
  }

  try {
    const query = { user_id: targetUserId }

    const currentUser = await User.findOne(query)
    const deleteImage = {
      $unset: {
        image: currentUser,
      },
    }
    const user = await User.updateOne(query, deleteImage)

    const deleteParams = {
      Bucket: bucketName,
      Key: currentUser.image,
    }

    const command = new DeleteObjectCommand(deleteParams)
    await getS3().send(command)

    // Invalidate the cloud front cache for that image
    const invalidationParams = {
      DistributionId: process.env.CLOUD_FRONT_DIST_ID,
      InvalidationBatch: {
        CallerReference: currentUser.image,
        Paths: {
          Quantity: 1,
          Items: ['/' + currentUser.image],
        },
      },
    }
    const invalidationCommand = new CreateInvalidationCommand(
      invalidationParams
    )
    await getCloudFront().send(invalidationCommand)

    res.json(user)
  } catch (error) {
    logError('auth.controller', 'Delete image error', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting image',
    })
  }
}

// Helper function to perform immediate account deletion
async function performImmediateDeletion(currentUser, res) {
  const query = { user_id: currentUser.user_id }
  const voidedCredits = currentUser.messageCredits || 0

  // Log deletion for audit trail
  await DeletionLog.create({
    userId: currentUser.user_id,
    email: currentUser.email,
    deletedAt: new Date(),
    hadActiveSubscription: false,
    voidedCredits: voidedCredits,
    stripeCustomerId: currentUser.stripeCustomerId,
    subscriptionEndDate: null,
  })

  // Delete user image from S3
  if (currentUser.image) {
    try {
      const deleteParams = {
        Bucket: bucketName,
        Key: currentUser.image,
      }
      const command = new DeleteObjectCommand(deleteParams)
      await getS3().send(command)

      // Invalidate CloudFront cache
      const invalidationParams = {
        DistributionId: process.env.CLOUD_FRONT_DIST_ID,
        InvalidationBatch: {
          CallerReference: currentUser.image,
          Paths: {
            Quantity: 1,
            Items: ['/' + currentUser.image],
          },
        },
      }
      const invalidationCommand = new CreateInvalidationCommand(
        invalidationParams
      )
      await getCloudFront().send(invalidationCommand)
    } catch (imageError) {
      // Silent error handling - image deletion is non-critical for account deletion
    }
  }

  // Delete all user messages
  await Message.deleteMany({
    $or: [{ senderId: currentUser._id }, { receiverId: currentUser._id }],
  })

  // Get all matched users before deletion (for real-time notifications)
  const matchedUsers = await User.find({
    matches: currentUser.user_id,
  })

  // Remove from other users' matches
  await User.updateMany(
    { matches: currentUser.user_id },
    { $pull: { matches: currentUser.user_id } }
  )

  // Notify all matched users that this user deleted their account
  matchedUsers.forEach((matchedUser) => {
    const matchedUserSocketId = getReceiverSocketId(matchedUser.user_id)
    if (matchedUserSocketId) {
      io.to(matchedUserSocketId).emit('userAccountDeleted', {
        deletedUserId: currentUser.user_id,
      })
    }
  })

  // Send account deletion email
  try {
    await sendAccountDeletionEmail(
      currentUser.email,
      currentUser.userName,
      new Date(),
      false,
      'free',
      voidedCredits
    )
  } catch (emailError) {
    logError(
      'auth.controller',
      'Failed to send account deletion email for immediate deletion',
      emailError
    )
  }

  // Delete user account
  await User.deleteOne(query)
  res.json({
    success: true,
    scheduled: false,
    message: 'Account deleted immediately',
    creditsVoided: voidedCredits,
  })
}

// Delete one user from database (or schedule deletion)
export const deleteOneUser = async (req, res) => {
  const userId = req.query.userId

  // SECURITY FIX #5: INCOMPLETE AUTHORIZATION - Require user_id from authenticated token
  // CRITICAL: Must validate userId against authenticated user to prevent privilege escalation
  const targetUserId = userId || req.userId

  // Authorization check: Ensure user can only delete their own account
  if (!targetUserId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required - user ID not found',
    })
  }

  if (targetUserId !== req.userId) {
    // Log authorization failure for IDOR attempt
    logAuthzFailure('idor_attempt', {
      userId: req.userId,
      endpoint: req.path,
      attemptedAction: 'delete_user_account',
      targetResource: targetUserId,
      ip: req.ip,
    })

    return res.status(403).json({
      success: false,
      message: 'Forbidden - cannot delete other user account',
    })
  }

  try {
    const query = { user_id: targetUserId }

    const currentUser = await User.findOne(query)

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    // ============================================
    // DETERMINE DELETION STRATEGY
    // ============================================
    const hasActiveSubscription = !!currentUser.stripeSubscriptionId
    // Check if user has purchased credits (more than default 10 or has Stripe customer ID with credits)
    const hasPurchasedCredits =
      currentUser.stripeCustomerId && currentUser.messageCredits > 10
    const isFreeUser = !hasActiveSubscription && !hasPurchasedCredits

    // ============================================
    // STRATEGY 1: IMMEDIATE DELETION (Free users with no purchased credits)
    // ============================================
    if (isFreeUser) {
      await performImmediateDeletion(currentUser, res)
      return
    }

    // ============================================
    // STRATEGY 2: SCHEDULED DELETION (Users with subscription or credits)
    // ============================================
    let scheduledDate
    let deletionMessage

    if (hasActiveSubscription) {
      // Cancel subscription at period end
      try {
        await stripeService.cancelSubscriptionAtPeriodEnd(
          currentUser.stripeSubscriptionId,
          'user_deleted_account'
        )
        // Schedule deletion for when subscription ends
        scheduledDate =
          currentUser.subscriptionEndDate ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        deletionMessage = `Account scheduled for deletion on ${scheduledDate.toLocaleDateString()}. You will retain access to premium features until then.`
      } catch (stripeError) {
        // Fallback to 30 days if Stripe fails
        scheduledDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        deletionMessage = `Account scheduled for deletion in 30 days. You will retain access until then.`
      }
    } else if (hasPurchasedCredits) {
      // User has purchased credits but no subscription - give 30 day grace period
      scheduledDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      deletionMessage = `Account scheduled for deletion in 30 days. You can continue using your ${currentUser.messageCredits} remaining credits until then.`
    }

    // Mark account for deletion
    currentUser.pendingDeletion = true
    currentUser.scheduledDeletionDate = scheduledDate
    currentUser.deletionReason = 'user_requested'
    await currentUser.save()

    // Log scheduled deletion for audit trail
    await DeletionLog.create({
      userId: currentUser.user_id,
      email: currentUser.email,
      deletedAt: null, // Not deleted yet
      scheduledDeletionDate: scheduledDate,
      hadActiveSubscription: hasActiveSubscription,
      voidedCredits: 0, // Credits not voided yet
      stripeCustomerId: currentUser.stripeCustomerId,
      subscriptionEndDate: currentUser.subscriptionEndDate,
    })

    // Send account deletion email
    try {
      await sendAccountDeletionEmail(
        currentUser.email,
        currentUser.userName,
        scheduledDate,
        hasActiveSubscription,
        currentUser.subscription,
        currentUser.messageCredits
      )
    } catch (emailError) {
      logError(
        'auth.controller',
        'Failed to send account deletion email',
        emailError
      )
      // Continue execution even if email fails
    }

    res.json({
      success: true,
      scheduled: true,
      message: deletionMessage,
      scheduledDeletionDate: scheduledDate,
      retainAccess: true,
    })
  } catch (error) {
    logError('auth.controller', 'Delete one user error', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while scheduling account deletion',
    })
  }
}

// Test endpoint to manually trigger scheduled deletion cron job
export const triggerScheduledDeletionJob = async (req, res) => {
  try {
    // Import the function dynamically to avoid circular dependencies
    const { runScheduledDeletionNow } = await import(
      '../jobs/scheduledDeletion.job.js'
    )

    // Run the scheduled deletion job
    await runScheduledDeletionNow()

    res.json({
      success: true,
      message: 'Scheduled deletion job executed successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logError('auth.controller', 'Trigger scheduled deletion job error', error)
    res.status(500).json({
      success: false,
      message: 'Failed to execute scheduled deletion job',
    })
  }
}
