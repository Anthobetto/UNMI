import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import path from 'path';
import { setupAuth } from "./auth";
import { create_postgresql_database_tool } from "./services/database";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup auth before routes
setupAuth(app);

// Serve static files
const uploadsDir = path.join(process.cwd(), "uploads");
app.use('/uploads', express.static(uploadsDir));


(async () => {
  try {
    // Start the server first
    const PORT = process.env.PORT || 5000;
    const server = await registerRoutes(app);

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server started on port ${PORT}`);
    });

    // Set up vite in development
    if (app.get("env") === "development") {
      await setupVite(app);
    }

    // In production, serve static files
    if (app.get("env") !== "development") {
      serveStatic(app);
    }

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();