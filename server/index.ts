import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from 'path';
import fs from 'fs';
import { setupAuth } from "./auth";
import { verifyDatabaseConnection, seedMockData } from "./services/supabase";

const app = express();

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

(async () => {
  try {
    // Set up authentication before registering routes
    setupAuth(app);

    // Set up vite in development
    if (app.get("env") === "development") {
      setupVite(app, path.join(process.cwd(), 'client'));
    }

    // Register routes and get HTTP server
    const server = await registerRoutes(app);

    // Enhanced error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Send error response
      res.status(status).json({ 
        message,
        error: app.get('env') === 'development' ? err : {}
      });
    });

    // In production, serve static files
    if (app.get("env") !== "development") {
      serveStatic(app);
    }

    // Start the server first
    const PORT = process.env.PORT || 5000;
    await new Promise<void>((resolve) => {
      server.listen(PORT, () => {
        log(`Server started on port ${PORT}`);
        resolve();
      });
    });

    // After server is started, verify database connection
    log('Verifying database connection...');
    try {
      const isDbConnected = await verifyDatabaseConnection();
      if (!isDbConnected) {
        log('WARNING: Database connection failed, running in mock mode');
      } else {
        log('Database connection verified successfully');
      }
    } catch (error) {
      console.error('Database connection error:', error);
      log('WARNING: Database connection failed, running in mock mode');
    }

    // Seed mock data in the background
    if (app.get("env") === "development") {
      log('Starting mock data seeding in the background...');
      seedMockData().then(() => {
        log('Mock data seeded successfully');
      }).catch((error) => {
        console.error('Failed to seed mock data:', error);
      });
    }

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();