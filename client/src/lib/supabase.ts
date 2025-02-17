import { createClient } from '@supabase/supabase-js';
import { Database } from '@shared/types/supabase';

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase credentials. Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://your-project.supabase.co',
  supabaseAnonKey || 'your-anon-key'
);

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

// Type-safe database functions
export const db = {
  calls: {
    subscribe: (callback: (payload: any) => void) => 
      subscribeToChannel('calls', callback),
    getRecent: () => 
      supabase.from('calls').select('*').order('created_at', { ascending: false }).limit(10)
  },
  messages: {
    subscribe: (callback: (payload: any) => void) => 
      subscribeToChannel('messages', callback),
    getRecent: () => 
      supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(10)
  },
  templates: {
    getAll: () => 
      supabase.from('templates').select('*')
  },
  locations: {
    getAll: () => 
      supabase.from('locations').select('*')
  }
};

// Initialize Stripe
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Missing Stripe publishable key. Make sure to set VITE_STRIPE_PUBLISHABLE_KEY environment variable.');
}

export const initializeStripe = async () => {
  const { loadStripe } = await import('@stripe/stripe-js');
  return loadStripe(stripePublishableKey || '');
};