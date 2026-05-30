import express from 'express';
import { createQueue, getQueues, getQueueBySlug, toggleQueueActive, serveNext } from '../controllers/queueController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', verifyToken, requireRole(['ADMIN', 'MODERATOR']), createQueue);
router.get('/', verifyToken, getQueues);
router.get('/slug/:slug', getQueueBySlug);
router.patch('/:queueId/toggle', verifyToken, requireRole(['ADMIN', 'MODERATOR']), toggleQueueActive);
router.post('/:queueId/serve', verifyToken, requireRole(['ADMIN', 'MODERATOR']), serveNext);

export default router;
