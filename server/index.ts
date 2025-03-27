import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import path from 'path';
import { db } from "./services/db";

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

// Serve static files
const uploadsDir = path.join(process.cwd(), "uploads");
app.use('/uploads', express.static(uploadsDir));

// Add test endpoint for database connection
app.get('/api/db-test', async (req, res) => {
  try {
    // Test query to verify database connection
    const result = await db.query.users.findMany();
    res.json({ success: true, count: result.length });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
});

(async () => {
  try {
    // Start the server first
    const PORT = process.env.PORT || 5000;
    const server = await registerRoutes(app);

    server.listen(PORT, () => {
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