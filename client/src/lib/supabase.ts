import { createClient } from '@supabase/supabase-js';
import { Database } from '@shared/types/supabase';

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  throw new Error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

// Strongly typed database functions with proper error handling
export const db = {
  auth: {
    async getSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
      } catch (error) {
        console.error('Error getting session:', error);
        return null;
      }
    },

    async getUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
      } catch (error) {
        console.error('Error getting user:', error);
        return null;
      }
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
        const { data, error } = await supabase.from('templates').select('*');
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching templates:', error);
        return [];
      }
    }
  },

  locations: {
    getAll: async () => {
      try {
        const { data, error } = await supabase.from('locations').select('*');
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching locations:', error);
        return [];
      }
    }
  },

  contents: {
    getAll: async () => {
      try {
        const { data, error } = await supabase.from('contents').select('*');
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching contents:', error);
        return [];
      }
    }
  }
};

// Let's verify if our application is working now by checking the Stripe configuration
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Missing Stripe publishable key. Make sure to set VITE_STRIPE_PUBLISHABLE_KEY environment variable.');
}

export const initializeStripe = async () => {
  const { loadStripe } = await import('@stripe/stripe-js');
  return loadStripe(stripePublishableKey || '');
};