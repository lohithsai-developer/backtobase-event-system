import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import participantRoutes from './routes/participantRoutes';
import ticketRoutes from './routes/ticketRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import publicRoutes from './routes/publicRoutes';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { ENV } from './config/env';

export const createApp = (): Application => {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Allows flexible SPA integration
    })
  );

  // CORS Configuration
  const allowedOrigins = [
    ENV.FRONTEND_URL,
    ENV.PUBLIC_APP_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5000',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(null, true); // Permissive for easy cloud deployment testing
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // General rate limit for API endpoints
  app.use('/api', apiLimiter);

  // Health check endpoint for Render / Docker
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'BacktoBase Mega Event Backend',
      version: '1.0.0',
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/participants', participantRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/public', publicRoutes);

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
};
