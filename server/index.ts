import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import path from 'path';
import { verifyDatabaseConnection, seedMockData } from "./services/supabase";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files
const uploadsDir = path.join(process.cwd(), "uploads");
app.use('/uploads', express.static(uploadsDir));

// Add test endpoint for seeding
app.get('/api/test-seed', async (req, res) => {
  try {
    const isSeeded = await seedMockData();
    res.json({ success: isSeeded });
  } catch (error) {
    console.error('Error in test seeding:', error);
    res.status(500).json({ success: false, error: 'Failed to seed test data' });
  }
});

(async () => {
  try {
    // Start the server first
    const PORT = process.env.PORT || 5000;
    const server = await registerRoutes(app);

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server started on port ${PORT}`);
    });

    // Initialize database and seed data
    console.log('Verifying database connection...');
    const isDbConnected = await verifyDatabaseConnection();

    if (!isDbConnected) {
      console.log('WARNING: Database connection failed, continuing without data persistence');
    } else {
      console.log('Seeding mock data...');
      try {
        const isDataSeeded = await seedMockData();
        if (!isDataSeeded) {
          console.log('WARNING: Failed to seed mock data, continuing with empty database');
        } else {
          console.log('Database setup completed successfully');
        }
      } catch (error) {
        console.error('Error during mock data seeding:', error);
        console.log('WARNING: Failed to seed mock data, continuing with empty database');
      }
    }

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