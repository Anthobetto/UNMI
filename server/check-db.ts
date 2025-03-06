
// Database connection check script
import { verifyDatabaseConnection } from './db';

async function checkDatabaseConnection() {
  console.log('Checking database connection...');
  try {
    const connected = await verifyDatabaseConnection();
    if (connected) {
      console.log('✅ Database connection successful!');
    } else {
      console.log('❌ Failed to connect to database');
    }
  } catch (error) {
    console.error('Error checking database connection:', error);
  }
}

checkDatabaseConnection().catch(console.error);
