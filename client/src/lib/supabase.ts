import { createClient } from '@supabase/supabase-js';
import { Database } from '@shared/types/supabase';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase credentials. Database operations will be simulated.');
}

// Create a mock client for development
const createMockClient = () => ({
  channel: () => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
  }),
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: [], error: null }),
    update: () => ({ data: [], error: null }),
    delete: () => ({ data: [], error: null }),
  }),
});

export const supabase = (!supabaseUrl || !supabaseServiceKey) 
  ? createMockClient() as any
  : createClient<Database>(supabaseUrl, supabaseServiceKey);

// Real-time subscription helpers
export const subscribeToChannel = (
  channel: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(channel)
    .on('postgres_changes', { event: '*', schema: 'public' }, callback)
    .subscribe();
};

// Database types
export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];

// Type-safe database functions with error handling
export const db = {
  calls: {
    subscribe: (callback: (payload: any) => void) => 
      subscribeToChannel('calls', callback),
    getRecent: async () => {
      try {
        return await supabase
          .from('calls')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
      } catch (error) {
        console.warn('Error fetching recent calls:', error);
        return { data: [], error: null };
      }
    }
  },
  messages: {
    subscribe: (callback: (payload: any) => void) => 
      subscribeToChannel('messages', callback),
    getRecent: async () => {
      try {
        return await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
      } catch (error) {
        console.warn('Error fetching recent messages:', error);
        return { data: [], error: null };
      }
    }
  },
  templates: {
    getAll: async () => {
      try {
        return await supabase.from('templates').select('*');
      } catch (error) {
        console.warn('Error fetching templates:', error);
        return { data: [], error: null };
      }
    }
  },
  locations: {
    getAll: async () => {
      try {
        return await supabase.from('locations').select('*');
      } catch (error) {
        console.warn('Error fetching locations:', error);
        return { data: [], error: null };
      }
    }
  }
};

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Missing Stripe publishable key. Make sure to set VITE_STRIPE_PUBLISHABLE_KEY environment variable.');
}

export const initializeStripe = async () => {
  const { loadStripe } = await import('@stripe/stripe-js');
  return loadStripe(stripePublishableKey || '');
};