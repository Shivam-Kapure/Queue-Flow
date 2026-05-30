import { PrismaClient } from '@prisma/client';
import { queueCache } from '../cache/queueCache.js';
import { broadcastQueueUpdate } from '../socket/socketHandler.js';
import { estimateWaitTime } from 'queueflow-core';

const prisma = new PrismaClient();

export const joinQueue = async (req, res) => {
  const { queueId } = req.params;
  const { priority, vipPasscode } = req.body;
  const userId = req.user.id;

  try {
    const queue = await prisma.queue.findUnique({ where: { id: queueId } });
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found.' });
    }

    if (!queue.isActive) {
      return res.status(400).json({ error: 'This waiting room is currently paused by the administrator.' });
    }

    // Check if already in queue
    const existingMember = await prisma.queueMember.findFirst({
      where: {
        queueId,
        userId,
        status: 'WAITING'
      }
    });

    if (existingMember) {
      const position = await queueCache.getMemberPosition(queueId, userId);
      const estTime = estimateWaitTime({ avgProcessingTime: queue.avgProcessingTime }, position);
      return res.status(200).json({
        message: 'Already in queue',
        member: existingMember,
        position,
        estimatedWaitTime: estTime
      });
    }

    // Verify VIP passcode if it's a VIP queue
    let isVip = false;
    if (queue.type === 'VIP') {
      if (!vipPasscode || vipPasscode !== 'VIPFLOW') { // demo password
        return res.status(403).json({ error: 'Invalid VIP passcode.' });
      }
      isVip = true;
    }

    // Get current waiting members count to set preliminary position
    const waitingCount = await prisma.queueMember.count({
      where: { queueId, status: 'WAITING' }
    });

    // Create database member record
    const member = await prisma.queueMember.create({
      data: {
        queueId,
        userId,
        position: waitingCount + 1,
        priorityScore: queue.type === 'PRIORITY' ? (Number(priority) || 0) : 0,
        isVip
      }
    });

    // Sync memory cache
    await queueCache.join(queueId, { id: userId, name: req.user.name }, {
      priority: member.priorityScore,
      isVip
    });

    // Log Event
    await prisma.queueEvent.create({
      data: {
        queueId,
        eventType: 'JOIN',
        metadata: JSON.stringify({ userId, isVip, priorityScore: member.priorityScore })
      }
    });

    // Fetch refreshed position from cache
    const position = await queueCache.getMemberPosition(queueId, userId);
    const estTime = estimateWaitTime({ avgProcessingTime: queue.avgProcessingTime }, position);

    // Broadcast position updates to all users in the socket room
    broadcastQueueUpdate(queue.slug);

    res.status(201).json({
      message: 'Joined queue successfully',
      member,
      position,
      estimatedWaitTime: estTime
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to join queue.' });
  }
};

export const leaveQueue = async (req, res) => {
  const { queueId } = req.params;
  const userId = req.user.id;

  try {
    const queue = await prisma.queue.findUnique({ where: { id: queueId } });
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found.' });
    }

    const member = await prisma.queueMember.findFirst({
      where: {
        queueId,
        userId,
        status: 'WAITING'
      }
    });

    if (!member) {
      return res.status(400).json({ error: 'You are not currently active in this queue.' });
    }

    // Update database status
    await prisma.queueMember.update({
      where: { id: member.id },
      data: {
        status: 'LEFT',
        leftAt: new Date(),
        position: 0
      }
    });

    // Sync memory cache
    await queueCache.leave(queueId, userId);

    // Log Event
    await prisma.queueEvent.create({
      data: {
        queueId,
        eventType: 'LEFT',
        metadata: JSON.stringify({ userId, leftAt: new Date() })
      }
    });

    // Update daily analytics (increment abandoned count)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let analyticsRecord = await prisma.analytics.findFirst({
      where: {
        queueId,
        date: { gte: startOfDay }
      }
    });

    if (!analyticsRecord) {
      await prisma.analytics.create({
        data: {
          queueId,
          date: now,
          abandonedCount: 1
        }
      });
    } else {
      await prisma.analytics.update({
        where: { id: analyticsRecord.id },
        data: {
          abandonedCount: analyticsRecord.abandonedCount + 1
        }
      });
    }

    // Broadcast updated positions to all remaining members
    broadcastQueueUpdate(queue.slug);

    res.status(200).json({ message: 'Successfully left the queue.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process leave request.' });
  }
};

export const getMemberStatus = async (req, res) => {
  const { queueId } = req.params;
  const userId = req.user.id;

  try {
    const queue = await prisma.queue.findUnique({ where: { id: queueId } });
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found.' });
    }

    const position = await queueCache.getMemberPosition(queueId, userId);
    
    if (position === -1) {
      // Not active in queue, let's see if served recently
      const lastSession = await prisma.queueMember.findFirst({
        where: { queueId, userId },
        orderBy: { joinedAt: 'desc' }
      });

      return res.status(200).json({
        inQueue: false,
        lastStatus: lastSession ? lastSession.status : null,
        servedAt: lastSession ? lastSession.servedAt : null
      });
    }

    const estTime = estimateWaitTime({ avgProcessingTime: queue.avgProcessingTime }, position);

    res.status(200).json({
      inQueue: true,
      position,
      estimatedWaitTime: estTime,
      avgProcessingTime: queue.avgProcessingTime
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch member status.' });
  }
};
