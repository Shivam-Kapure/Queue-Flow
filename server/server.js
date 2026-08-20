import 'dotenv/config';
import http from 'http';
import app from './src/app.js';
import { initSocket } from './src/socket/socketHandler.js';
import { initAllActiveAutoQueues } from './src/services/autoServeManager.js';
import { connectProducer, disconnectProducer } from './src/services/kafkaService.js';
import { startConsumer, stopConsumer } from './src/workers/queueEventConsumer.js';

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO connection
initSocket(server);

// Start listening
server.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`  QUEUEFLOW BACKEND RUNNING ON PORT ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Database status: Connected to Neon PostgreSQL`);
  console.log(`===============================================`);
  
  // Initialize Kafka connections if enabled
  await connectProducer();
  await startConsumer();
  
  // Bootstrap AutoServe intervals
  initAllActiveAutoQueues();
});

// Handle server termination cleanups
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await stopConsumer();
  await disconnectProducer();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

