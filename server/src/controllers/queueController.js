import { PrismaClient } from '@prisma/client';
import { queueCache } from '../cache/queueCache.js';
import { broadcastQueueUpdate, broadcastUserServed } from '../socket/socketHandler.js';

const prisma = new PrismaClient();

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 6);
};

export const createQueue = async (req, res) => {
  const { title, description, type, avgProcessingTime, rateLimit } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Queue title is required.' });
  }

  try {
    const slug = generateSlug(title);
    const queue = await prisma.queue.create({
      data: {
        title,
        description,
        type: type || 'FIFO',
        avgProcessingTime: Number(avgProcessingTime) || 60,
        rateLimit: Number(rateLimit) || 15,
        adminId: req.user.id,
        slug
      }
    });

    res.status(201).json(queue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create queue. Please try again.' });
  }
};

export const getQueues = async (req, res) => {
  try {
    const queues = await prisma.queue.findMany({
      where: req.user.role === 'ADMIN' ? { adminId: req.user.id } : { isActive: true },
      include: {
        _count: {
          select: { members: { where: { status: 'WAITING' } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(queues);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch queues.' });
  }
};

export const getQueueBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const queue = await prisma.queue.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { members: { where: { status: 'WAITING' } } }
        }
      }
    });

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found.' });
    }

    res.status(200).json(queue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve queue.' });
  }
};

export const toggleQueueActive = async (req, res) => {
  const { queueId } = req.params;
  const { isActive } = req.body;

  try {
    const queue = await prisma.queue.findUnique({ where: { id: queueId } });
    if (!queue || (req.user.role !== 'ADMIN' && queue.adminId !== req.user.id)) {
      return res.status(403).json({ error: 'Unauthorized to modify this queue.' });
    }

    const updatedQueue = await prisma.queue.update({
      where: { id: queueId },
      data: { isActive: !!isActive }
    });

    // Track status change event
    await prisma.queueEvent.create({
      data: {
        queueId,
        eventType: isActive ? 'RESUME' : 'PAUSE',
        metadata: JSON.stringify({ updatedBy: req.user.name })
      }
    });

    res.status(200).json(updatedQueue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update queue status.' });
  }
};

export const serveNext = async (req, res) => {
  const { queueId } = req.params;

  try {
    const queue = await prisma.queue.findUnique({ where: { id: queueId } });
    if (!queue || (req.user.role !== 'ADMIN' && queue.adminId !== req.user.id)) {
      return res.status(403).json({ error: 'Unauthorized to manage this queue.' });
    }

    // Process from cache
    const servedMember = await queueCache.serveNext(queueId);

    if (!servedMember) {
      return res.status(200).json({ message: 'Queue is empty. No user to serve.' });
    }

    const now = new Date();

    // Find the member record in the DB
    const dbMember = await prisma.queueMember.findFirst({
      where: {
        queueId,
        userId: servedMember.id,
        status: 'WAITING'
      }
    });

    if (!dbMember) {
      return res.status(404).json({ error: 'Member record not found in database.' });
    }

    // Update status to SERVED in database
    await prisma.queueMember.update({
      where: { id: dbMember.id },
      data: {
        status: 'SERVED',
        servedAt: now,
        position: 0 // served means no longer in waiting list
      }
    });

    // Log the event
    await prisma.queueEvent.create({
      data: {
        queueId,
        eventType: 'SERVED',
        metadata: JSON.stringify({ userId: servedMember.id, servedAt: now })
      }
    });

    // Update daily analytics
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const waitTimeSeconds = (now.getTime() - new Date(dbMember.joinedAt).getTime()) / 1000;

    let analyticsRecord = await prisma.analytics.findFirst({
      where: {
        queueId,
        date: {
          gte: startOfDay
        }
      }
    });

    if (!analyticsRecord) {
      await prisma.analytics.create({
        data: {
          queueId,
          date: now,
          servedCount: 1,
          avgWaitTime: waitTimeSeconds
        }
      });
    } else {
      const newServedCount = analyticsRecord.servedCount + 1;
      const newAvgWaitTime = ((analyticsRecord.avgWaitTime * analyticsRecord.servedCount) + waitTimeSeconds) / newServedCount;

      await prisma.analytics.update({
        where: { id: analyticsRecord.id },
        data: {
          servedCount: newServedCount,
          avgWaitTime: newAvgWaitTime
        }
      });
    }

    // Broadcast the served user update to that queue socket room
    broadcastUserServed(queue.slug, servedMember.id);
    
    // Broadcast updated positions to all remaining members in the room
    broadcastQueueUpdate(queue.slug);

    res.status(200).json({ message: 'User served successfully', user: servedMember });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to serve next user.' });
  }
};
