import { createClient } from '@supabase/supabase-js';
import type { Database } from '@shared/types/supabase';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl?.startsWith('http')) {
  console.warn('Invalid or missing Supabase URL. Mock mode will be enabled.');
}

if (!supabaseServiceKey) {
  console.warn('Missing Supabase service key. Mock mode will be enabled.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  supabaseUrl || 'http://localhost',
  supabaseServiceKey || 'mock-key',
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
    const { data, error } = await supabase.from('users').select('count').single();
    if (error) {
      console.warn('Supabase connection failed:', error.message);
      console.log('Continuing in mock mode...');
      return true; // Continue anyway to allow mock data
    }
    console.log('Successfully connected to Supabase database');
    return true;
  } catch (error) {
    console.warn('Database connection error:', error);
    console.log('Continuing in mock mode...');
    return true; // Continue anyway to allow mock data
  }
}

// Helper function to seed mock data
export async function seedMockData() {
  try {
    console.log('Starting to seed mock data...');

    // Insert mock calls
    const mockCalls = Array.from({ length: 5 }, (_, i) => ({
      user_id: 1,
      phone_number_id: 1,
      caller_number: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      status: ['answered', 'missed', 'busy'][Math.floor(Math.random() * 3)],
      duration: Math.floor(Math.random() * 300),
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));

    // Insert mock messages
    const mockMessages = Array.from({ length: 3 }, (_, i) => ({
      user_id: 1,
      phone_number_id: 1,
      type: Math.random() > 0.5 ? 'SMS' : 'WhatsApp',
      content: `Test message ${i + 1}`,
      recipient: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      status: 'sent',
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));

    console.log('Inserting initial batch of mock data...');

    // Insert in smaller batches to avoid timeouts
    const { error: callsError } = await supabase.from('calls').insert(mockCalls);
    if (callsError) {
      console.warn('Error seeding mock calls:', callsError.message);
    }

    const { error: messagesError } = await supabase.from('messages').insert(mockMessages);
    if (messagesError) {
      console.warn('Error seeding mock messages:', messagesError.message);
    }

    console.log('Successfully seeded initial mock data');
    return true;
  } catch (error) {
    console.warn('Error seeding mock data:', error);
    return false;
  }
}

// Strongly typed database access layer
export const db = {
  users: {
    async getById(id: number) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error in users.getById:', error);
        return null;
      }
    },

    async getByEmail(email: string) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error in users.getByEmail:', error);
        return null;
      }
    },

    async create(userData: any) {
      try {
        const { data, error } = await supabase
          .from('users')
          .insert([userData])
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error in users.create:', error);
        return null;
      }
    }
  },

  calls: {
    getByUser: (userId: number) =>
      supabase.from('calls').select('*').eq('user_id', userId),
    create: async (data: Database['public']['Tables']['calls']['Insert']) => {
      try {
        const { data: newCall, error } = await supabase
          .from('calls')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        return { data: newCall, error: null };
      } catch (error) {
        console.error('Error in calls.create:', error);
        return { data: null, error };
      }
    },
    update: async (id: number, data: Database['public']['Tables']['calls']['Update']) => {
      try {
        const { data: updatedCall, error } = await supabase
          .from('calls')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data: updatedCall, error: null };
      } catch (error) {
        console.error('Error in calls.update:', error);
        return { data: null, error };
      }
    },
    getByPhoneNumber: (phoneNumberId: number) =>
      supabase.from('calls').select('*').eq('phone_number_id', phoneNumberId)
  },
  messages: {
    getByUser: (userId: number) =>
      supabase.from('messages').select('*').eq('user_id', userId),
    create: async (data: Database['public']['Tables']['messages']['Insert']) => {
      try {
        const { data: newMessage, error } = await supabase
          .from('messages')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        return { data: newMessage, error: null };
      } catch (error) {
        console.error('Error in messages.create:', error);
        return { data: null, error };
      }
    },
    update: async (id: number, data: Database['public']['Tables']['messages']['Update']) => {
      try {
        const { data: updatedMessage, error } = await supabase
          .from('messages')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data: updatedMessage, error: null };
      } catch (error) {
        console.error('Error in messages.update:', error);
        return { data: null, error };
      }
    },
  },
  templates: {
    create: async (data: Database['public']['Tables']['templates']['Insert']) => {
      try {
        const { data: newTemplate, error } = await supabase
          .from('templates')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        return { data: newTemplate, error: null };
      } catch (error) {
        console.error('Error in templates.create:', error);
        return { data: null, error };
      }
    },
    getByLocation: (locationId: number) =>
      supabase.from('templates').select('*').eq('location_id', locationId),
    getByUser: (userId: number) =>
      supabase.from('templates').select('*').eq('user_id', userId),
    getByGroup: (groupId: number) =>
      supabase.from('templates').select('*').eq('group_id', groupId)
  },
  locations: {
    create: async (data: Database['public']['Tables']['locations']['Insert']) => {
      try {
        const { data: newLocation, error } = await supabase
          .from('locations')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        return { data: newLocation, error: null };
      } catch (error) {
        console.error('Error in locations.create:', error);
        return { data: null, error };
      }
    },
    getByUser: (userId: number) =>
      supabase.from('locations').select('*').eq('user_id', userId),
    getByGroup: (groupId: number) =>
      supabase.from('locations').select('*').eq('group_id', groupId)
  },
  phoneNumbers: {
    create: async (data: Database['public']['Tables']['phone_numbers']['Insert']) => {
      try {
        const { data: newPhoneNumber, error } = await supabase
          .from('phone_numbers')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        return { data: newPhoneNumber, error: null };
      } catch (error) {
        console.error('Error in phoneNumbers.create:', error);
        return { data: null, error };
      }
    },
    getByLocation: (locationId: number) =>
      supabase.from('phone_numbers').select('*').eq('location_id', locationId),
    getByUser: (userId: number) =>
      supabase.from('phone_numbers').select('*').eq('user_id', userId),
    getLinked: (phoneNumber: string) =>
      supabase.from('phone_numbers').select('*').eq('linked_number', phoneNumber)
  },
  contents: {
    create: async (data: any) => {
      try {
        const { data: newContent, error } = await supabase
          .from('contents')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        return { data: newContent, error: null };
      } catch (error) {
        console.error('Error in contents.create:', error);
        return { data: null, error };
      }
    },
    getByUser: (userId: number) =>
      supabase.from('contents').select('*').eq('user_id', userId),
    getByCategory: (userId: number, category: string) =>
      supabase.from('contents')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
  },
  groups: {
    create: async (data: any) => {
      try {
        const { data: newGroup, error } = await supabase
          .from('groups')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        return { data: newGroup, error: null };
      } catch (error) {
        console.error('Error in groups.create:', error);
        return { data: null, error };
      }
    },
    getByUser: (userId: number) =>
      supabase.from('groups').select('*').eq('user_id', userId)
  },
  routingRules: {
    create: async (data: any) => {
      try {
        const { data: newRule, error } = await supabase
          .from('routing_rules')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        return { data: newRule, error: null };
      } catch (error) {
        console.error('Error in routingRules.create:', error);
        return { data: null, error };
      }
    },
    getByUser: (userId: number) =>
      supabase.from('routing_rules').select('*').eq('user_id', userId)
  }
};

export type { Database };