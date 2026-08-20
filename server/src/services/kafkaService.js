import { Kafka } from 'kafkajs';

const isKafkaEnabled = process.env.USE_KAFKA === 'true';

let kafka = null;
let producer = null;

if (isKafkaEnabled) {
  const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];
  kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'queueflow',
    brokers: brokers
  });
  producer = kafka.producer();
}

/**
 * Connects the Kafka producer if Kafka is enabled.
 */
export const connectProducer = async () => {
  if (!isKafkaEnabled) {
    console.log('Kafka: Disabled via USE_KAFKA flag. Skipping producer connection.');
    return;
  }
  try {
    await producer.connect();
    console.log('Kafka: Producer connected successfully.');
  } catch (error) {
    console.error('Kafka: Failed to connect producer:', error);
  }
};

/**
 * Disconnects the Kafka producer if connected.
 */
export const disconnectProducer = async () => {
  if (!isKafkaEnabled || !producer) return;
  try {
    await producer.disconnect();
    console.log('Kafka: Producer disconnected.');
  } catch (error) {
    console.error('Kafka: Error disconnecting producer:', error);
  }
};

/**
 * Publishes an event to a Kafka topic.
 * 
 * @param {string} topic Topic to publish to
 * @param {string|number} key Routing key (typically queueId or userId)
 * @param {object} payload JSON serializable payload
 * @returns {Promise<boolean>} True if sent successfully, false otherwise
 */
export const sendEvent = async (topic, key, payload) => {
  if (!isKafkaEnabled || !producer) {
    return false;
  }
  try {
    await producer.send({
      topic,
      messages: [
        {
          key: String(key),
          value: JSON.stringify(payload)
        }
      ]
    });
    return true;
  } catch (error) {
    console.error(`Kafka: Failed to send event to topic ${topic}:`, error);
    return false;
  }
};

export { kafka, isKafkaEnabled };
