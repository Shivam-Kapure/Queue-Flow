import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getQueueAnalytics = async (req, res) => {
  const { queueId } = req.params;

  try {
    const queue = await prisma.queue.findUnique({ where: { id: queueId } });
    if (!queue || (req.user.role !== 'ADMIN' && queue.adminId !== req.user.id)) {
      return res.status(403).json({ error: 'Unauthorized to access analytics for this queue.' });
    }

    // Retrieve daily aggregate records
    const dailyAnalytics = await prisma.analytics.findMany({
      where: { queueId },
      orderBy: { date: 'asc' },
      take: 30 // last 30 days
    });

    // Retrieve active waiting members
    const activeWaitingCount = await prisma.queueMember.count({
      where: { queueId, status: 'WAITING' }
    });

    // Retrieve total stats
    const totalServed = await prisma.queueMember.count({
      where: { queueId, status: 'SERVED' }
    });

    const totalAbandoned = await prisma.queueMember.count({
      where: { queueId, status: 'LEFT' }
    });

    // Get recent queue activity events
    const recentEvents = await prisma.queueEvent.findMany({
      where: { queueId },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    res.status(200).json({
      activeWaiting: activeWaitingCount,
      totalServed,
      totalAbandoned,
      history: dailyAnalytics,
      recentEvents
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve analytics data.' });
  }
};
