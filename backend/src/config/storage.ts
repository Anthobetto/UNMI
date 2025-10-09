import 'dotenv/config';
import { SupabaseService } from '../services/SupabaseService';

// Storage interface for database operations
export interface IStorage {
  getUser(id: string): Promise<any>;
  getUserByUsername(username: string): Promise<any>;
  getUserByEmail(email: string): Promise<any>;
  createUser(user: any): Promise<any>;
  updateUser(id: string, user: any): Promise<any>;
  deleteUser(id: string): Promise<void>;
  
  getLocations(userId: string): Promise<any[]>;
  getLocation(id: number): Promise<any>;
  createLocation(location: any): Promise<any>;
  updateLocation(id: number, location: any): Promise<any>;
  deleteLocation(id: number): Promise<void>;
  
  getPhoneNumbers(userId: string): Promise<any[]>;
  getPhoneNumber(id: number): Promise<any>;
  createPhoneNumber(phoneNumber: any): Promise<any>;
  updatePhoneNumber(id: number, phoneNumber: any): Promise<any>;
  deletePhoneNumber(id: number): Promise<void>;
  
  getTemplates(userId: string): Promise<any[]>;
  getTemplate(id: number): Promise<any>;
  createTemplate(template: any): Promise<any>;
  updateTemplate(id: number, template: any): Promise<any>;
  deleteTemplate(id: number): Promise<void>;
  
  getCalls(userId: string): Promise<any[]>;
  getCall(id: number): Promise<any>;
  createCall(call: any): Promise<any>;
  
  getMessages(userId: string): Promise<any[]>;
  getMessage(id: number): Promise<any>;
  createMessage(message: any): Promise<any>;
  
  getRoutingRules(userId: string): Promise<any[]>;
  getRoutingRule(id: number): Promise<any>;
  createRoutingRule(rule: any): Promise<any>;
  updateRoutingRule(id: number, rule: any): Promise<any>;
  deleteRoutingRule(id: number): Promise<void>;
}

/**
 * Database Storage implementation using Supabase
 */
export class DatabaseStorage implements IStorage {
  private supabase: SupabaseService;

  constructor() {
    this.supabase = new SupabaseService();
  }

  // User operations
  async getUser(id: string): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUserByUsername(username: string): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getUserByEmail(email: string): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createUser(user: any): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateUser(id: string, user: any): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('users')
      .update(user)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Location operations
  async getLocations(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase.getClient()
      .from('locations')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }

  async getLocation(id: number): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createLocation(location: any): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('locations')
      .insert(location)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateLocation(id: number, location: any): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('locations')
      .update(location)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteLocation(id: number): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('locations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Phone number operations
  async getPhoneNumbers(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase.getClient()
      .from('phone_numbers')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }

  async getPhoneNumber(id: number): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('phone_numbers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createPhoneNumber(phoneNumber: any): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('phone_numbers')
      .insert(phoneNumber)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updatePhoneNumber(id: number, phoneNumber: any): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('phone_numbers')
      .update(phoneNumber)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deletePhoneNumber(id: number): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('phone_numbers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Template operations
  async getTemplates(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase.getClient()
      .from('templates')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }

  async getTemplate(id: number): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createTemplate(template: any): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('templates')
      .insert(template)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateTemplate(id: number, template: any): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('templates')
      .update(template)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteTemplate(id: number): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('templates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Call operations
  async getCalls(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase.getClient()
      .from('calls')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getCall(id: number): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('calls')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createCall(call: any): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('calls')
      .insert(call)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Message operations
  async getMessages(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase.getClient()
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getMessage(id: number): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createMessage(message: any): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('messages')
      .insert(message)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Routing rule operations
  async getRoutingRules(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase.getClient()
      .from('routing_rules')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async getRoutingRule(id: number): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('routing_rules')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createRoutingRule(rule: any): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('routing_rules')
      .insert(rule)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateRoutingRule(id: number, rule: any): Promise<any> {
    const { data, error } = await this.supabase.getClient()
      .from('routing_rules')
      .update(rule)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteRoutingRule(id: number): Promise<void> {
    const { error } = await this.supabase.getClient()
      .from('routing_rules')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

export const storage = new DatabaseStorage();

