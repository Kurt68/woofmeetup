import { logError, logInfo } from './logger.js'

/**
 * MongoDB Transaction Wrapper
 * Handles multi-step database operations atomically
 * Gracefully falls back to non-transactional mode if not supported (single server)
 *
 * Usage:
 * await withTransaction(async (session) => {
 *   await User.updateOne({...}, {...}, { session })
 *   await User.updateOne({...}, {...}, { session })
 * })
 *
 * @param {Function} callback - Async function receiving session parameter
 * @returns {Promise} Result of callback
 */
export const withTransaction = async (callback) => {
  const mongoose = (await import('mongoose')).default

  try {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const result = await callback(session)
      await session.commitTransaction()
      logInfo('transaction', 'Transaction committed successfully')
      return result
    } catch (error) {
      await session.abortTransaction()
      logError('transaction', 'Transaction aborted due to error', error)
      throw error
    } finally {
      await session.endSession()
    }
  } catch (error) {
    if (
      error.message?.includes('not supported') ||
      error.message?.includes('no primary') ||
      error.message?.includes('replica set')
    ) {
      logInfo(
        'transaction',
        'Transactions not supported, executing operations without transaction wrapper'
      )
      return await callback(null)
    }

    throw error
  }
}

/**
 * Session-aware update helper
 * Wraps Model.updateOne to automatically use session when available
 *
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} update - Update document
 * @param {Object} session - Mongoose session (null if transactions not available)
 * @returns {Promise} UpdateOne result
 */
export const updateOneWithSession = (Model, filter, update, session) => {
  return Model.updateOne(filter, update, session ? { session } : {})
}

/**
 * Session-aware delete helper
 * Wraps Model.deleteOne to automatically use session when available
 *
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} session - Mongoose session (null if transactions not available)
 * @returns {Promise} DeleteOne result
 */
export const deleteOneWithSession = (Model, filter, session) => {
  return Model.deleteOne(filter, session ? { session } : {})
}

/**
 * Session-aware create helper
 * Wraps Model.create to automatically use session when available
 *
 * @param {Model} Model - Mongoose model
 * @param {Object} data - Document data
 * @param {Object} session - Mongoose session (null if transactions not available)
 * @returns {Promise} Create result
 */
export const createWithSession = (Model, data, session) => {
  if (session) {
    const doc = new Model(data)
    return doc.save({ session })
  }
  return Model.create(data)
}
