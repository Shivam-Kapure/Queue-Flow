import { PrismaClient } from '@prisma/client';
import { queueCache } from '../cache/queueCache.js';
import { broadcastQueueUpdate, broadcastUserServed } from '../socket/socketHandler.js';
import { sendEvent, isKafkaEnabled } from './kafkaService.js';

const prisma = new PrismaClient();

/**
 * Core function to serve the next user in line for a specific queue.
 * Updates cache, database membership status, logs event, updates daily analytics,
 * and broadcasts WebSocket events to connected users.
 * 
 * @param {string} queueId 
 * @returns {Promise<object|null>} The served user member details or null if empty
 */
export const processServeNext = async (queueId) => {
  const queue = await prisma.queue.findUnique({ where: { id: queueId } });
  if (!queue) return null;

  // Process from cache
  const servedMember = await queueCache.serveNext(queueId);
  if (!servedMember) return null;

  const now = new Date();

  // Find the member record in the DB
  const dbMember = await prisma.queueMember.findFirst({
    where: {
      queueId,
      userId: servedMember.id,
      status: 'WAITING'
    }
  });

  if (!dbMember) return null;

  // Update status to SERVED in database
  await prisma.queueMember.update({
    where: { id: dbMember.id },
    data: {
      status: 'SERVED',
      servedAt: now,
      position: 0
    }
  });

  // Log Event and Update Analytics (Audit & Stats)
  const eventMetadata = { userId: servedMember.id, servedAt: now, joinedAt: dbMember.joinedAt };
  if (isKafkaEnabled) {
    await sendEvent('queue-events', queueId, {
      eventType: 'SERVED',
      queueId,
      userId: servedMember.id,
      timestamp: now,
      metadata: eventMetadata
    });
  } else {
    await prisma.queueEvent.create({
      data: {
        queueId,
        eventType: 'SERVED',
        metadata: JSON.stringify(eventMetadata)
      }
    });

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
  }

  // Broadcast the served user update to that queue socket room
  broadcastUserServed(queue.slug, servedMember.id);
  
  // Broadcast updated positions to all remaining members in the room
  broadcastQueueUpdate(queue.slug);

  return servedMember;
};
