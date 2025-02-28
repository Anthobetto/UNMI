import { createClient } from '@supabase/supabase-js';
import type { Database } from '@shared/types/supabase';
import { db } from './db';
import 'cross-fetch';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL) {
  throw new Error('Missing Supabase URL. Please set VITE_SUPABASE_URL environment variable.');
}

if (!SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase service key. Please set SUPABASE_SERVICE_KEY environment variable.');
}

// Ensure URL has proper protocol
const formattedUrl = SUPABASE_URL.startsWith('http') ? SUPABASE_URL : `https://${SUPABASE_URL}`;
console.log('Initializing Supabase client with URL:', formattedUrl);

export const supabase = createClient<Database>(
  formattedUrl,
  SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Helper function to verify database connection
export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    console.log('Attempting to connect to Supabase database...');

    // Test query to verify connection
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Supabase connection check failed:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }

    console.log('Successfully connected to Supabase database');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

// Static mock data for fallback
export const staticMockData = {
  contents: [
    {
      id: 1,
      title: "Getting Started Guide",
      description: "A comprehensive guide for new users",
      type: "application",
      url: "/documents/getting-started.pdf",
      category: "learning",
      active: true
    },
    {
      id: 2,
      title: "Product Demo",
      description: "Watch how to use key features",
      type: "video",
      url: "/documents/product-demo.mp4",
      category: "training",
      active: true
    },
    {
      id: 3,
      title: "Feature Overview",
      description: "Visual guide to platform features",
      type: "image",
      url: "/documents/features-overview.png",
      category: "marketing",
      active: true
    }
  ]
};

// Simplified mock data seeding
export async function seedMockData(): Promise<boolean> {
  try {
    console.log('Starting to seed basic mock data...');

    // Create demo user
    const mockUser = {
      username: 'demo@example.com',
      password: 'hashedpassword123',
      company_name: 'Demo Company'
    };

    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert([mockUser])
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', {
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
        code: userError.code
      });
      return false;
    }
    console.log('Created demo user:', userData);

    // Create mock content entries
    const { error: contentError } = await supabase
      .from('contents')
      .upsert(staticMockData.contents.map(content => ({
        ...content,
        user_id: userData.id
      })));

    if (contentError) {
      console.error('Error creating content:', {
        message: contentError.message,
        details: contentError.details,
        hint: contentError.hint,
        code: contentError.code
      });
      return false;
    }
    console.log('Created mock content entries');
    return true;
  } catch (error) {
    console.error('Error seeding mock data:', error);
    return false;
  }
}

export { db };