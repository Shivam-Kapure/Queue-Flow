import express from 'express';
import { getQueueAnalytics } from '../controllers/analyticsController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/:queueId', verifyToken, getQueueAnalytics);

export default router;
