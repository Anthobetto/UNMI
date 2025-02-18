import { supabase } from './supabase';
import type { Database } from '@shared/types/supabase';

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
    }
  },

  calls: {
    async getByUser(userId: number) {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },

    async create(data: Database['public']['Tables']['calls']['Insert']) {
      const { data: newCall, error } = await supabase
        .from('calls')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return newCall;
    }
  },

  messages: {
    async getByUser(userId: number) {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },

    async create(data: Database['public']['Tables']['messages']['Insert']) {
      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return newMessage;
    }
  },
  
  contents: {
    async getAll(userId: number) {
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },

    async getByCategory(userId: number, category: string) {
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category);
      if (error) throw error;
      return data;
    },

    async create(data: any) {
      const { data: newContent, error } = await supabase
        .from('contents')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return newContent;
    }
  }
};
