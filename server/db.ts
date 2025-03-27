import pg from 'pg';
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create PostgreSQL pool
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20
});

// Create drizzle database instance
export const db = drizzle(pool, { schema });

// Helper function for database connection verification
export async function verifyDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Successfully connected to database');
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
}