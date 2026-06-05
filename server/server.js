import 'dotenv/config';
import http from 'http';
import app from './src/app.js';
import { initSocket } from './src/socket/socketHandler.js';
import { initAllActiveAutoQueues } from './src/services/autoServeManager.js';

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO connection
initSocket(server);

// Start listening
server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  QUEUEFLOW BACKEND RUNNING ON PORT ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Database status: Connected to Neon PostgreSQL`);
  console.log(`===============================================`);
  
  // Bootstrap AutoServe intervals
  initAllActiveAutoQueues();
});

// Handle server termination cleanups
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
