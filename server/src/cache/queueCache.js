import { createQueue, joinQueue, leaveQueue, nextUser, getPosition, estimateWaitTime } from 'queueflow-core';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class QueueCache {
  constructor() {
    this.queues = new Map(); // queueId -> core queue configuration
  }

  /**
   * Retrieves an active queue from memory, or loads it from Neon DB if not cached.
   */
  async getOrCreate(queueId) {
    if (this.queues.has(queueId)) {
      return this.queues.get(queueId);
    }

    const dbQueue = await prisma.queue.findUnique({
      where: { id: queueId },
      include: {
        members: {
          where: { status: 'WAITING' },
          orderBy: [
            { joinedAt: 'asc' }
          ]
        }
      }
    });

    if (!dbQueue) return null;

    // Build the core engine queue instance
    const coreQueue = createQueue({
      type: dbQueue.type,
      name: dbQueue.title,
      avgProcessingTime: dbQueue.avgProcessingTime
    });

    // Populate active members from database
    for (const member of dbQueue.members) {
      joinQueue(coreQueue, { id: member.userId, name: member.id }, {
        priority: member.priorityScore,
        isVip: member.isVip
      });
      // Synchronize the joinedAt timestamp to preserve database order
      const coreMember = coreQueue.members.find(m => m.id === member.userId);
      if (coreMember) {
        coreMember.joinedAt = new Date(member.joinedAt).getTime();
      }
    }

    // Sort again if PRIORITY mode to ensure database timestamp joins are aligned
    if (dbQueue.type === 'PRIORITY') {
      coreQueue.members.sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.joinedAt - b.joinedAt;
      });
    }

    this.queues.set(queueId, coreQueue);
    return coreQueue;
  }

  /**
   * Adds a member to the queue in memory and db.
   */
  async join(queueId, user, options = {}) {
    const queue = await this.getOrCreate(queueId);
    if (!queue) return null;

    // Add to core engine
    joinQueue(queue, user, options);

    // Sync database positions
    await this.syncPositionsToDb(queueId, queue.members);

    return queue;
  }

  /**
   * Removes a member (e.g. user leaves) from queue.
   */
  async leave(queueId, userId) {
    const queue = await this.getOrCreate(queueId);
    if (!queue) return null;

    leaveQueue(queue, userId);

    // Sync database positions
    await this.syncPositionsToDb(queueId, queue.members);

    return queue;
  }

  /**
   * Serves the next user in line.
   */
  async serveNext(queueId) {
    const queue = await this.getOrCreate(queueId);
    if (!queue) return null;

    const servedUser = nextUser(queue);
    if (!servedUser) return null;

    // Sync positions for remaining members in DB
    await this.syncPositionsToDb(queueId, queue.members);

    return servedUser;
  }

  /**
   * Retrieves the 1-based position of a user.
   */
  async getMemberPosition(queueId, userId) {
    const queue = await this.getOrCreate(queueId);
    if (!queue) return -1;
    return getPosition(queue, userId);
  }

  /**
   * Recalculates and updates the index positions of all active members in the database.
   */
  async syncPositionsToDb(queueId, members) {
    const updatePromises = members.map((member, index) => {
      return prisma.queueMember.updateMany({
        where: {
          queueId,
          userId: member.id,
          status: 'WAITING'
        },
        data: {
          position: index + 1
        }
      });
    });

    await Promise.all(updatePromises);
  }

  /**
   * Forces a reload from the database (useful when queue is reset/purged).
   */
  invalidate(queueId) {
    this.queues.delete(queueId);
  }
}

export const queueCache = new QueueCache();
