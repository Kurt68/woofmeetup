import mongoose from 'mongoose'
import { logInfo, logError } from '../utilities/logger.js'

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    logInfo('database', `MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    logError('database', 'MongoDB connection failed', error)
    process.exit(1)
  }
}
