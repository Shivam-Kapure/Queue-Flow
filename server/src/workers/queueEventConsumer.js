import { PrismaClient } from '@prisma/client';
import { kafka, isKafkaEnabled } from '../services/kafkaService.js';

const prisma = new PrismaClient();
let consumer = null;

if (isKafkaEnabled && kafka) {
  consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || 'queueflow-workers' });
}

/**
 * Connects, subscribes, and starts processing messages from the 'queue-events' topic.
 */
export const startConsumer = async () => {
  if (!isKafkaEnabled || !consumer) {
    console.log('Kafka: Disabled via USE_KAFKA flag. Skipping consumer setup.');
    return;
  }

  try {
    await consumer.connect();
    console.log('Kafka: Consumer connected successfully.');
    
    await consumer.subscribe({ topic: 'queue-events', fromBeginning: true });
    console.log('Kafka: Consumer subscribed to topic "queue-events".');

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const rawValue = message.value.toString();
          const event = JSON.parse(rawValue);
          const { eventType, queueId, userId, timestamp, metadata } = event;

          console.log(`Kafka Consumer: Received event [${eventType}] for Queue [${queueId}]`);

          const eventTime = new Date(timestamp || message.timestamp);

          // 1. Log the audit event to the QueueEvent table in PostgreSQL
          await prisma.queueEvent.create({
            data: {
              queueId,
              eventType,
              timestamp: eventTime,
              metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata || { userId })
            }
          });

          // 2. Perform event-specific asynchronous tasks (e.g. Analytics updates)
          if (eventType === 'SERVED') {
            await handleServedEvent(queueId, userId, eventTime, metadata);
          } else if (eventType === 'LEFT') {
            await handleLeftEvent(queueId, userId, eventTime);
          }
        } catch (error) {
          console.error('Kafka Consumer: Error processing message:', error);
        }
      }
    });
  } catch (error) {
    console.error('Kafka Consumer: Failed to start consumer:', error);
  }
};

/**
 * Disconnects the consumer from the broker.
 */
export const stopConsumer = async () => {
  if (!isKafkaEnabled || !consumer) return;
  try {
    await consumer.disconnect();
    console.log('Kafka: Consumer disconnected.');
  } catch (error) {
    console.error('Kafka: Error disconnecting consumer:', error);
  }
};

/**
 * Custom processing logic when a user is served: updates database daily analytics.
 */
const handleServedEvent = async (queueId, userId, servedAt, metadata) => {
  try {
    const joinedAtStr = metadata?.joinedAt;
    if (!joinedAtStr) {
      console.warn(`Kafka Consumer: Missing joinedAt in served metadata for User [${userId}]`);
      return;
    }

    const joinedAt = new Date(joinedAtStr);
    const waitTimeSeconds = (servedAt.getTime() - joinedAt.getTime()) / 1000;

    const startOfDay = new Date(servedAt.getFullYear(), servedAt.getMonth(), servedAt.getDate());

    // Update or create analytics record
    await prisma.$transaction(async (tx) => {
      let analyticsRecord = await tx.analytics.findFirst({
        where: {
          queueId,
          date: {
            gte: startOfDay
          }
        }
      });

      if (!analyticsRecord) {
        await tx.analytics.create({
          data: {
            queueId,
            date: servedAt,
            servedCount: 1,
            avgWaitTime: waitTimeSeconds
          }
        });
      } else {
        const newServedCount = analyticsRecord.servedCount + 1;
        const newAvgWaitTime = ((analyticsRecord.avgWaitTime * analyticsRecord.servedCount) + waitTimeSeconds) / newServedCount;

        await tx.analytics.update({
          where: { id: analyticsRecord.id },
          data: {
            servedCount: newServedCount,
            avgWaitTime: newAvgWaitTime
          }
        });
      }
    });

    console.log(`Kafka Consumer: Analytics updated for queue [${queueId}]. Served count incremented. Wait time: ${waitTimeSeconds}s.`);
  } catch (error) {
    console.error('Kafka Consumer: Error handling served event analytics:', error);
  }
};

/**
 * Custom processing logic when a user leaves the queue: updates database daily analytics.
 */
const handleLeftEvent = async (queueId, userId, leftAt) => {
  try {
    const startOfDay = new Date(leftAt.getFullYear(), leftAt.getMonth(), leftAt.getDate());

    // Increment abandoned count in daily analytics
    await prisma.$transaction(async (tx) => {
      let analyticsRecord = await tx.analytics.findFirst({
        where: {
          queueId,
          date: {
            gte: startOfDay
          }
        }
      });

      if (!analyticsRecord) {
        await tx.analytics.create({
          data: {
            queueId,
            date: leftAt,
            abandonedCount: 1,
            servedCount: 0,
            avgWaitTime: 0
          }
        });
      } else {
        await tx.analytics.update({
          where: { id: analyticsRecord.id },
          data: {
            abandonedCount: analyticsRecord.abandonedCount + 1
          }
        });
      }
    });

    console.log(`Kafka Consumer: Analytics updated for queue [${queueId}]. Abandoned count incremented.`);
  } catch (error) {
    console.error('Kafka Consumer: Error handling left event analytics:', error);
  }
};
