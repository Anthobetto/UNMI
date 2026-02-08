// Supabase Service - Repository Pattern con SOLID
// Implementa SRP: Cada método tiene una responsabilidad única

import { supabase } from '../config/database';
// Importamos los tipos (aunque User siga siendo el antiguo, lo gestionaremos con casting)
import { User, Location, Template, Call, Message, PhoneNumber, RoutingRule, MessageStatus } from '@/shared/types/schema';

type PlanType = 'small' | 'pro';

export interface ISupabaseService {
  // Users
  getUserByAuthId(authId: string): Promise<User | null>;
  getUserById(userId: string): Promise<User | null>;
  createUser(userData: Partial<User>): Promise<User>;
  updateUserPlan(userId: string, planType: PlanType): Promise<void>;
  handleUserLogin(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: User & { purchasedLocations?: any[]; credits: Record<string, number>; }; }>;

  // Locations
  getLocations(userId: string): Promise<Location[]>;
  getLocationById(locationId: number): Promise<Location | null>;
  createLocation(locationData: Partial<Location> & { planType?: PlanType }): Promise<Location>;
  updateLocation(id: number, data: Partial<Location>): Promise<Location>;
  
  recordPurchasedLocations(userId: string, selections: { planType: PlanType; quantity: number }[]): Promise<void>;
  getAvailableLocations(userId: string, planType: PlanType): Promise<number>;
  markLocationUsed(userId: string, planType: PlanType): Promise<void>;

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
  getMessageById(messageId: number): Promise<Message | null>;
  getMessageByWhatsAppId(whatsappMessageId: string): Promise<Message | null>;
  createMessage(messageData: Partial<Message>): Promise<Message>;
  updateMessageStatus(whatsappMessageId: string, status: any): Promise<void>;
  updateMessageError(whatsappMessageId: string, errorMessage: string): Promise<void>;
  getMessageStats(userId: string): Promise<any>;
  getConversationHistory(userId: string, recipient: string, limit?: number): Promise<Message[]>;

  // Phone Numbers
  getPhoneNumbers(userId: string): Promise<PhoneNumber[]>;
  createPhoneNumber(phoneData: Partial<PhoneNumber>): Promise<PhoneNumber>;
  getPhoneNumberById(phoneNumberId: number): Promise<PhoneNumber | null>;
  getPhoneNumberByProviderId(providerId: string): Promise<PhoneNumber | null>;
  updatePhoneNumber(id: number, data: Partial<PhoneNumber>): Promise<PhoneNumber>;

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
        if (error.code !== 'PGRST116') console.error('Error fetching user by auth_id:', error);
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
        if (error.code !== 'PGRST116') console.error('Error fetching user by id:', error);
        return null;
      }

      return data ? this.mapUserFromDb(data) : null;
    } catch (error) {
      console.error('getUserById error:', error);
      return null;
    }
  }

  async createUser(userData: Partial<User>): Promise<User> {
    // 🔴 FIX: Usamos 'as any' o 'as string' para evitar el error de tipos de TypeScript
    // porque el tipo User importado todavía tiene la definición antigua.
    const incomingPlan = userData.planType as unknown as string;

    const planToSave = incomingPlan === 'small' ? 'templates' : 
                       incomingPlan === 'pro' ? 'chatbots' : incomingPlan;

    const { data, error } = await supabase
      .from('users')
      .insert([{
        auth_id: userData.auth_id,
        username: userData.username,
        email: userData.email,
        company_name: userData.companyName,
        terms_accepted: userData.termsAccepted || false,
        terms_accepted_at: userData.termsAcceptedAt || new Date(),
        plan_type: planToSave 
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return this.mapUserFromDb(data);
  }

  async updateUserPlan(userId: string, planType: PlanType): Promise<void> {
    // Mapeo para DB legacy
    const dbPlanType = planType === 'small' ? 'templates' : 'chatbots';

    const { error } = await supabase
      .from('users')
      .update({ plan_type: dbPlanType })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update user plan: ${error.message}`);
    }
  }

  async handleUserLogin(email: string, password: string) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session || !authData.user) {
      throw new Error('Invalid credentials');
    }

    const user = await this.getUserByAuthId(authData.user.id);
    if (!user) throw new Error('User record not found');

    const { data: purchasedLocations } = await supabase
      .from('purchased_locations')
      .select('*')
      .eq('user_id', user.id);

    const credits = purchasedLocations?.reduce((acc, pl) => {
      // Normalizamos la key del plan
      let key = pl.plan_type;
      if (key === 'templates') key = 'small';
      if (key === 'chatbots') key = 'pro';
      
      acc[key] = (acc[key] || 0) + (pl.quantity - (pl.used || 0));
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      user: {
        ...user,
        purchasedLocations: purchasedLocations || [],
        credits,
      },
    };
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

  async createLocation(locationData: Partial<Location> & { planType?: PlanType }): Promise<Location> {
    if (!locationData.userId) throw new Error('Missing userId');
    
    // Si no viene planType, asumimos 'small' por defecto
    const requestedPlan = locationData.planType || 'small';
    const userId = locationData.userId;

    // Verificar créditos
    const available = await this.getAvailableLocations(userId, requestedPlan);

    if (available <= 0) {
      throw new Error(`No available locations for ${requestedPlan} plan. Please purchase more credits.`);
    }

    console.log(`✅ Creating location using ${requestedPlan} plan (${available} credits available)`);

    const { data, error } = await supabase
      .from('locations')
      .insert([{
        user_id: userId,
        group_id: locationData.groupId,
        name: locationData.name,
        address: locationData.address,
        timezone: locationData.timezone || 'UTC',
        business_hours: locationData.businessHours,
        is_first_location: locationData.isFirstLocation || false,
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create location: ${error.message}`);

    await this.markLocationUsed(userId, requestedPlan);

    return this.mapLocationFromDb(data);
  }

  async updateLocation(id: number, data: Partial<Location>): Promise<Location> {
    const { data: updated, error } = await supabase
      .from('locations')
      .update({
        name: data.name,
        address: data.address,
        timezone: data.timezone,
        business_hours: data.businessHours,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update location: ${error.message}`);
    return this.mapLocationFromDb(updated);
  }

  async recordPurchasedLocations(
    userId: string,
    selections: { planType: PlanType; quantity: number }[]
  ) {
    if (!selections || selections.length === 0) return;

    // Mapeamos a valores legacy para la DB
    const records = selections.map(sel => ({
      user_id: userId,
      plan_type: sel.planType === 'small' ? 'templates' : 'chatbots', // Mapeo
      quantity: sel.quantity,
      used: 0,
    }));

    for (const record of records) {
      const { data: existing, error: fetchError } = await supabase
        .from('purchased_locations')
        .select('*')
        .eq('user_id', userId)
        .eq('plan_type', record.plan_type)
        .single();

      if (fetchError && !fetchError.code?.includes('PGRST116')) {
        throw new Error(`Failed to check existing purchased locations: ${fetchError.message}`);
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from('purchased_locations')
          .update({ quantity: existing.quantity + record.quantity })
          .eq('id', existing.id);

        if (updateError) throw new Error(`Failed to update purchased locations: ${updateError.message}`);
      } else {
        const { error: insertError } = await supabase
          .from('purchased_locations')
          .insert([record]);

        if (insertError) throw new Error(`Failed to insert purchased locations: ${insertError.message}`);
      }
    }
  }

  async getAvailableLocations(userId: string, planType: PlanType): Promise<number> {
    // Mapeo para consulta
    const dbPlanType = planType === 'small' ? 'templates' : 'chatbots';

    const { data: purchasedList, error } = await supabase
      .from('purchased_locations')
      .select('quantity, used')
      .eq('user_id', userId)
      .eq('plan_type', dbPlanType);

    if (error || !purchasedList) return 0;

    return purchasedList.reduce((sum, pl) => sum + ((pl.quantity || 0) - (pl.used || 0)), 0);
  }

  async markLocationUsed(userId: string, planType: PlanType): Promise<void> {
    const dbPlanType = planType === 'small' ? 'templates' : 'chatbots';

    const { data: purchasedList, error } = await supabase
      .from('purchased_locations')
      .select('id, quantity, used')
      .eq('user_id', userId)
      .eq('plan_type', dbPlanType)
      .order('id', { ascending: true });

    if (error || !purchasedList || purchasedList.length === 0)
      throw new Error('No available purchased location to mark as used');

    const recordToUse = purchasedList.find(pl => (pl.quantity - (pl.used || 0)) > 0);
    if (!recordToUse) throw new Error('No available purchased location to mark as used');

    const { error: updateError } = await supabase
      .from('purchased_locations')
      .update({ used: (recordToUse.used || 0) + 1 })
      .eq('id', recordToUse.id);

    if (updateError) throw new Error(`Failed to mark purchased location as used: ${updateError.message}`);
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

    if (error) return [];
    return data.map(this.mapTemplateFromDb);
  }

  async getTemplateById(templateId: number): Promise<Template | null> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) return null;
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

    if (error) throw new Error(`Failed to create template: ${error.message}`);
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

    if (error) throw new Error(`Failed to update template: ${error.message}`);
    return this.mapTemplateFromDb(data);
  }

  async deleteTemplate(templateId: number): Promise<void> {
    const { error } = await supabase.from('templates').delete().eq('id', templateId);
    if (error) throw new Error(`Failed to delete template: ${error.message}`);
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

    if (error) return [];
    return data.map(this.mapCallFromDb);
  }

  async getCallStats(userId: string): Promise<any> {
    const calls = await this.getCalls(userId);
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    
    return {
      total: calls.length,
      missed: calls.filter(c => c.status === 'missed').length,
      answered: calls.filter(c => c.status === 'answered').length,
      todayCallsCount: calls.filter(c => new Date(c.createdAt) >= todayStart).length,
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

    if (error) throw new Error(`Failed to create call: ${error.message}`);
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

    if (error) return [];
    return data.map(this.mapMessageFromDb);
  }

  async getMessageById(messageId: number): Promise<Message | null> {
    const { data, error } = await supabase.from('messages').select('*').eq('id', messageId).single();
    if (error) return null;
    return data ? this.mapMessageFromDb(data) : null;
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
        direction: messageData.direction || 'outbound',
        whatsapp_message_id: messageData.whatsappMessageId,
        template_id: messageData.templateId,
        error_message: messageData.errorMessage,
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create message: ${error.message}`);
    return this.mapMessageFromDb(data);
  }

  async getMessageStats(userId: string): Promise<any> {
    const messages = await this.getMessages(userId);
    return { total: messages.length };
  }

  async getConversationHistory(userId: string, recipient: string, limit: number = 50): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .eq('recipient', recipient)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data.map(this.mapMessageFromDb);
  }

  async getMessageByWhatsAppId(whatsappMessageId: string): Promise<Message | null> {
    const { data, error } = await supabase.from('messages').select('*').eq('whatsapp_message_id', whatsappMessageId).single();
    if (error) return null;
    return data ? this.mapMessageFromDb(data) : null;
  }

  async updateMessageError(whatsappMessageId: string, errorMessage: string): Promise<void> {
    await supabase
      .from('messages')
      .update({ status: 'failed', error_message: errorMessage })
      .eq('whatsapp_message_id', whatsappMessageId);
  }

  async updateMessageStatus(whatsappMessageId: string, status: any): Promise<void> {
    await supabase.from('messages').update({ status }).eq('whatsapp_message_id', whatsappMessageId);
  }

  // ==================
  // PHONE NUMBERS
  // ==================
  async getPhoneNumbers(userId: string): Promise<PhoneNumber[]> {
    const { data, error } = await supabase.from('phone_numbers').select('*').eq('user_id', userId);
    if (error) return [];
    return data.map(this.mapPhoneNumberFromDb);
  }

  async getPhoneNumberById(phoneNumberId: number): Promise<PhoneNumber | null> {
    const { data, error } = await supabase.from('phone_numbers').select('*').eq('id', phoneNumberId).single();
    if (error) return null;
    return data ? this.mapPhoneNumberFromDb(data) : null;
  }

  async getPhoneNumberByProviderId(providerId: string): Promise<PhoneNumber | null> {
    const { data, error } = await supabase.from('phone_numbers').select('*').eq('provider_id', providerId).single();
    if (error) return null;
    return data ? this.mapPhoneNumberFromDb(data) : null;
  }

  async createPhoneNumber(phoneData: Partial<PhoneNumber>): Promise<PhoneNumber> {
    const { data, error } = await supabase.from('phone_numbers').insert([phoneData]).select().single();
    if (error) throw new Error(error.message);
    return this.mapPhoneNumberFromDb(data);
  }

  async updatePhoneNumber(id: number, data: Partial<PhoneNumber>): Promise<PhoneNumber> {
    const { data: updated, error } = await supabase.from('phone_numbers').update(data).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return this.mapPhoneNumberFromDb(updated);
  }

  // ==================
  // ROUTING RULES
  // ==================
  async getRoutingRules(userId: string): Promise<RoutingRule[]> {
    const { data, error } = await supabase.from('routing_rules').select('*').eq('user_id', userId);
    if (error) return [];
    return data.map(this.mapRoutingRuleFromDb);
  }

  async createRoutingRule(ruleData: Partial<RoutingRule>): Promise<RoutingRule> {
    const { data, error } = await supabase.from('routing_rules').insert([ruleData]).select().single();
    if (error) throw new Error(error.message);
    return this.mapRoutingRuleFromDb(data);
  }

  // ==================
  // MAPPER FUNCTIONS (DB -> Domain)
  // ==================
  private mapUserFromDb(dbUser: any): User {
    // Normalizamos el plan al devolverlo
    let plan = dbUser.plan_type;
    if (plan === 'templates') plan = 'small';
    if (plan === 'chatbots') plan = 'pro';

    return {
      id: dbUser.id,
      auth_id: dbUser.auth_id,
      username: dbUser.username,
      email: dbUser.email,
      companyName: dbUser.company_name,
      termsAccepted: dbUser.terms_accepted,
      termsAcceptedAt: dbUser.terms_accepted_at ? new Date(dbUser.terms_accepted_at) : undefined,
      // 🔴 FIX: Forzamos el cast a 'any' para evitar que TS se queje si User.planType es estricto
      planType: plan as any, 
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
      direction: dbMessage.direction,
      whatsappMessageId: dbMessage.whatsapp_message_id,
      templateId: dbMessage.template_id,
      errorMessage: dbMessage.error_message,
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
      providerId: dbPhone.provider_id,
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

  public getClient() {
    return supabase;
  }
}

export const supabaseService = new SupabaseService();