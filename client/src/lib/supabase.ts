import { createClient } from '@supabase/supabase-js';
import { Database } from '@shared/types/supabase';

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

// Database types
export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];

// Type-safe database functions with error handling
export const db = {
  auth: {
    async getSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        return null;
      }
      return session;
    },

    async getUser() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting user:', error);
        return null;
      }
      return user;
    }
  },

  calls: {
    getRecent: async () => {
      try {
        const { data, error } = await supabase
          .from('calls')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching recent calls:', error);
        return [];
      }
    }
  },
  messages: {
    getRecent: async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching recent messages:', error);
        return [];
      }
    }
  },
  templates: {
    getAll: async () => {
      try {
        return await supabase.from('templates').select('*');
      } catch (error) {
        console.error('Error fetching templates:', error);
        return { data: [], error: null };
      }
    }
  },
  locations: {
    getAll: async () => {
      try {
        return await supabase.from('locations').select('*');
      } catch (error) {
        console.error('Error fetching locations:', error);
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