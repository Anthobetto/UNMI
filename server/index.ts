import express from "express";
import { pool } from "./db";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic health check endpoint - with improved error handling
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1'); //retained database check here for more comprehensive health check.
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});


(async () => {
  try {
    console.log('Starting server initialization...');

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