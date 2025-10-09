// Supabase Service - Repository Pattern con SOLID
// Implementa SRP: Cada método tiene una responsabilidad única

import { supabase } from '../config/database';
import type { User, Location, Template, Call, Message, PhoneNumber, RoutingRule } from '../../../shared/schema';

export interface ISupabaseService {
  // Users
  getUserByAuthId(authId: string): Promise<User | null>;
  getUserById(userId: string): Promise<User | null>;
  createUser(userData: Partial<User>): Promise<User>;
  updateUserPlan(userId: string, planType: 'templates' | 'chatbots'): Promise<void>;

  // Locations
  getLocations(userId: string): Promise<Location[]>;
  getLocationById(locationId: number): Promise<Location | null>;
  createLocation(locationData: Partial<Location>): Promise<Location>;

  // Templates
  getTemplates(userId: string): Promise<Template[]>;
  getTemplateById(templateId: number): Promise<Template | null>;
  createTemplate(templateData: Partial<Template>): Promise<Template>;
  updateTemplate(templateId: number, updates: Partial<Template>): Promise<Template>;
  deleteTemplate(templateId: number): Promise<void>;

  // Calls
  getCalls(userId: string): Promise<Call[]>;
  getCallStats(userId: string): Promise<any>;
  createCall(callData: Partial<Call>): Promise<Call>;

  // Messages
  getMessages(userId: string): Promise<Message[]>;
  createMessage(messageData: Partial<Message>): Promise<Message>;
  getMessageStats(userId: string): Promise<any>;

  // Phone Numbers
  getPhoneNumbers(userId: string): Promise<PhoneNumber[]>;
  createPhoneNumber(phoneData: Partial<PhoneNumber>): Promise<PhoneNumber>;

  // Routing Rules
  getRoutingRules(userId: string): Promise<RoutingRule[]>;
  createRoutingRule(ruleData: Partial<RoutingRule>): Promise<RoutingRule>;
}

export class SupabaseService implements ISupabaseService {
  // ==================
  // USER OPERATIONS
  // ==================
  async getUserByAuthId(authId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (error) {
        console.error('Error fetching user by auth_id:', error);
        return null;
      }

      return data ? this.mapUserFromDb(data) : null;
    } catch (error) {
      console.error('getUserByAuthId error:', error);
      return null;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user by id:', error);
        return null;
      }

      return data ? this.mapUserFromDb(data) : null;
    } catch (error) {
      console.error('getUserById error:', error);
      return null;
    }
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        auth_id: userData.auth_id,
        username: userData.username,
        email: userData.email,
        company_name: userData.companyName,
        terms_accepted: userData.termsAccepted || false,
        terms_accepted_at: userData.termsAcceptedAt || new Date(),
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return this.mapUserFromDb(data);
  }

  async updateUserPlan(userId: string, planType: 'templates' | 'chatbots'): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ plan_type: planType })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update user plan: ${error.message}`);
    }
  }

  // ==================
  // LOCATION OPERATIONS
  // ==================
  async getLocations(userId: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching locations:', error);
      return [];
    }

    return data.map(this.mapLocationFromDb);
  }

  async getLocationById(locationId: number): Promise<Location | null> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (error) {
      console.error('Error fetching location:', error);
      return null;
    }

    return data ? this.mapLocationFromDb(data) : null;
  }

  async createLocation(locationData: Partial<Location>): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .insert([{
        user_id: locationData.userId,
        group_id: locationData.groupId,
        name: locationData.name,
        address: locationData.address,
        timezone: locationData.timezone || 'UTC',
        business_hours: locationData.businessHours,
        is_first_location: locationData.isFirstLocation || false,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create location: ${error.message}`);
    }

    return this.mapLocationFromDb(data);
  }

  // ==================
  // TEMPLATE OPERATIONS
  // ==================
  async getTemplates(userId: string): Promise<Template[]> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return [];
    }

    return data.map(this.mapTemplateFromDb);
  }

  async getTemplateById(templateId: number): Promise<Template | null> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) {
      console.error('Error fetching template:', error);
      return null;
    }

    return data ? this.mapTemplateFromDb(data) : null;
  }

  async createTemplate(templateData: Partial<Template>): Promise<Template> {
    const { data, error } = await supabase
      .from('templates')
      .insert([{
        user_id: templateData.userId,
        location_id: templateData.locationId,
        group_id: templateData.groupId,
        name: templateData.name,
        content: templateData.content,
        type: templateData.type,
        channel: templateData.channel,
        variables: templateData.variables || {},
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }

    return this.mapTemplateFromDb(data);
  }

  async updateTemplate(templateId: number, updates: Partial<Template>): Promise<Template> {
    const { data, error } = await supabase
      .from('templates')
      .update({
        name: updates.name,
        content: updates.content,
        type: updates.type,
        channel: updates.channel,
        variables: updates.variables,
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }

    return this.mapTemplateFromDb(data);
  }

  async deleteTemplate(templateId: number): Promise<void> {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }

  // ==================
  // CALL OPERATIONS
  // ==================
  async getCalls(userId: string): Promise<Call[]> {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching calls:', error);
      return [];
    }

    return data.map(this.mapCallFromDb);
  }

  async getCallStats(userId: string): Promise<any> {
    const calls = await this.getCalls(userId);
    
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const todayCalls = calls.filter(c => new Date(c.createdAt) >= todayStart);
    const yesterdayCalls = calls.filter(c => {
      const date = new Date(c.createdAt);
      return date >= yesterdayStart && date < todayStart;
    });

    return {
      total: calls.length,
      missed: calls.filter(c => c.status === 'missed').length,
      answered: calls.filter(c => c.status === 'answered').length,
      averageDuration: calls.reduce((acc, c) => acc + (c.duration || 0), 0) / calls.length || 0,
      todayCallsCount: todayCalls.length,
      yesterdayCallsCount: yesterdayCalls.length,
    };
  }

  async createCall(callData: Partial<Call>): Promise<Call> {
    const { data, error } = await supabase
      .from('calls')
      .insert([{
        user_id: callData.userId,
        phone_number_id: callData.phoneNumberId,
        caller_number: callData.callerNumber,
        status: callData.status,
        duration: callData.duration,
        routed_to_location: callData.routedToLocation,
        call_type: callData.callType,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create call: ${error.message}`);
    }

    return this.mapCallFromDb(data);
  }

  // ==================
  // MESSAGE OPERATIONS
  // ==================
  async getMessages(userId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data.map(this.mapMessageFromDb);
  }

  async createMessage(messageData: Partial<Message>): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        user_id: messageData.userId,
        phone_number_id: messageData.phoneNumberId,
        type: messageData.type,
        content: messageData.content,
        recipient: messageData.recipient,
        status: messageData.status || 'pending',
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create message: ${error.message}`);
    }

    return this.mapMessageFromDb(data);
  }

  async getMessageStats(userId: string): Promise<any> {
    const messages = await this.getMessages(userId);
    
    return {
      total: messages.length,
      sent: messages.filter(m => m.status === 'sent').length,
      delivered: messages.filter(m => m.status === 'delivered').length,
      failed: messages.filter(m => m.status === 'failed').length,
      pending: messages.filter(m => m.status === 'pending').length,
      revenue: 0, // Calculate based on business logic
    };
  }

  // ==================
  // PHONE NUMBER OPERATIONS
  // ==================
  async getPhoneNumbers(userId: string): Promise<PhoneNumber[]> {
    const { data, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching phone numbers:', error);
      return [];
    }

    return data.map(this.mapPhoneNumberFromDb);
  }

  async createPhoneNumber(phoneData: Partial<PhoneNumber>): Promise<PhoneNumber> {
    const { data, error } = await supabase
      .from('phone_numbers')
      .insert([{
        user_id: phoneData.userId,
        location_id: phoneData.locationId,
        phone_number: phoneData.number,
        type: phoneData.type,
        linked_number: phoneData.linkedNumber,
        channel: phoneData.channel,
        active: phoneData.active !== undefined ? phoneData.active : true,
        forwarding_enabled: phoneData.forwardingEnabled !== undefined ? phoneData.forwardingEnabled : true,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create phone number: ${error.message}`);
    }

    return this.mapPhoneNumberFromDb(data);
  }

  // ==================
  // ROUTING RULE OPERATIONS
  // ==================
  async getRoutingRules(userId: string): Promise<RoutingRule[]> {
    const { data, error } = await supabase
      .from('routing_rules')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching routing rules:', error);
      return [];
    }

    return data.map(this.mapRoutingRuleFromDb);
  }

  async createRoutingRule(ruleData: Partial<RoutingRule>): Promise<RoutingRule> {
    const { data, error } = await supabase
      .from('routing_rules')
      .insert([{
        user_id: ruleData.userId,
        location_id: ruleData.locationId,
        priority: ruleData.priority,
        conditions: ruleData.conditions,
        forwarding_number: ruleData.forwardingNumber,
        ivr_options: ruleData.ivrOptions,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create routing rule: ${error.message}`);
    }

    return this.mapRoutingRuleFromDb(data);
  }

  // ==================
  // MAPPER FUNCTIONS (DB -> Domain)
  // ==================
  private mapUserFromDb(dbUser: any): User {
    return {
      id: dbUser.id,
      auth_id: dbUser.auth_id,
      username: dbUser.username,
      email: dbUser.email,
      companyName: dbUser.company_name,
      termsAccepted: dbUser.terms_accepted,
      termsAcceptedAt: dbUser.terms_accepted_at ? new Date(dbUser.terms_accepted_at) : undefined,
      planType: dbUser.plan_type,
      subscriptionStatus: dbUser.subscription_status,
    };
  }

  private mapLocationFromDb(dbLocation: any): Location {
    return {
      id: dbLocation.id,
      userId: dbLocation.user_id,
      groupId: dbLocation.group_id,
      name: dbLocation.name,
      address: dbLocation.address,
      timezone: dbLocation.timezone,
      businessHours: dbLocation.business_hours,
      trialStartDate: dbLocation.trial_start_date ? new Date(dbLocation.trial_start_date) : undefined,
      isFirstLocation: dbLocation.is_first_location,
    };
  }

  private mapTemplateFromDb(dbTemplate: any): Template {
    return {
      id: dbTemplate.id,
      userId: dbTemplate.user_id,
      locationId: dbTemplate.location_id,
      groupId: dbTemplate.group_id,
      name: dbTemplate.name,
      content: dbTemplate.content,
      type: dbTemplate.type,
      channel: dbTemplate.channel,
      variables: dbTemplate.variables,
    };
  }

  private mapCallFromDb(dbCall: any): Call {
    return {
      id: dbCall.id,
      userId: dbCall.user_id,
      phoneNumberId: dbCall.phone_number_id,
      callerNumber: dbCall.caller_number,
      status: dbCall.status,
      duration: dbCall.duration,
      createdAt: new Date(dbCall.created_at),
      routedToLocation: dbCall.routed_to_location,
      callType: dbCall.call_type,
    };
  }

  private mapMessageFromDb(dbMessage: any): Message {
    return {
      id: dbMessage.id,
      userId: dbMessage.user_id,
      phoneNumberId: dbMessage.phone_number_id,
      type: dbMessage.type,
      content: dbMessage.content,
      recipient: dbMessage.recipient,
      status: dbMessage.status,
      createdAt: new Date(dbMessage.created_at),
    };
  }

  private mapPhoneNumberFromDb(dbPhone: any): PhoneNumber {
    return {
      id: dbPhone.id,
      userId: dbPhone.user_id,
      locationId: dbPhone.location_id,
      number: dbPhone.phone_number,
      type: dbPhone.type,
      linkedNumber: dbPhone.linked_number,
      channel: dbPhone.channel,
      active: dbPhone.active,
      forwardingEnabled: dbPhone.forwarding_enabled,
    };
  }

  private mapRoutingRuleFromDb(dbRule: any): RoutingRule {
    return {
      id: dbRule.id,
      userId: dbRule.user_id,
      locationId: dbRule.location_id,
      priority: dbRule.priority,
      conditions: dbRule.conditions,
      forwardingNumber: dbRule.forwarding_number,
      ivrOptions: dbRule.ivr_options,
    };
  }
}

export const supabaseService = new SupabaseService();




