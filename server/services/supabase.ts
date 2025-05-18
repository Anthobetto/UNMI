import 'dotenv/config'; 
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@shared/types/supabase';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase credentials. Database operations will be simulated.');
} else {
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  supabaseUrl || 'process.env.SUPABASE_URL',
  supabaseAnonKey || 'process.env.SUPABASE_ANON_KEY',
  {
    auth: {
      persistSession: false
    }
  }
);

// Helper functions for real-time subscriptions
export const subscribeToTable = async (
  table: keyof Database['public']['Tables'],
  callback: (payload: any) => void
) => {
  try {
    return supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        callback
      )
      .subscribe();
  } catch (error) {
    console.error(`Failed to subscribe to ${table}:`, error);
    return null;
  }
};

// Database operations with proper types and error handling
export const db = {
  users: {
    getById: async (id: number) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return { data, error: null };
      } catch (error) {
        console.error('Error in users.getById:', error);
        return { data: null, error };
      }
    },
    getByUsername: async (username: string) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .single();
        if (error) throw error;
        return { data, error: null };
      } catch (error) {
        console.error('Error in users.getByUsername:', error);
        return { data: null, error };
      }
    },
    create: async (data: Database['public']['Tables']['users']['Insert']) => {
      try {
        const { data: newUser, error } = await supabase
          .from('users')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        return { data: newUser, error: null };
      } catch (error) {
        console.error('Error in users.create:', error);
        return { data: null, error };
      }
    }
  },
  calls: {
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
    getByUser: (userId: number) =>
      supabase.from('calls').select('*').eq('user_id', userId),
    getByPhoneNumber: (phoneNumberId: number) =>
      supabase.from('calls').select('*').eq('phone_number_id', phoneNumberId)
  },
  messages: {
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
    getByUser: (userId: number) =>
      supabase.from('messages').select('*').eq('user_id', userId)
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