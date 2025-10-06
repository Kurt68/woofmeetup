import { hash, compare } from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { User } from '../models/user.model.js'

import { generatedVerificationToken } from '../utilities/generatedVerificationToken.js'
import { generateTokenAndSetCookie } from '../utilities/generateTokenAndSetCookie.js'
import { validationResult } from 'express-validator'

import { getSignedUrl } from '@aws-sdk/cloudfront-signer'
import sharp from 'sharp'
import { randomBytes } from 'crypto'

import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront'

import {
  sendPasswordResetEmail,
  sendResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from '../mailtrap/emails.js'

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

const randomImageName = (bytes = 32) => randomBytes(bytes).toString('hex')

const bucketName = process.env.BUCKET_NAME
const bucketRegion = process.env.BUCKET_REGION
const accessKey = process.env.ACCESS_KEY
const secretAccessKey = process.env.SECRET_ACCESS_KEY
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

// Signup to the Database
export const signup = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log({ errors: errors.array() })
    return res.status(400).json({ errors: errors.array() })
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

    generateTokenAndSetCookie(res, user.user_id, user._id)

    await sendVerificationEmail(user.email, verificationToken)

    res.status(201).json({
      success: true,
      message: 'User created successfuly',
      user: {
        ...user._doc,
        password: undefined,
      },
    })
  } catch (error) {
    console.log('Error in signing up ', error)
    res.status(400).json({ success: false, message: error })
  }
}

// Log in to the Database
export const login = async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid credentials' })
    }
    const isPasswordValid = await compare(password, user.password)
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid credentials' })
    }

    generateTokenAndSetCookie(res, user.user_id, user._id)

    user.lastLogin = new Date()
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: {
        ...user._doc,
        password: undefined,
      },
    })
  } catch (error) {
    console.log('Error in login ', error)
    res.status(400).json({ success: false, message: error.message })
  }
}
// Logout
export const logout = async (req, res) => {
  res.clearCookie('token')
  res.clearCookie('UserId')

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

    res.status(200).json({
      success: true,
      message: 'Email verified successfuly',
      user: {
        ...user._doc,
        password: undefined,
      },
    })
  } catch (error) {
    console.log('Error in verify email ', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// Forgot password
export const forgotPassword = async (req, res) => {
  const { email } = req.body
  try {
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' })
    }

    // Generate reset token
    const resetToken = randomBytes(20).toString('hex')
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000 // 1 hour

    user.resetPasswordToken = resetToken
    user.resetPasswordExpiresAt = resetTokenExpiresAt

    await user.save()

    // send email
    await sendPasswordResetEmail(
      user.email,
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    )

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
    })
  } catch (error) {
    console.log('Error in forgotPassword ', error)
    res.status(400).json({ success: false, message: error.message })
  }
}
// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    })

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or expired reset token' })
    }

    // update password
    const hashedPassword = await hash(password, 10)

    user.password = hashedPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpiresAt = undefined
    await user.save()

    await sendResetSuccessEmail(user.email)

    res
      .status(200)
      .json({ success: true, message: 'Password reset successful' })
  } catch (error) {
    console.log('Error in resetPassword ', error)
    res.status(400).json({ success: false, message: error.message })
  }
}

// Check Authorization
export const checkAuth = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.userId }).select('-password') // dont' select password
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' })
    }

    res.status(200).json({ success: true, user })
  } catch (error) {
    console.log('Error in checkAuth ', error)
    res.status(400).json({ success: false, message: error.message })
  }
}
// Put current user radius form select value in the Database
export const putUserSelectDistance = async (req, res) => {
  const { userId, selectDistance } = req.body

  try {
    const query = { user_id: userId }
    const updateDocument = {
      $set: {
        current_user_search_radius: parseInt(selectDistance),
      },
    }
    const insertedDistance = await User.updateOne(query, updateDocument)
    res.json(insertedDistance)
  } catch (error) {
    console.log('Error in user selecting distance ', error)
    res.status(400).json({ success: false, message: error.message })
  }
}
// Get all Users that swiped right for each other for the current user in the database. (for MatchesDisplay.jsx)
export const getMatches = async (req, res) => {
  const userIds = JSON.parse(req.query.userIds)

  try {
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
                    $concat: ['d36ifi98wv8n1.cloudfront.net/', '$$image'],
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
      // const getObjectParams = {
      //   Bucket: bucketName,
      //   Key: user.image,
      // }

      // const command = new GetObjectCommand(getObjectParams)
      // const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
      // user.imageUrl = 'https://d36ifi98wv8n1.cloudfront.net/' + user.image

      // s3 bucket code above. cloudfront cdn code below

      user.imageUrl = getSignedUrl({
        url: 'https://d36ifi98wv8n1.cloudfront.net/' + user.image,
        dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
        privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
        keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
      })

      // Generate signed URL for profile image if it exists
      if (user.profile_image) {
        user.profile_image = getSignedUrl({
          url: 'https://d36ifi98wv8n1.cloudfront.net/' + user.profile_image,
          dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
          privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
          keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
        })
      }
    }

    res.json(foundUsers)
  } catch (error) {
    console.log(
      'Error in getting matches for all users that swiped right for current user ',
      error
    )
    res.status(400).json({ success: false, message: error.message })
  }
}
// Get current user (logged in user)
export const getUser = async (req, res) => {
  const userId = req.query.userId
  try {
    const query = { user_id: userId }

    const userDoc = await User.findOne(query)

    // Convert Mongoose document to plain object so we can add new properties
    const user = userDoc.toObject()

    // Generate signed URL for dog image if it exists
    if (user.image) {
      user.imageUrl = getSignedUrl({
        url: 'https://d36ifi98wv8n1.cloudfront.net/' + user.image,
        dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
        privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
        keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
      })
    }

    // Generate signed URL for profile image if it exists
    if (user.profile_image) {
      try {
        user.profileImageUrl = getSignedUrl({
          url: 'https://d36ifi98wv8n1.cloudfront.net/' + user.profile_image,
          dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
          privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
          keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
        })
      } catch (error) {
        console.error('Error generating signed URL for profile image:', error)
        user.profileImageUrl = null
      }
    }
    res.send(user)
  } catch (error) {
    console.log('Error in getting current user for display in header ', error)
    res.status(400).json({ success: false, message: error.message })
  }
}
// Get current user meetup_interest and all users who have same meetup_interest or
// show all meetup activites to the user along with current_user_search_radius from the Database
export const getMeetupTypeUsers = async (req, res) => {
  const { userId, selectDistance } = req.query
  const overrideRadius = parseInt(selectDistance)

  try {
    // First, get the current user to access their location and preferences
    const currentUser = await User.findOne({ user_id: userId })
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
            user_id: { $ne: userId },
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
            $concat: ['https://d36ifi98wv8n1.cloudfront.net/', '$image'],
          },
        },
      },

      // Stage 5: Project only the needed fields
      {
        $project: {
          _id: 0,
          user_id: 1,
          about: 1,
          age: 1,
          meetup_type: 1,
          dogs_name: 1,
          show_meetup_type: 1,
          imageUrl: 1,
          image: 1,
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
        user.imageUrl = getSignedUrl({
          url: 'https://d36ifi98wv8n1.cloudfront.net/' + user.image,
          dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
          privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
          keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
        })
      }
    }

    res.json(foundUsers)
  } catch (error) {
    console.log('Error in getting meetup type users:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
// Set lon lat coordiantes
export const getCurrentPosition = async (req, res) => {
  const { userId, longitude, latitude } = req.body

  try {
    const query = { user_id: userId }

    const updateDocument = {
      $set: {
        location: { type: 'Point', coordinates: [longitude, latitude] },
      },
    }

    const userCoordinates = await User.updateOne(query, updateDocument)

    res.json({ userCoordinates })
  } catch (error) {
    console.log('Error in setting lon and lat coordinates ', error)
    res.status(400).json({ success: false, message: error.message })
  }
}
// Put new user profile info in database
export const putUser = async (req, res) => {
  const formData = req.body.formData

  try {
    const query = { user_id: formData.user_id }

    const updateDocument = {
      $set: {
        dogs_name: formData.dogs_name,
        age: formData.age,
        show_meetup_type: formData.show_meetup_type,
        meetup_type: formData.meetup_type,
        meetup_interest: formData.meetup_interest,
        about: formData.about,
        matches: [],
        current_user_search_radius: formData.current_user_search_radius,
      },
    }

    const insertedUser = await User.updateOne(query, updateDocument)
    res.json(insertedUser)
  } catch (error) {
    console.log('Error in putting new user in db. ', error)
    res.status(400).json({ success: false, message: error.message })
  }
}
// Update User with a match
export const updateMatches = async (req, res) => {
  const { userId, matchedUserId } = req.body

  try {
    const query = { user_id: userId }
    const updateDocument = {
      $push: { matches: { user_id: matchedUserId } },
    }
    const user = await User.updateOne(query, updateDocument)
    res.send(user)
  } catch (error) {
    console.log('Error in updating user with a match ', error)
    res.status(400).json({ success: false, message: error.message })
  }
}
// Remove a match (unmatch)
export const removeMatch = async (req, res) => {
  const { userId, matchedUserId } = req.body

  try {
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

    res.json({ success: true, message: 'Match removed successfully' })
  } catch (error) {
    console.log('Error in removing match ', error)
    res.status(400).json({ success: false, message: error.message })
  }
}
// Put photo endpoint
export const uploadImage = async (req, res) => {
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
  await s3.send(command)

  try {
    const { UserId } = req.body
    const query = { user_id: UserId }

    const updateDocument = {
      $set: {
        image: image_name,
      },
    }
    const insertedImage = await User.updateOne(query, updateDocument)

    res.send(insertedImage)
  } catch (error) {
    console.log('Error in putting image ', error)
    res.status(400).json({ success: false, message: error })
  }
}

// Upload profile image to S3 and update user profile_image field
export const uploadProfileImage = async (req, res) => {
  try {
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
    const s3Result = await s3.send(command)

    const query = { user_id: req.body.UserId }
    const updateDocument = {
      $set: {
        profile_image: imageName,
      },
    }
    const insertedImage = await User.updateOne(query, updateDocument)

    // Generate signed URL for immediate response
    const imageURL = getSignedUrl({
      url: `https://d36ifi98wv8n1.cloudfront.net/${imageName}`,
      keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
      privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
      dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
    })

    res.json({ success: true, imageURL, insertedImage })
  } catch (error) {
    console.log('Error in uploading profile image ', error)
    res.status(400).json({ success: false, message: error })
  }
}

// Get current user in database (for EditDogProfile.jsx)
export const getCurrentUserProfile = async (req, res) => {
  const userId = req.query.userId

  try {
    const query = { user_id: userId }

    const currentUserProfile = await User.findOne(query)

    res.json(currentUserProfile)
  } catch (error) {
    console.log(
      'Error in getting current user for editing dog profile. ',
      error
    )
    res.status(400).json({ success: false, message: error.message })
  }
}

// Patch existing user profile info in database (for EditDogProfile.jsx)
export const patchCurrentUserProfile = async (req, res) => {
  const formData = req.body.formData

  try {
    const query = { user_id: formData.user_id }

    const updateDocument = {
      $set: {
        dogs_name: formData.dogs_name,
        age: formData.age,
        show_meetup_type: formData.show_meetup_type,
        meetup_type: formData.meetup_type,
        meetup_interest: formData.meetup_interest,
        about: formData.about,
        current_user_search_radius: formData.current_user_search_radius,
      },
    }
    const insertedUser = await User.updateOne(query, updateDocument)
    res.json(insertedUser)
  } catch (error) {
    console.log('Error in putting new user in db. ', error)
    res.status(400).json({ success: false, message: error.message })
  }
}

// delete from s3 bucket and invalidate cloudfront cache because image is cached for 24 hours
export const deleteImage = async (req, res) => {
  try {
    const userId = req.query.userId
    const query = { user_id: userId }

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
    await s3.send(command)

    // Invalidate the cloud front cache for that image
    const invalidationParams = {
      DistributionId: cloudFrontDistId,
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
    await cloudFront.send(invalidationCommand)

    res.send(user)
  } catch (error) {
    console.log('Error in deleting image from database ', error)
    res.status(400).json({ success: false, message: error })
  }
}

// Delete one user from database
export const deleteOneUser = async (req, res) => {
  try {
    const userId = req.query.userId
    const query = { user_id: userId }

    const currentUser = await User.findOne(query)

    const deleteImage = {
      $unset: {
        image: currentUser,
      },
    }
    await currentUser.updateOne(query, deleteImage)

    const deleteParams = {
      Bucket: bucketName,
      Key: currentUser.image,
    }

    const command = new DeleteObjectCommand(deleteParams)
    await s3.send(command)

    const deleteUser = await User.deleteOne(query)

    // Invalidate the cloud front cache for that image
    const invalidationParams = {
      DistributionId: cloudFrontDistId,
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
    await cloudFront.send(invalidationCommand)
    // if (deleteUser.deletedCount === 1) {
    //   console.log('Successfuly deleted one user')
    // } else {
    //   console.log('No user matched the query')
    // }
    res.send(deleteUser)
  } catch (error) {
    console.log('Error in deleting user from database', error)
    res.status(400).json({ success: false, message: error.message })
  }
}
