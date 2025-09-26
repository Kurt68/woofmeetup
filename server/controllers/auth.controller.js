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

    const user = await User.findOne(query)

    // const getObjectParams = {
    //   Bucket: bucketName,
    //   Key: user.image,
    // }

    // const command = new GetObjectCommand(getObjectParams)
    // const url = await getSignedUrl(s3, command, { expiresIn: 3600 })

    // user.imageUrl = 'https://d36ifi98wv8n1.cloudfront.net/' + user.image

    user.imageUrl = getSignedUrl({
      url: 'https://d36ifi98wv8n1.cloudfront.net/' + user.image,
      dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // expire in 1 day
      privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
      keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
    })

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
    // One degree of latitude equals approximately 364,000 feet (69 miles), one minute equals 6,068 feet (1.15 miles),
    // and one-second equals 101 feet. One-degree of longitude equals 288,200 feet (54.6 miles), one minute equals
    // 4,800 feet (0.91 mile), and one second equals 80 feet.

    const sameMeetupInterestUsers = [
      { $match: { user_id: userId } },
      {
        $lookup: {
          from: 'users',
          let: {
            current_location: '$location.coordinates',
            meetup_interest: '$meetup_interest',
            search_radius: {
              $cond: {
                if: {
                  $and: [
                    { $ne: [overrideRadius, NaN] },
                    { $gt: [overrideRadius, 0] },
                  ],
                },
                then: overrideRadius,
                else: '$current_user_search_radius',
              },
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $cond: {
                    if: {
                      $eq: ['$$meetup_interest', 'Show all meetup activites'],
                    },
                    then: true,
                    else: {
                      $eq: ['$meetup_interest', '$$meetup_interest'],
                    },
                  },
                },
              },
            },
            {
              $addFields: {
                distance: {
                  $sqrt: {
                    $add: [
                      {
                        $pow: [
                          {
                            $subtract: [
                              { $arrayElemAt: ['$location.coordinates', 0] },
                              { $arrayElemAt: ['$$current_location', 0] },
                            ],
                          },
                          2,
                        ],
                      },
                      {
                        $pow: [
                          {
                            $subtract: [
                              { $arrayElemAt: ['$location.coordinates', 1] },
                              { $arrayElemAt: ['$$current_location', 1] },
                            ],
                          },
                          2,
                        ],
                      },
                    ],
                  },
                },
              },
            },
            {
              $addFields: {
                distance_to_other_users: { $multiply: ['$distance', 69] },
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
                          // ** s3 code here **
                          // bucketName: bucketName,
                          // bucketRegion: bucketRegion,
                          // accessKey: accessKey,
                          // secretAccessKey: secretAccessKey,
                          image: '$image',
                        },
                        in: {
                          $concat: [
                            // 'bucketName',
                            // 's3',
                            // 'bucketRegion',
                            'd36ifi98wv8n1.cloudfront.net/',
                            '$$image',
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
            {
              $match: {
                $expr: {
                  $lte: ['$distance_to_other_users', '$$search_radius'],
                },
              },
            },
          ],
          as: 'meetupTypeUsers',
        },
      },
      { $unwind: '$meetupTypeUsers' },
      {
        $project: {
          _id: 0,
          user_id: '$meetupTypeUsers.user_id',
          about: '$meetupTypeUsers.about',
          age: '$meetupTypeUsers.age',
          meetup_type: '$meetupTypeUsers.meetup_type',
          dogs_name: '$meetupTypeUsers.dogs_name',
          show_meetup_type: '$meetupTypeUsers.show_meetup_type',
          imageUrl: '$meetupTypeUsers.imageUrl',
          image: '$meetupTypeUsers.image',
          location: '$meetupTypeUsers.location.coordinates',
          distance_to_other_users: {
            $round: ['$meetupTypeUsers.distance_to_other_users'],
          },
        },
      },
    ]

    const foundUsers = await User.aggregate(sameMeetupInterestUsers)
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
    }

    res.json(foundUsers)
  } catch (error) {
    console.log('Error in getting meetuptype users', error)
    res.status(400).json({ success: false, message: error.message })
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

    // Only include image_name if it's provided
    if (formData.image_name) {
      updateDocument.$set.image_name = formData.image_name
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
// Put photo endpoint
export const uploadImage = async (req, res) => {
  // resize image
  const buffer = await sharp(req.file.buffer)
    .resize({ height: 1920, width: 1080, fit: 'outside' })
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

// Put user profile photo endpoint
export const uploadUserProfileImage = async (req, res) => {
  console.log('uploadUserProfileImage called with UserId:', req.body.UserId)

  // resize image
  const buffer = await sharp(req.file.buffer)
    .resize({ height: 1920, width: 1080, fit: 'outside' })
    .withMetadata()
    .toBuffer()

  const image_name = randomImageName()
  console.log('Generated profile image name:', image_name)

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
        profile_image: image_name,
      },
    }
    const insertedImage = await User.updateOne(query, updateDocument)
    console.log('Profile image updated in database:', insertedImage)

    res.send(insertedImage)
  } catch (error) {
    console.log('Error in putting user profile image ', error)
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
