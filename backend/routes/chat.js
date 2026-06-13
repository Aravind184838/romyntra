import express from 'express';
import { getMessages, sendMessage, markAsRead, getConversations, toggleAiReply } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getConversations);
router.get('/:matchId', getMessages);
router.post('/:matchId', sendMessage);
router.put('/:matchId/read', markAsRead);
router.put('/:matchId/ai-toggle', toggleAiReply);

export default router;
