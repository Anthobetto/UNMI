import { createClient } from '@supabase/supabase-js';
import type { Database } from '@shared/types/supabase';
import { db } from './db';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL) {
  console.warn('Missing Supabase URL. Please set SUPABASE_URL or VITE_SUPABASE_URL environment variable.');
}

if (!SUPABASE_SERVICE_KEY) {
  console.warn('Missing Supabase service key. Please set SUPABASE_SERVICE_KEY environment variable.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  'https://cqkqfugenstkgwwvbwxx.supabase.co',
  SUPABASE_SERVICE_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Helper function to verify database connection
export async function verifyDatabaseConnection() {
  try {
    console.log('Attempting to connect to Supabase database...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .single();

    if (error) {
      console.warn('Supabase connection failed:', error.message);
      return false;
    }

    console.log('Successfully connected to Supabase database');
    return true;
  } catch (error) {
    console.warn('Database connection error:', error);
    return false;
  }
}

// Helper function to seed mock data in batches
export async function seedMockData() {
  try {
    console.log('Starting to seed mock data...');

    // Insert mock calls in smaller batches
    const totalCalls = 128;
    const batchSize = 10;
    const batches = Math.ceil(totalCalls / batchSize);

    for (let i = 0; i < batches; i++) {
      const size = Math.min(batchSize, totalCalls - i * batchSize);
      const mockCalls = Array.from({ length: size }, () => ({
        user_id: 1,
        phone_number_id: 3, // Using the known phone number ID
        caller_number: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        status: ['answered', 'missed', 'busy'][Math.floor(Math.random() * 3)],
        duration: Math.floor(Math.random() * 300),
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        call_type: ['direct', 'forwarded', 'ivr'][Math.floor(Math.random() * 3)]
      }));

      try {
        const { error } = await supabase.from('calls').insert(mockCalls);
        if (error) throw error;
        console.log(`Seeded calls batch ${i + 1} of ${batches}`);
      } catch (error: any) {
        console.error(`Error seeding calls batch ${i + 1}:`, error.message);
        continue;
      }
    }

    // Insert mock messages in batches
    const totalMessages = 63;
    const messageBatches = Math.ceil(totalMessages / batchSize);

    for (let i = 0; i < messageBatches; i++) {
      const size = Math.min(batchSize, totalMessages - i * batchSize);
      const mockMessages = Array.from({ length: size }, () => ({
        user_id: 1,
        phone_number_id: 3, // Using the known phone number ID
        type: Math.random() > 0.5 ? 'SMS' : 'WhatsApp',
        content: `Sample message ${i * batchSize + 1} - ${Math.random().toString(36).substring(7)}`,
        recipient: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        status: ['pending', 'sent', 'delivered', 'failed'][Math.floor(Math.random() * 4)],
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }));

      try {
        const { error } = await supabase.from('messages').insert(mockMessages);
        if (error) throw error;
        console.log(`Seeded messages batch ${i + 1} of ${messageBatches}`);
      } catch (error: any) {
        console.error(`Error seeding messages batch ${i + 1}:`, error.message);
        continue;
      }
    }

    console.log('Successfully seeded mock data');
    return true;
  } catch (error) {
    console.error('Error seeding mock data:', error);
    return false;
  }
}

export { db };