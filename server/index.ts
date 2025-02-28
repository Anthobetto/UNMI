import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import path from 'path';
import { verifyDatabaseConnection, initializeDatabaseSchema, seedMockData } from "./services/supabase";

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
      console.log('Database connection failed');
      process.exit(1);
    }

    console.log('Initializing database schema...');
    const isSchemaInitialized = await initializeDatabaseSchema();

    if (!isSchemaInitialized) {
      console.log('Failed to initialize database schema');
      process.exit(1);
    }

    console.log('Seeding mock data...');
    const isDataSeeded = await seedMockData();

    if (!isDataSeeded) {
      console.log('Failed to seed mock data');
      process.exit(1);
    }

    console.log('Database setup completed successfully');

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