import express from 'express';
import cors from 'cors';
import { apiLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow Vercel or local client
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply Global Rate Limiting to standard API endpoints
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 Route Not Found
app.use((req, res, next) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found.` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

export default app;
