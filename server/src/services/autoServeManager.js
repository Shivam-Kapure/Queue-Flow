import { PrismaClient } from '@prisma/client';
import { processServeNext } from './queueService.js';

const prisma = new PrismaClient();
const activeIntervals = new Map();

/**
 * Starts an auto-serve interval for a specific queue.
 * Admitted users are processed at the designated frequency.
 * 
 * @param {string} queueId 
 * @param {number} intervalSeconds 
 */
export const startQueueInterval = (queueId, intervalSeconds) => {
  // Clear any existing scheduler interval first
  stopQueueInterval(queueId);

  if (!intervalSeconds || intervalSeconds <= 0) return;

  const intervalMs = intervalSeconds * 1000;

  const intervalId = setInterval(async () => {
    try {
      // Check if queue is still active and exists
      const queue = await prisma.queue.findUnique({ where: { id: queueId } });
      if (!queue || !queue.isActive || !queue.isAutoServe) {
        // Stop interval if the queue was deactivated or configuration changed
        stopQueueInterval(queueId);
        return;
      }

      await processServeNext(queueId);
    } catch (error) {
      console.error(`Error in AutoServe scheduling tick for queue ${queueId}:`, error);
    }
  }, intervalMs);

  activeIntervals.set(queueId, intervalId);
  console.log(`[AutoServeManager] Started scheduler for queue ${queueId} (every ${intervalSeconds}s)`);
};

/**
 * Stops any active auto-serve interval for a specific queue.
 * 
 * @param {string} queueId 
 */
export const stopQueueInterval = (queueId) => {
  if (activeIntervals.has(queueId)) {
    clearInterval(activeIntervals.get(queueId));
    activeIntervals.delete(queueId);
    console.log(`[AutoServeManager] Stopped scheduler for queue ${queueId}`);
  }
};

/**
 * Bootstraps all active queues configured for Auto-Serve on application startup.
 */
export const initAllActiveAutoQueues = async () => {
  try {
    const activeAutoQueues = await prisma.queue.findMany({
      where: {
        isActive: true,
        isAutoServe: true
      }
    });

    console.log(`[AutoServeManager] Bootstrapping scheduler: found ${activeAutoQueues.length} active auto-serve queues.`);
    for (const queue of activeAutoQueues) {
      startQueueInterval(queue.id, queue.serveInterval);
    }
  } catch (error) {
    console.error('[AutoServeManager] Failed to bootstrap active auto-serve queues:', error);
  }
};
