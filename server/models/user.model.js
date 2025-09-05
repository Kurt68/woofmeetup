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

    image_name: {
      type: String,
      required: false,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    image: {
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
    location: {
      type: Object,
      required: false,
    },
  },
  { timestamps: true }
)
export const User = mongoose.model('User', userSchema)
