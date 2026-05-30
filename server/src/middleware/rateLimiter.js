import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// In-memory rate limiting stores
const apiLimits = new Map(); // ip -> { count, startTime }
const queueJoinLimits = new Map(); // `${ip}:${queueId}` -> { count, startTime }

/**
 * Standard API Rate Limiter
 * Limits to 100 requests per 15 minutes per IP
 */
export const apiLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 100;

  let limit = apiLimits.get(ip);

  if (!limit || (now - limit.startTime) > windowMs) {
    limit = { count: 1, startTime: now };
  } else {
    limit.count += 1;
  }

  apiLimits.set(ip, limit);

  if (limit.count > maxRequests) {
    return res.status(429).json({ error: 'Too many requests, please try again later.' });
  }

  next();
};

/**
 * Queue Join Rate Limiter
 * Dynamically queries the target Queue's custom limit config and enforces it.
 */
export const queueJoinLimiter = async (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const { queueId } = req.params;
  const userId = req.user?.id;

  if (!queueId) {
    return res.status(400).json({ error: 'Queue ID is required for joining.' });
  }

  try {
    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
      select: { rateLimit: true }
    });

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found.' });
    }

    const maxJoins = queue.rateLimit || 15; // default 15 joins/min
    const windowMs = 60 * 1000; // 1 minute window
    const key = `${userId || ip}:${queueId}`;
    const now = Date.now();

    let limit = queueJoinLimits.get(key);

    if (!limit || (now - limit.startTime) > windowMs) {
      limit = { count: 1, startTime: now };
    } else {
      limit.count += 1;
    }

    queueJoinLimits.set(key, limit);

    if (limit.count > maxJoins) {
      return res.status(429).json({
        error: 'Too many join requests. Virtual waiting room is throttling entry. Please wait a minute and retry.'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
