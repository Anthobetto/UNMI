import dotenv from 'dotenv';
dotenv.config();

import express, { Express } from 'express';
import path, { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';

// RUTAS
import authRoutes from './routes/auth.routes';
import apiRoutes from './routes/api.routes';
import paymentRoutes from './routes/payment.routes'; 
import webhookRoutes from './routes/webhook.routes';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app: Express = express();
const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FRONTEND_DIST_PATH = join(__dirname, '../../frontend/dist'); 

// ==========================================
// 1. SEGURIDAD & CONFIGURACIÓN BÁSICA
// ==========================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", "https://api.stripe.com"] 
      },
    },
  })
);

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(cookieParser());

// ==========================================
// 2. LOGGING 
// ==========================================
app.use((req, res, next) => {
  const start = Date.now();
  let capturedJsonResponse: Record<string, any> | undefined;

  if (!req.path.includes('webhooks')) {
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      let logLine = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
      
      if (req.path.includes('webhooks')) {
        logLine += ` (Webhook Payload Hidden)`;
      } else if (capturedJsonResponse) {
        const sanitized = { ...capturedJsonResponse };
        delete sanitized.password; 
        delete sanitized.token;
        const jsonStr = JSON.stringify(sanitized);
        // Limitamos el log para no saturar la consola
        logLine += ` :: ${jsonStr.length > 200 ? jsonStr.slice(0, 197) + '...' : jsonStr}`;
      }
      console.log(logLine);
    }
  });
  next();
});

// ==========================================
// 3. PARSEO DEL BODY (Orden Crítico)
// ==========================================


app.use(
  '/api/webhooks/stripe', 
  express.raw({ type: '*/*' }) 
);


app.use(express.json({ limit: '10mb' }));


app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// ==========================================
// 4. RUTAS (MOUNTING)
// ==========================================

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

app.use('/api/webhooks', webhookRoutes);

app.use('/api/payments', paymentRoutes); 

app.use('/api', authRoutes);
app.use('/api', apiRoutes);


// ==========================================
// 5. FRONTEND STATIC & ERROR HANDLING
// ==========================================

app.use(express.static(FRONTEND_DIST_PATH));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return; 
  res.sendFile(join(FRONTEND_DIST_PATH, 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

// ==========================================
// 6. SERVER START
// ==========================================
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`👉 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`👉 Frontend URL: ${FRONTEND_URL}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
process.on('SIGINT', () => { server.close(() => process.exit(0)); });

export default app;