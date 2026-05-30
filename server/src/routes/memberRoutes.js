import express from 'express';
import { joinQueue, leaveQueue, getMemberStatus } from '../controllers/memberController.js';
import { verifyToken } from '../middleware/auth.js';
import { queueJoinLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/:queueId/join', verifyToken, queueJoinLimiter, joinQueue);
router.post('/:queueId/leave', verifyToken, leaveQueue);
router.get('/:queueId/status', verifyToken, getMemberStatus);

export default router;
