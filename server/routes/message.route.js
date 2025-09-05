import express from 'express'
import { verifyToken } from '../middleware/verifyToken.js'
import { getMessages, sendMessage } from '../controllers/message.controller.js'

const router = express.Router()

router.get('/:id', verifyToken, getMessages)

router.post('/send/:id', verifyToken, sendMessage)

export default router
