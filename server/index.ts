import express from "express";
import { setupAuth } from "./auth";
import { verifyDatabaseConnection } from "./db";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  try {
    console.log('Starting server initialization...');

    // Test database connection
    const dbConnected = await verifyDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    console.log('Database connection successful');

    // Setup authentication after DB is verified
    await setupAuth(app);
    console.log('Authentication setup completed');

    const PORT = process.env.PORT || 5000;
    app.listen(parseInt(PORT.toString()), '0.0.0.0', () => {
      console.log(`Server started successfully on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();