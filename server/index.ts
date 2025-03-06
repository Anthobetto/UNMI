import express from "express";
import { setupAuth } from "./auth";
import { verifyDatabaseConnection } from "./db";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await verifyDatabaseConnection();
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Service check failed'
    });
  }
});

(async () => {
  try {
    console.log('Starting server initialization...');

    // Setup authentication with enhanced error handling
    console.log('Setting up authentication...');
    setupAuth(app);
    console.log('Authentication setup completed');

    const PORT = process.env.PORT || 5000;
    app.listen(parseInt(PORT.toString()), '0.0.0.0', () => {
      console.log(`Server started successfully on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
})();