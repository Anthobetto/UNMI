import 'dotenv/config';
import { SupabaseService } from '../services/SupabaseService';
/**
 * Database Storage implementation using Supabase
 */
export class DatabaseStorage {
    supabase;
    constructor() {
        this.supabase = new SupabaseService();
    }
    // User operations
    async getUser(id) {
        const { data, error } = await this.supabase.getClient()
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw error;
        return data;
    }
    async getUserByUsername(username) {
        const { data, error } = await this.supabase.getClient()
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
        if (error && error.code !== 'PGRST116')
            throw error;
        return data;
    }
    async getUserByEmail(email) {
        const { data, error } = await this.supabase.getClient()
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (error && error.code !== 'PGRST116')
            throw error;
        return data;
    }
    async createUser(user) {
        const { data, error } = await this.supabase.getClient()
            .from('users')
            .insert(user)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateUser(id, user) {
        const { data, error } = await this.supabase.getClient()
            .from('users')
            .update(user)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async deleteUser(id) {
        const { error } = await this.supabase.getClient()
            .from('users')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
    }
    // Location operations
    async getLocations(userId) {
        const { data, error } = await this.supabase.getClient()
            .from('locations')
            .select('*')
            .eq('user_id', userId);
        if (error)
            throw error;
        return data || [];
    }
    async getLocation(id) {
        const { data, error } = await this.supabase.getClient()
            .from('locations')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw error;
        return data;
    }
    async createLocation(location) {
        const { data, error } = await this.supabase.getClient()
            .from('locations')
            .insert(location)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateLocation(id, location) {
        const { data, error } = await this.supabase.getClient()
            .from('locations')
            .update(location)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async deleteLocation(id) {
        const { error } = await this.supabase.getClient()
            .from('locations')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
    }
    // Phone number operations
    async getPhoneNumbers(userId) {
        const { data, error } = await this.supabase.getClient()
            .from('phone_numbers')
            .select('*')
            .eq('user_id', userId);
        if (error)
            throw error;
        return data || [];
    }
    async getPhoneNumber(id) {
        const { data, error } = await this.supabase.getClient()
            .from('phone_numbers')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw error;
        return data;
    }
    async createPhoneNumber(phoneNumber) {
        const { data, error } = await this.supabase.getClient()
            .from('phone_numbers')
            .insert(phoneNumber)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updatePhoneNumber(id, phoneNumber) {
        const { data, error } = await this.supabase.getClient()
            .from('phone_numbers')
            .update(phoneNumber)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async deletePhoneNumber(id) {
        const { error } = await this.supabase.getClient()
            .from('phone_numbers')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
    }
    // Template operations
    async getTemplates(userId) {
        const { data, error } = await this.supabase.getClient()
            .from('templates')
            .select('*')
            .eq('user_id', userId);
        if (error)
            throw error;
        return data || [];
    }
    async getTemplate(id) {
        const { data, error } = await this.supabase.getClient()
            .from('templates')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw error;
        return data;
    }
    async createTemplate(template) {
        const { data, error } = await this.supabase.getClient()
            .from('templates')
            .insert(template)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateTemplate(id, template) {
        const { data, error } = await this.supabase.getClient()
            .from('templates')
            .update(template)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async deleteTemplate(id) {
        const { error } = await this.supabase.getClient()
            .from('templates')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
    }
    // Call operations
    async getCalls(userId) {
        const { data, error } = await this.supabase.getClient()
            .from('calls')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data || [];
    }
    async getCall(id) {
        const { data, error } = await this.supabase.getClient()
            .from('calls')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw error;
        return data;
    }
    async createCall(call) {
        const { data, error } = await this.supabase.getClient()
            .from('calls')
            .insert(call)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    // Message operations
    async getMessages(userId) {
        const { data, error } = await this.supabase.getClient()
            .from('messages')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data || [];
    }
    async getMessage(id) {
        const { data, error } = await this.supabase.getClient()
            .from('messages')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw error;
        return data;
    }
    async createMessage(message) {
        const { data, error } = await this.supabase.getClient()
            .from('messages')
            .insert(message)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    // Routing rule operations
    async getRoutingRules(userId) {
        const { data, error } = await this.supabase.getClient()
            .from('routing_rules')
            .select('*')
            .eq('user_id', userId)
            .order('priority', { ascending: true });
        if (error)
            throw error;
        return data || [];
    }
    async getRoutingRule(id) {
        const { data, error } = await this.supabase.getClient()
            .from('routing_rules')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw error;
        return data;
    }
    async createRoutingRule(rule) {
        const { data, error } = await this.supabase.getClient()
            .from('routing_rules')
            .insert(rule)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateRoutingRule(id, rule) {
        const { data, error } = await this.supabase.getClient()
            .from('routing_rules')
            .update(rule)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async deleteRoutingRule(id) {
        const { error } = await this.supabase.getClient()
            .from('routing_rules')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
    }
}
export const storage = new DatabaseStorage();
