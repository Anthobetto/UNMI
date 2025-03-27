import { createClient } from '@supabase/supabase-js';
import type { Database } from '@shared/types/supabase';
import { db } from './db';
import 'cross-fetch';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL) {
  console.warn('Missing Supabase URL, some features may be limited');
}

// Initialize with minimal config for auth only
export const supabase = createClient(
  SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Export database service
export { db };