import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import requestIdMiddleware from './middleware/requestId';
import mongoSanitize from './middleware/sanitize';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import courseRoutes from './routes/courseRoutes';
import batchRoutes from './routes/batchRoutes';
import testRoutes from './routes/testRoutes';
import sessionRoutes from './routes/sessionRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import announcementRoutes from './routes/announcementRoutes';
import notificationRoutes from './routes/notificationRoutes';
import planRoutes from './routes/planRoutes';
import couponRoutes from './routes/couponRoutes';
import paymentRoutes from './routes/paymentRoutes';
import certificateRoutes from './routes/certificateRoutes';
import reportRoutes from './routes/reportRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import { errorHandler } from './middleware/error';
import { AppError } from './utils/errors';

const app = express();

// 1. Global Middlewares
// Correlation ID tracking
app.use(requestIdMiddleware);

// Gzip / Deflate compression
app.use(compression());

// Security headers
app.use(helmet());

// CORS configuration (allow requests from client app, with credentials support)
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
  })
);

// Body parser, reading data from body into req.body, limit size to 10kb
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// NoSQL Injection sanitization
app.use(mongoSanitize);

// Cookie parser for reading tokens
app.use(cookieParser());

// 2. Rate Limiting
const isDev = process.env.NODE_ENV !== 'production';

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 300,
  message: 'Too many requests from this IP address. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev
});
app.use('/api', apiLimiter);

// Specific rate limiting for sensitive auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 50,
  message: 'Too many login or registration attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// 3. API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/batches', batchRoutes);
app.use('/api/v1/tests', testRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/plans', planRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Root API Welcome / Info Endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Mentorship.AI E-Learning Platform API Server',
    frontendApp: process.env.CLIENT_URL || 'http://localhost:5173',
    healthCheck: '/api/health',
    apiBaseUrl: '/api/v1',
    endpoints: {
      auth: '/api/v1/auth',
      courses: '/api/v1/courses',
      users: '/api/v1/users',
      batches: '/api/v1/batches',
      tests: '/api/v1/tests',
      sessions: '/api/v1/sessions'
    }
  });
});

// Health & System Telemetry Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    status: 'success',
    environment: process.env.NODE_ENV || 'development',
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      status: dbStatus
    },
    memory: {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
    },
    timestamp: new Date().toISOString()
  });
});

// 4. Undefined Route Handler (404)
app.all('*', (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server.`, 404));
});

// 5. Global Error Handler
app.use(errorHandler);

export default app;
