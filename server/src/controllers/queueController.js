import { PrismaClient } from '@prisma/client';
import { queueCache } from '../cache/queueCache.js';
import { broadcastQueueUpdate, broadcastUserServed } from '../socket/socketHandler.js';
import { processServeNext } from '../services/queueService.js';
import { startQueueInterval, stopQueueInterval } from '../services/autoServeManager.js';

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
  const { title, description, type, avgProcessingTime, rateLimit, isAutoServe, serveInterval } = req.body;

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
        isAutoServe: isAutoServe === true || isAutoServe === 'true',
        serveInterval: Number(serveInterval) || 10,
        adminId: req.user.id,
        slug
      }
    });

    if (queue.isActive && queue.isAutoServe) {
      startQueueInterval(queue.id, queue.serveInterval);
    }

    res.status(201).json(queue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create queue. Please try again.' });
  }
};

export const getQueues = async (req, res) => {
  try {
    const includeQuery = {
      _count: {
        select: { members: { where: { status: 'WAITING' } } }
      }
    };

    if (req.user.role === 'ADMIN') {
      includeQuery.members = {
        where: { status: 'WAITING' },
        orderBy: { position: 'asc' },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      };
    }

    const queues = await prisma.queue.findMany({
      where: req.user.role === 'ADMIN' ? { adminId: req.user.id } : { isActive: true },
      include: includeQuery,
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

    // Handle Auto-Serve scheduler interval
    if (updatedQueue.isActive && updatedQueue.isAutoServe) {
      startQueueInterval(updatedQueue.id, updatedQueue.serveInterval);
    } else {
      stopQueueInterval(updatedQueue.id);
    }

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

    // Process using core queue service
    const servedMember = await processServeNext(queueId);

    if (!servedMember) {
      return res.status(200).json({ message: 'Queue is empty. No user to serve.' });
    }

    res.status(200).json({ message: 'User served successfully', user: servedMember });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to serve next user.' });
  }
};

export const updateQueueSettings = async (req, res) => {
  const { queueId } = req.params;
  const { isAutoServe, serveInterval, title, description, type, avgProcessingTime, rateLimit } = req.body;

  try {
    const queue = await prisma.queue.findUnique({ where: { id: queueId } });
    if (!queue || (req.user.role !== 'ADMIN' && queue.adminId !== req.user.id)) {
      return res.status(403).json({ error: 'Unauthorized to modify this queue.' });
    }

    const updatedQueue = await prisma.queue.update({
      where: { id: queueId },
      data: {
        title: title !== undefined ? title : queue.title,
        description: description !== undefined ? description : queue.description,
        type: type !== undefined ? type : queue.type,
        avgProcessingTime: avgProcessingTime !== undefined ? Number(avgProcessingTime) : queue.avgProcessingTime,
        rateLimit: rateLimit !== undefined ? Number(rateLimit) : queue.rateLimit,
        isAutoServe: isAutoServe !== undefined ? !!isAutoServe : queue.isAutoServe,
        serveInterval: serveInterval !== undefined ? Number(serveInterval) : queue.serveInterval
      }
    });

    // Update AutoServe scheduler accordingly
    if (updatedQueue.isActive && updatedQueue.isAutoServe) {
      startQueueInterval(updatedQueue.id, updatedQueue.serveInterval);
    } else {
      stopQueueInterval(updatedQueue.id);
    }

    res.status(200).json(updatedQueue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update queue settings.' });
  }
};
