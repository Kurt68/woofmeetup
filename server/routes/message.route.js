import express from 'express'
import { verifyToken } from '../middleware/verifyToken.js'
import {
  getMessages,
  sendMessage,
  deleteMessages,
} from '../controllers/message.controller.js'

const router = express.Router()

router.get('/:id', verifyToken, getMessages)

router.post('/send/:id', verifyToken, sendMessage)

router.delete('/:id', verifyToken, deleteMessages)

export default router
