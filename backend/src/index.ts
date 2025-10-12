// Main Server Entry Point
// Configuración completa del servidor Express con SOLID principles

import dotenv from 'dotenv';
dotenv.config();

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';

// Routes
import authRoutes from './routes/auth.routes';
import apiRoutes from './routes/api.routes';
import webhookRoutes from './routes/webhook.routes';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app: Express = express();
const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ==================
// SECURITY MIDDLEWARE
// ==================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ==================
// WEBHOOK ROUTES (BEFORE JSON PARSER)
// ==================
// Stripe webhooks necesitan raw body
app.use('/api/webhooks', webhookRoutes);

// ==================
// BODY PARSERS
// ==================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ==================
// REQUEST LOGGING
// ==================
app.use((req, res, next) => {
  const start = Date.now();
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      let logLine = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
      
      if (capturedJsonResponse) {
        const sanitized = { ...capturedJsonResponse };
        delete sanitized.password;
        delete sanitized.token;
        delete sanitized.accessToken;
        delete sanitized.refreshToken;
        
        const jsonStr = JSON.stringify(sanitized);
        logLine += ` :: ${jsonStr.length > 100 ? jsonStr.slice(0, 97) + '...' : jsonStr}`;
      }
      
      console.log(logLine);
    }
  });

  next();
});

// ==================
// HEALTH CHECK
// ==================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ==================
// API ROUTES
// ==================
app.use('/api', authRoutes);
app.use('/api', apiRoutes);

// ==================
// ERROR HANDLING
// ==================
app.use(notFoundHandler);
app.use(errorHandler);

// ==================
// SERVER STARTUP
// ==================
const server = createServer(app);

server.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║   🚀 UNMI Backend Server Started     ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║   Port:        ${PORT.toString().padEnd(24)}║`);
  console.log(`║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(24)}║`);
  console.log(`║   Frontend:    ${FRONTEND_URL.slice(0, 24).padEnd(24)}║`);
  console.log('╠════════════════════════════════════════╣');
  console.log('║   Routes:                             ║');
  console.log('║   GET  /health                        ║');
  console.log('║   POST /api/register                  ║');
  console.log('║   POST /api/login                     ║');
  console.log('║   POST /api/logout                    ║');
  console.log('║   GET  /api/user                      ║');
  console.log('║   GET  /api/locations                 ║');
  console.log('║   GET  /api/templates                 ║');
  console.log('║   GET  /api/calls                     ║');
  console.log('║   GET  /api/messages                  ║');
  console.log('║   POST /api/webhooks/stripe           ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
});

// ==================
// GRACEFUL SHUTDOWN
// ==================
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// ==================
// UNHANDLED ERRORS
// ==================
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;


