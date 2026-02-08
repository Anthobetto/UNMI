import dotenv from 'dotenv';
dotenv.config();

import express, { Express } from 'express';
import path, { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';

import authRoutes from './routes/auth.routes';
import apiRoutes from './routes/api.routes';
import webhookRoutes from './routes/webhook.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app: Express = express();
const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FRONTEND_DIST_PATH = join(__dirname, '../../frontend/dist');

// ==========================================
// 1. SEGURIDAD
// ==========================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
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
// 2. PARSEO DEL BODY (Orden Crítico)
// ==========================================

// 🚨 1. STRIPE: RAW BUFFER
// Definimos esto PRIMERO y ESPECÍFICAMENTE para la ruta de Stripe.
// Usamos type: '*/*' para forzar que CUALQUIER cosa que llegue a esta URL
// se convierta en un Buffer (req.body será un Buffer).
app.use(
  '/api/webhooks/stripe', 
  express.raw({ type: '*/*' }) 
);

// 🚨 2. JSON GLOBAL
// Esto aplicará para todas las rutas que NO sean la de arriba
// (o si la de arriba pasa el control, pero como express.raw consume el stream, es seguro).
app.use(express.json({ limit: '10mb' }));

// 🚨 3. URL ENCODED
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// ==========================================
// 3. RUTAS
// ==========================================

// Webhooks
app.use('/api/webhooks', webhookRoutes);

// Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  let capturedJsonResponse: Record<string, any> | undefined;

  // Solo interceptamos la respuesta JSON si NO es un webhook
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
        logLine += ` :: ${jsonStr.length > 100 ? jsonStr.slice(0, 97) + '...' : jsonStr}`;
      }
      console.log(logLine);
    }
  });
  next();
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api', authRoutes);
app.use('/api', apiRoutes);

// ==========================================
// 4. FRONTEND STATIC
// ==========================================
app.use(express.static(FRONTEND_DIST_PATH));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return;
  res.sendFile(join(FRONTEND_DIST_PATH, 'index.html'));
});

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// ==========================================
// 5. SERVER START
// ==========================================
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`👉 Webhook endpoint: POST /api/webhooks/stripe`);
});

process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
process.on('SIGINT', () => { server.close(() => process.exit(0)); });

export default app;