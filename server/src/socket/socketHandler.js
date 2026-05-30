import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { queueCache } from '../cache/queueCache.js';

const prisma = new PrismaClient();
let io;

/**
 * Initializes the Socket.IO server.
 * @param {Object} server - HTTP Server instance
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow connections from Vite client
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join a specific queue room
    socket.on('join_queue_room', async ({ queueSlug }) => {
      if (!queueSlug) return;
      socket.join(queueSlug);
      console.log(`Socket ${socket.id} joined room: ${queueSlug}`);

      // Push initial queue size / status
      try {
        const queue = await prisma.queue.findUnique({
          where: { slug: queueSlug }
        });
        if (queue) {
          const cache = await queueCache.getOrCreate(queue.id);
          socket.emit('queue_initial_state', {
            queueId: queue.id,
            activeCount: cache ? cache.members.length : 0,
            type: queue.type,
            isActive: queue.isActive
          });
        }
      } catch (error) {
        console.error('Socket error fetching initial state:', error);
      }
    });

    // Leave a specific queue room
    socket.on('leave_queue_room', ({ queueSlug }) => {
      if (!queueSlug) return;
      socket.leave(queueSlug);
      console.log(`Socket ${socket.id} left room: ${queueSlug}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Broadcasts position updates to all users in a specific queue's room.
 * @param {string} queueSlug
 */
export const broadcastQueueUpdate = async (queueSlug) => {
  if (!io || !queueSlug) return;

  try {
    const queue = await prisma.queue.findUnique({
      where: { slug: queueSlug },
      include: {
        members: {
          where: { status: 'WAITING' },
          orderBy: { joinedAt: 'asc' }
        }
      }
    });

    if (!queue) return;

    // Refresh memory cache
    const cache = await queueCache.getOrCreate(queue.id);
    const activeCount = cache ? cache.members.length : 0;

    // Emit broad update
    io.to(queueSlug).emit('queue_tick', {
      queueId: queue.id,
      activeCount,
      isActive: queue.isActive
    });
  } catch (error) {
    console.error(`Socket broadcast error for queue ${queueSlug}:`, error);
  }
};

/**
 * Broadcasts an alert to the specific user who was just served.
 * @param {string} queueSlug
 * @param {string} userId
 */
export const broadcastUserServed = (queueSlug, userId) => {
  if (!io || !queueSlug || !userId) return;
  // Send target update so the individual client tab pops up the "Access Granted" screen
  io.to(queueSlug).emit('user_served', { userId });
};
