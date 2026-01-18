// src/index.ts
import dotenv3 from "dotenv";
import express2 from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { createServer } from "http";

// src/routes/auth.routes.ts
import { Router } from "express";
import crypto from "crypto";

// src/config/database.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
var SUPABASE_URL = process.env.SUPABASE_URL;
var SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
var SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  console.warn("\u26A0\uFE0F Missing Supabase credentials. Database operations will fail.");
}
var supabase = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY || "placeholder_key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
var supabaseAuth = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder_anon_key"
);
var database_default = supabase;

// src/services/SupabaseService.ts
var SupabaseService = class {
  // ==================
  // USER OPERATIONS
  // ==================
  async getUserByAuthId(authId) {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("auth_id", authId).single();
      if (error) {
        console.error("Error fetching user by auth_id:", error);
        return null;
      }
      return data ? this.mapUserFromDb(data) : null;
    } catch (error) {
      console.error("getUserByAuthId error:", error);
      return null;
    }
  }
  async getUserById(userId) {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
      if (error) {
        console.error("Error fetching user by id:", error);
        return null;
      }
      return data ? this.mapUserFromDb(data) : null;
    } catch (error) {
      console.error("getUserById error:", error);
      return null;
    }
  }
  async createUser(userData) {
    const { data, error } = await supabase.from("users").insert([{
      auth_id: userData.auth_id,
      username: userData.username,
      email: userData.email,
      company_name: userData.companyName,
      terms_accepted: userData.termsAccepted || false,
      terms_accepted_at: userData.termsAcceptedAt || /* @__PURE__ */ new Date()
    }]).select().single();
    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
    return this.mapUserFromDb(data);
  }
  async updateUserPlan(userId, planType) {
    const { error } = await supabase.from("users").update({ plan_type: planType }).eq("id", userId);
    if (error) {
      throw new Error(`Failed to update user plan: ${error.message}`);
    }
  }
  async handleUserLogin(email, password) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (authError || !authData.session || !authData.user) {
      throw new Error("Invalid credentials");
    }
    const user = await this.getUserByAuthId(authData.user.id);
    if (!user) throw new Error("User record not found");
    const { data: purchasedLocations } = await supabase.from("purchased_locations").select("*").eq("user_id", user.id);
    const credits = purchasedLocations?.reduce((acc, pl) => {
      acc[pl.plan_type] = (acc[pl.plan_type] || 0) + (pl.quantity - (pl.used || 0));
      return acc;
    }, {}) || {};
    return {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      user: {
        ...user,
        purchasedLocations: purchasedLocations || [],
        credits
      }
    };
  }
  // ==================
  // LOCATION OPERATIONS
  // ==================
  async getLocations(userId) {
    const { data, error } = await supabase.from("locations").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching locations:", error);
      return [];
    }
    return data.map(this.mapLocationFromDb);
  }
  async getLocationById(locationId) {
    const { data, error } = await supabase.from("locations").select("*").eq("id", locationId).single();
    if (error) {
      console.error("Error fetching location:", error);
      return null;
    }
    return data ? this.mapLocationFromDb(data) : null;
  }
  async createLocation(locationData) {
    if (!locationData.userId) throw new Error("Missing userId");
    if (!locationData.planType) throw new Error("Plan type is required");
    const userId = locationData.userId;
    const requestedPlan = locationData.planType;
    const available = await this.getAvailableLocations(userId, requestedPlan);
    if (available <= 0) {
      throw new Error(`No available locations for ${requestedPlan} plan. Please purchase more credits.`);
    }
    console.log(`\u2705 Creating location using ${requestedPlan} plan (${available} credits available)`);
    const { data, error } = await supabase.from("locations").insert([{
      user_id: userId,
      group_id: locationData.groupId,
      name: locationData.name,
      address: locationData.address,
      timezone: locationData.timezone || "UTC",
      business_hours: locationData.businessHours,
      is_first_location: locationData.isFirstLocation || false
    }]).select().single();
    if (error) throw new Error(`Failed to create location: ${error.message}`);
    await this.markLocationUsed(userId, requestedPlan);
    console.log(`\u2705 Location created and ${requestedPlan} credit used`);
    return this.mapLocationFromDb(data);
  }
  async updateLocation(id, data) {
    const { data: updated, error } = await supabase.from("locations").update({
      name: data.name,
      address: data.address,
      timezone: data.timezone,
      business_hours: data.businessHours
    }).eq("id", id).select().single();
    if (error) throw new Error(`Failed to update location: ${error.message}`);
    return this.mapLocationFromDb(updated);
  }
  async recordPurchasedLocations(userId, selections) {
    if (!selections || selections.length === 0) return;
    const records = selections.map((sel) => ({
      user_id: userId,
      plan_type: sel.planType,
      quantity: sel.quantity,
      used: 0
    }));
    for (const record of records) {
      const { data: existing, error: fetchError } = await supabase.from("purchased_locations").select("*").eq("user_id", userId).eq("plan_type", record.plan_type).single();
      if (fetchError && !fetchError.code?.includes("PGRST116")) {
        throw new Error(`Failed to check existing purchased locations: ${fetchError.message}`);
      }
      if (existing) {
        const { error: updateError } = await supabase.from("purchased_locations").update({ quantity: existing.quantity + record.quantity }).eq("id", existing.id);
        if (updateError) throw new Error(`Failed to update purchased locations: ${updateError.message}`);
      } else {
        const { error: insertError } = await supabase.from("purchased_locations").insert([record]);
        if (insertError) throw new Error(`Failed to insert purchased locations: ${insertError.message}`);
      }
    }
  }
  async getAvailableLocations(userId, planType) {
    const { data: purchasedList, error } = await supabase.from("purchased_locations").select("quantity, used").eq("user_id", userId).eq("plan_type", planType);
    if (error || !purchasedList) return 0;
    return purchasedList.reduce((sum, pl) => sum + ((pl.quantity || 0) - (pl.used || 0)), 0);
  }
  async markLocationUsed(userId, planType) {
    const { data: purchasedList, error } = await supabase.from("purchased_locations").select("id, quantity, used").eq("user_id", userId).eq("plan_type", planType).order("id", { ascending: true });
    if (error || !purchasedList || purchasedList.length === 0)
      throw new Error("No available purchased location to mark as used");
    const recordToUse = purchasedList.find((pl) => pl.quantity - (pl.used || 0) > 0);
    if (!recordToUse) throw new Error("No available purchased location to mark as used");
    const { error: updateError } = await supabase.from("purchased_locations").update({ used: (recordToUse.used || 0) + 1 }).eq("id", recordToUse.id);
    if (updateError) throw new Error(`Failed to mark purchased location as used: ${updateError.message}`);
  }
  // ==================
  // TEMPLATE OPERATIONS
  // ==================
  async getTemplates(userId) {
    const { data, error } = await supabase.from("templates").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching templates:", error);
      return [];
    }
    return data.map(this.mapTemplateFromDb);
  }
  async getTemplateById(templateId) {
    const { data, error } = await supabase.from("templates").select("*").eq("id", templateId).single();
    if (error) {
      console.error("Error fetching template:", error);
      return null;
    }
    return data ? this.mapTemplateFromDb(data) : null;
  }
  async createTemplate(templateData) {
    const { data, error } = await supabase.from("templates").insert([{
      user_id: templateData.userId,
      location_id: templateData.locationId,
      group_id: templateData.groupId,
      name: templateData.name,
      content: templateData.content,
      type: templateData.type,
      channel: templateData.channel,
      variables: templateData.variables || {}
    }]).select().single();
    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }
    return this.mapTemplateFromDb(data);
  }
  async updateTemplate(templateId, updates) {
    const { data, error } = await supabase.from("templates").update({
      name: updates.name,
      content: updates.content,
      type: updates.type,
      channel: updates.channel,
      variables: updates.variables
    }).eq("id", templateId).select().single();
    if (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }
    return this.mapTemplateFromDb(data);
  }
  async deleteTemplate(templateId) {
    const { error } = await supabase.from("templates").delete().eq("id", templateId);
    if (error) {
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }
  // ==================
  // CALL OPERATIONS
  // ==================
  async getCalls(userId) {
    const { data, error } = await supabase.from("calls").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching calls:", error);
      return [];
    }
    return data.map(this.mapCallFromDb);
  }
  async getCallStats(userId) {
    const calls = await this.getCalls(userId);
    const now = /* @__PURE__ */ new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const todayCalls = calls.filter((c) => new Date(c.createdAt) >= todayStart);
    const yesterdayCalls = calls.filter((c) => {
      const date = new Date(c.createdAt);
      return date >= yesterdayStart && date < todayStart;
    });
    return {
      total: calls.length,
      missed: calls.filter((c) => c.status === "missed").length,
      answered: calls.filter((c) => c.status === "answered").length,
      averageDuration: calls.reduce((acc, c) => acc + (c.duration || 0), 0) / calls.length || 0,
      todayCallsCount: todayCalls.length,
      yesterdayCallsCount: yesterdayCalls.length
    };
  }
  async createCall(callData) {
    const { data, error } = await supabase.from("calls").insert([{
      user_id: callData.userId,
      phone_number_id: callData.phoneNumberId,
      caller_number: callData.callerNumber,
      status: callData.status,
      duration: callData.duration,
      routed_to_location: callData.routedToLocation,
      call_type: callData.callType
    }]).select().single();
    if (error) {
      throw new Error(`Failed to create call: ${error.message}`);
    }
    return this.mapCallFromDb(data);
  }
  // ==================
  // MESSAGE OPERATIONS
  // ==================
  async getMessages(userId) {
    const { data, error } = await supabase.from("messages").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
    return data.map(this.mapMessageFromDb);
  }
  async getMessageById(messageId) {
    const { data, error } = await supabase.from("messages").select("*").eq("id", messageId).single();
    if (error) {
      console.error("Error fetching message by id:", error);
      return null;
    }
    return data ? this.mapMessageFromDb(data) : null;
  }
  async createMessage(messageData) {
    const { data, error } = await supabase.from("messages").insert([{
      user_id: messageData.userId,
      phone_number_id: messageData.phoneNumberId,
      type: messageData.type,
      content: messageData.content,
      recipient: messageData.recipient,
      status: messageData.status || "pending",
      direction: messageData.direction || "outbound",
      whatsapp_message_id: messageData.whatsappMessageId,
      template_id: messageData.templateId,
      error_message: messageData.errorMessage
    }]).select().single();
    if (error) {
      throw new Error(`Failed to create message: ${error.message}`);
    }
    return this.mapMessageFromDb(data);
  }
  async getMessageStats(userId) {
    const messages = await this.getMessages(userId);
    return {
      total: messages.length,
      sent: messages.filter((m) => m.status === "sent").length,
      delivered: messages.filter((m) => m.status === "delivered").length,
      received: messages.filter((m) => m.status === "received").length,
      read: messages.filter((m) => m.status === "read").length,
      failed: messages.filter((m) => m.status === "failed").length,
      pending: messages.filter((m) => m.status === "pending").length,
      inbound: messages.filter((m) => m.direction === "inbound").length,
      outbound: messages.filter((m) => m.direction === "outbound").length,
      revenue: 0
    };
  }
  async getConversationHistory(userId, recipient, limit = 50) {
    const { data, error } = await supabase.from("messages").select("*").eq("user_id", userId).eq("recipient", recipient).order("created_at", { ascending: false }).limit(limit);
    if (error) {
      console.error("Error fetching conversation history:", error);
      return [];
    }
    return data.map(this.mapMessageFromDb);
  }
  async getMessageByWhatsAppId(whatsappMessageId) {
    const { data, error } = await supabase.from("messages").select("*").eq("whatsapp_message_id", whatsappMessageId).single();
    if (error) {
      console.error("Error fetching message by whatsapp_id:", error);
      return null;
    }
    return data ? this.mapMessageFromDb(data) : null;
  }
  async updateMessageError(whatsappMessageId, errorMessage) {
    const { error } = await supabase.from("messages").update({
      status: "failed",
      error_message: errorMessage
    }).eq("whatsapp_message_id", whatsappMessageId);
    if (error) {
      console.error("Error updating message error:", error);
      throw new Error(`Failed to update message error: ${error.message}`);
    }
  }
  async updateMessageStatus(whatsappMessageId, status) {
    const { error } = await supabase.from("messages").update({ status }).eq("whatsapp_message_id", whatsappMessageId);
    if (error) {
      console.error("Error updating message status:", error);
      throw new Error(`Failed to update message status: ${error.message}`);
    }
  }
  // ==================
  // PHONE NUMBER OPERATIONS
  // ==================
  async getPhoneNumbers(userId) {
    const { data, error } = await supabase.from("phone_numbers").select("*").eq("user_id", userId);
    if (error) {
      console.error("Error fetching phone numbers:", error);
      return [];
    }
    return data.map(this.mapPhoneNumberFromDb);
  }
  async getPhoneNumberById(phoneNumberId) {
    const { data, error } = await supabase.from("phone_numbers").select("*").eq("id", phoneNumberId).single();
    if (error) {
      console.error("Error fetching phone number by id:", error);
      return null;
    }
    return data ? this.mapPhoneNumberFromDb(data) : null;
  }
  async getPhoneNumberByProviderId(providerId) {
    const { data, error } = await supabase.from("phone_numbers").select("*").eq("provider_id", providerId).single();
    if (error) {
      console.error("Error fetching phone number by provider_id:", error);
      return null;
    }
    return data ? this.mapPhoneNumberFromDb(data) : null;
  }
  async createPhoneNumber(phoneData) {
    const { data, error } = await supabase.from("phone_numbers").insert([{
      user_id: phoneData.userId,
      location_id: phoneData.locationId,
      phone_number: phoneData.number,
      type: phoneData.type,
      linked_number: phoneData.linkedNumber,
      channel: phoneData.channel,
      active: phoneData.active !== void 0 ? phoneData.active : true,
      forwarding_enabled: phoneData.forwardingEnabled !== void 0 ? phoneData.forwardingEnabled : true,
      provider_id: phoneData.providerId
    }]).select().single();
    if (error) {
      throw new Error(`Failed to create phone number: ${error.message}`);
    }
    return this.mapPhoneNumberFromDb(data);
  }
  async updatePhoneNumber(id, data) {
    const { data: updated, error } = await supabase.from("phone_numbers").update({
      phone_number: data.number,
      type: data.type,
      linked_number: data.linkedNumber,
      active: data.active,
      forwarding_enabled: data.forwardingEnabled,
      channel: data.channel,
      provider_id: data.providerId
    }).eq("id", id).select().single();
    if (error) throw new Error(`Failed to update phone number: ${error.message}`);
    return this.mapPhoneNumberFromDb(updated);
  }
  // ==================
  // ROUTING RULE OPERATIONS
  // ==================
  async getRoutingRules(userId) {
    const { data, error } = await supabase.from("routing_rules").select("*").eq("user_id", userId).order("priority", { ascending: true });
    if (error) {
      console.error("Error fetching routing rules:", error);
      return [];
    }
    return data.map(this.mapRoutingRuleFromDb);
  }
  async createRoutingRule(ruleData) {
    const { data, error } = await supabase.from("routing_rules").insert([{
      user_id: ruleData.userId,
      location_id: ruleData.locationId,
      priority: ruleData.priority,
      conditions: ruleData.conditions,
      forwarding_number: ruleData.forwardingNumber,
      ivr_options: ruleData.ivrOptions
    }]).select().single();
    if (error) {
      throw new Error(`Failed to create routing rule: ${error.message}`);
    }
    return this.mapRoutingRuleFromDb(data);
  }
  // ==================
  // MAPPER FUNCTIONS (DB -> Domain)
  // ==================
  mapUserFromDb(dbUser) {
    return {
      id: dbUser.id,
      auth_id: dbUser.auth_id,
      username: dbUser.username,
      email: dbUser.email,
      companyName: dbUser.company_name,
      termsAccepted: dbUser.terms_accepted,
      termsAcceptedAt: dbUser.terms_accepted_at ? new Date(dbUser.terms_accepted_at) : void 0,
      planType: dbUser.plan_type,
      // ✅ AGREGADO
      subscriptionStatus: dbUser.subscription_status
    };
  }
  mapLocationFromDb(dbLocation) {
    return {
      id: dbLocation.id,
      userId: dbLocation.user_id,
      groupId: dbLocation.group_id,
      name: dbLocation.name,
      address: dbLocation.address,
      timezone: dbLocation.timezone,
      businessHours: dbLocation.business_hours,
      trialStartDate: dbLocation.trial_start_date ? new Date(dbLocation.trial_start_date) : void 0,
      isFirstLocation: dbLocation.is_first_location
    };
  }
  mapTemplateFromDb(dbTemplate) {
    return {
      id: dbTemplate.id,
      userId: dbTemplate.user_id,
      locationId: dbTemplate.location_id,
      groupId: dbTemplate.group_id,
      name: dbTemplate.name,
      content: dbTemplate.content,
      type: dbTemplate.type,
      channel: dbTemplate.channel,
      variables: dbTemplate.variables
    };
  }
  mapCallFromDb(dbCall) {
    return {
      id: dbCall.id,
      userId: dbCall.user_id,
      phoneNumberId: dbCall.phone_number_id,
      callerNumber: dbCall.caller_number,
      status: dbCall.status,
      duration: dbCall.duration,
      createdAt: new Date(dbCall.created_at),
      routedToLocation: dbCall.routed_to_location,
      callType: dbCall.call_type
    };
  }
  mapMessageFromDb(dbMessage) {
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
      errorMessage: dbMessage.error_message
    };
  }
  mapPhoneNumberFromDb(dbPhone) {
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
      providerId: dbPhone.provider_id
    };
  }
  mapRoutingRuleFromDb(dbRule) {
    return {
      id: dbRule.id,
      userId: dbRule.user_id,
      locationId: dbRule.location_id,
      priority: dbRule.priority,
      conditions: dbRule.conditions,
      forwardingNumber: dbRule.forwarding_number,
      ivrOptions: dbRule.ivr_options
    };
  }
  getClient() {
    return supabase;
  }
};
var supabaseService = new SupabaseService();

// src/services/StripeService.ts
import Stripe from "stripe";
import dotenv2 from "dotenv";
dotenv2.config();
var STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
var FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
if (!STRIPE_SECRET_KEY) {
  console.warn("\u26A0\uFE0F Missing Stripe secret key. Payment functionality will be limited.");
}
var StripeService = class {
  stripe;
  webhookSecret;
  constructor() {
    this.stripe = new Stripe(STRIPE_SECRET_KEY || "dummy_key", {
      apiVersion: "2025-02-24.acacia"
    });
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  }
  async createCheckoutSession(params) {
    const {
      email,
      userId,
      planType,
      successUrl,
      cancelUrl,
      metadata = {}
    } = params;
    const priceIdMap = {
      templates: process.env.STRIPE_PRICE_TEMPLATES,
      chatbots: process.env.STRIPE_PRICE_CHATBOTS,
      initial_registration: process.env.STRIPE_PRICE_TEMPLATES
    };
    const priceId = priceIdMap[planType];
    if (!priceId) {
      throw new Error(`Price ID no configurado para el plan: ${planType}`);
    }
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        mode: "subscription",
        customer_email: email,
        success_url: successUrl || `${FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: cancelUrl || `${FRONTEND_URL}/pricing?canceled=true`,
        metadata: {
          userId,
          planType,
          ...metadata
        }
      });
      if (!session.url) {
        throw new Error("Failed to generate checkout session URL");
      }
      return session;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw new Error("Failed to create checkout session");
    }
  }
  // ✅ Método para checkout con múltiples selecciones
  async createCheckoutSessionCustom(params) {
    const line_items = params.selections.map((sel) => {
      const priceId = process.env[`STRIPE_PRICE_${sel.planType.toUpperCase()}`];
      if (!priceId) throw new Error(`No price configured for ${sel.planType}`);
      return { price: priceId, quantity: sel.quantity };
    });
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items,
        mode: "subscription",
        customer_email: params.email,
        metadata: {
          userId: params.userId,
          ...params.metadata
        },
        success_url: params.successUrl || `${FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: params.cancelUrl || `${FRONTEND_URL}/pricing?canceled=true`
      });
      if (!session.url) throw new Error("Failed to generate checkout session URL");
      return session;
    } catch (error) {
      console.error("Error creating custom checkout session:", error);
      throw new Error("Failed to create custom checkout session");
    }
  }
  async createCustomer(email, metadata) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        metadata: metadata || {}
      });
      return customer;
    } catch (error) {
      console.error("Error creating Stripe customer:", error);
      throw new Error("Failed to create customer");
    }
  }
  async getSession(sessionId) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      console.error("Error retrieving session:", error);
      return null;
    }
  }
  // Obtener precio desde Stripe (para mostrar en frontend)
  async getPlanPrice(planType) {
    const priceIdMap = {
      templates: process.env.STRIPE_PRICE_TEMPLATES,
      chatbots: process.env.STRIPE_PRICE_CHATBOTS
    };
    const price = await this.stripe.prices.retrieve(priceIdMap[planType]);
    if (!price.unit_amount) throw new Error(`No se encontr\xF3 precio para ${planType}`);
    return price.unit_amount / 100;
  }
  constructWebhookEvent(body, signature) {
    if (!this.webhookSecret) {
      throw new Error("Webhook secret not configured");
    }
    try {
      return this.stripe.webhooks.constructEvent(
        body,
        signature,
        this.webhookSecret
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      throw new Error("Invalid webhook signature");
    }
  }
};
var stripeService = new StripeService();

// src/middleware/requireAuth.ts
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "No token provided",
        message: "Authorization header must be provided in format: Bearer <token>"
      });
      return;
    }
    const token = authHeader.split(" ")[1];
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({
        error: "Invalid token",
        message: "The provided token is invalid or expired"
      });
      return;
    }
    req.user = {
      id: user.id,
      email: user.email || "",
      ...user.user_metadata
    };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      error: "Authentication error",
      message: "An error occurred during authentication"
    });
  }
}

// src/middleware/errorHandler.ts
import { ZodError } from "zod";
var ValidationError = class extends Error {
  statusCode = 400;
  isOperational = true;
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
};
var NotFoundError = class extends Error {
  statusCode = 404;
  isOperational = true;
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
};
function errorHandler(err, _req, _res, _next) {
  console.error("Error occurred:", {
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: _req.url,
    method: _req.method
  });
  if (err instanceof ZodError) {
    _res.status(400).json({
      error: "Validation Error",
      message: "Invalid request data",
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message
      }))
    });
    return;
  }
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "An unexpected error occurred";
  _res.status(statusCode).json({
    error: err.name || "Error",
    message,
    ...process.env.NODE_ENV === "development" && {
      stack: err.stack
    }
  });
}
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
function notFoundHandler(req, res) {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.url} not found`
  });
}

// shared/schema.ts
import { z } from "zod";
var userSchema = z.object({
  id: z.string().uuid(),
  auth_id: z.string().uuid(),
  username: z.string().min(3),
  email: z.string().email(),
  companyName: z.string().min(1),
  termsAccepted: z.boolean(),
  termsAcceptedAt: z.date().optional(),
  planType: z.enum(["templates", "chatbots"]).optional(),
  subscriptionStatus: z.enum(["active", "inactive", "trial", "cancelled"]).optional()
});
var locationSchema = z.object({
  id: z.number(),
  userId: z.string().uuid(),
  groupId: z.number().optional(),
  name: z.string().min(1),
  address: z.string().min(1),
  timezone: z.string().default("UTC"),
  businessHours: z.record(z.any()).optional(),
  trialStartDate: z.date().optional(),
  isFirstLocation: z.boolean().default(false)
});
var updateLocationSchema = locationSchema.partial();
var templateTypeEnum = z.enum(["missed_call", "after_hours", "welcome", "follow_up"]);
var messageChannelEnum = z.enum(["sms", "whatsapp", "both"]);
var templateSchema = z.object({
  id: z.number(),
  userId: z.string().uuid(),
  locationId: z.number().optional(),
  groupId: z.number().optional(),
  name: z.string().min(1),
  content: z.string().min(1),
  type: templateTypeEnum,
  channel: messageChannelEnum,
  variables: z.array(z.string()).optional()
});
var phoneNumberSchema = z.object({
  id: z.number(),
  userId: z.string().uuid(),
  locationId: z.number(),
  number: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  type: z.enum(["fixed", "mobile", "shared"]),
  linkedNumber: z.string().optional(),
  channel: messageChannelEnum,
  active: z.boolean().default(true),
  forwardingEnabled: z.boolean().default(true),
  providerId: z.string()
});
var callStatusEnum = z.enum(["answered", "missed", "rejected"]);
var callTypeEnum = z.enum(["direct", "forwarded", "ivr", "inbound"]);
var callSchema = z.object({
  id: z.number(),
  userId: z.string().uuid(),
  phoneNumberId: z.number(),
  callerNumber: z.string(),
  status: callStatusEnum,
  duration: z.number().optional(),
  createdAt: z.date(),
  routedToLocation: z.number().optional(),
  callType: callTypeEnum.optional()
});
var messageTypeEnum = z.enum(["SMS", "WhatsApp"]);
var messageStatusEnum = z.enum(["pending", "sent", "delivered", "received", "read", "failed"]);
var messageDirectionEnum = z.enum(["inbound", "outbound"]);
var messageSchema = z.object({
  id: z.number(),
  userId: z.string().uuid(),
  phoneNumberId: z.number(),
  type: messageTypeEnum,
  content: z.string(),
  recipient: z.string(),
  status: messageStatusEnum,
  createdAt: z.date(),
  // ✅ Campos nuevos para WhatsApp
  direction: messageDirectionEnum.optional(),
  whatsappMessageId: z.string().optional(),
  // ID de Meta para tracking
  templateId: z.number().optional(),
  // Si fue enviado desde un template
  errorMessage: z.string().optional()
  // Para guardar errores si falla
});
var routingRuleSchema = z.object({
  id: z.number(),
  userId: z.string().uuid(),
  locationId: z.number(),
  priority: z.number(),
  conditions: z.record(z.any()),
  forwardingNumber: z.string().optional(),
  ivrOptions: z.record(z.any()).optional()
});
var loginSchema = z.object({
  email: z.string().email("Email inv\xE1lido"),
  password: z.string().min(6, "La contrase\xF1a debe tener al menos 6 caracteres")
});
var registerSchema = z.object({
  username: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Email inv\xE1lido"),
  password: z.string().min(6, "La contrase\xF1a debe tener al menos 6 caracteres"),
  companyName: z.string().min(1, "Nombre de empresa requerido"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los t\xE9rminos y condiciones"
  }),
  selections: z.array(z.object({
    planType: z.enum(["templates", "chatbots"]),
    quantity: z.number().min(1).max(10)
  })).min(1, "Debes seleccionar al menos un plan")
});
var createLocationSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  address: z.string().min(1, "Direcci\xF3n requerida"),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "N\xFAmero de tel\xE9fono inv\xE1lido").optional(),
  phoneType: messageChannelEnum.optional(),
  planType: z.enum(["templates", "chatbots"])
});
var createTemplateSchema = templateSchema.omit({ id: true, userId: true });

// src/routes/auth.routes.ts
var router = Router();
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError("Datos de registro inv\xE1lidos");
    }
    const { username, email, password, companyName, selections, termsAccepted } = validation.data;
    if (!termsAccepted) {
      throw new ValidationError("Debes aceptar los t\xE9rminos y condiciones");
    }
    const tempUserId = crypto.randomUUID();
    const session = await stripeService.createCheckoutSessionCustom({
      email,
      userId: tempUserId,
      selections,
      metadata: {
        username,
        companyName,
        password,
        // ⚠️ No enviar password en producción
        selections: JSON.stringify(selections),
        type: "registration"
      },
      successUrl: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancelUrl: `${process.env.FRONTEND_URL}/pricing?canceled=true`
    });
    res.status(200).json({
      url: session.url,
      tempUserId,
      sessionId: session.id
    });
  })
);
router.post("/login", asyncHandler(async (req, res) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid login credentials");
  }
  const { email, password } = validation.data;
  console.log("\u{1F510} Login attempt for:", email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error || !data?.session) {
    console.error("\u274C Login failed:", error?.message);
    res.status(400).json({
      message: "Invalid credentials",
      error: "INVALID_CREDENTIALS"
    });
    return;
  }
  console.log("\u2705 Auth successful, fetching user profile...");
  const user = await supabaseService.getUserByAuthId(data.user.id);
  if (!user) {
    console.error("\u274C User profile not found for auth_id:", data.user.id);
    res.status(404).json({
      message: "User profile not found",
      error: "PROFILE_NOT_FOUND"
    });
    return;
  }
  console.log("\u2705 User profile found:", user.id);
  const { data: purchasedLocations } = await supabase.from("purchased_locations").select("*").eq("user_id", user.id);
  const credits = purchasedLocations?.reduce((acc, pl) => {
    acc[pl.plan_type] = (acc[pl.plan_type] || 0) + (pl.quantity - (pl.used || 0));
    return acc;
  }, {}) || {};
  console.log("\u2705 Login successful, credits:", credits);
  res.status(200).json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: {
      ...user,
      purchasedLocations: purchasedLocations || [],
      credits
    }
  });
}));
router.post("/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(200).json({
    message: "Logout successful. Please delete token on client."
  });
});
router.get("/user", requireAuth, asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "User not authenticated" });
    return;
  }
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) {
    res.status(404).json({ message: "User profile not found" });
    return;
  }
  const { data: purchasedLocations } = await supabase.from("purchased_locations").select("*").eq("user_id", profile.id);
  const credits = purchasedLocations?.reduce((acc, pl) => {
    acc[pl.plan_type] = (acc[pl.plan_type] || 0) + (pl.quantity - (pl.used || 0));
    return acc;
  }, {}) || {};
  const activePlans = [...new Set(purchasedLocations?.map((pl) => pl.plan_type) ?? [])];
  console.log("\u{1F4CA} User credits:", credits);
  console.log("\u{1F4E6} User active plans:", activePlans);
  res.status(200).json({
    user: {
      ...profile,
      purchasedLocations: purchasedLocations || [],
      credits,
      activePlans
    }
  });
}));
router.put("/user/plan", requireAuth, asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "User not authenticated" });
    return;
  }
  const { planType } = req.body;
  if (!planType || !["templates", "chatbots"].includes(planType)) {
    throw new ValidationError("Invalid plan type");
  }
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  await supabaseService.updateUserPlan(profile.id, planType);
  res.status(200).json({
    message: "Plan updated successfully",
    planType
  });
}));
router.post("/refresh", asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new ValidationError("Refresh token is required");
  }
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken
  });
  if (error || !data.session || !data.session.user) {
    res.status(401).json({ message: "Invalid refresh token" });
    return;
  }
  const authId = data.session.user.id;
  try {
    const user = await supabaseService.getUserByAuthId(authId);
    if (!user) throw new Error("User not found");
    const { data: purchasedLocations } = await supabase.from("purchased_locations").select("*").eq("user_id", user.id);
    const credits = purchasedLocations?.reduce((acc, pl) => {
      acc[pl.plan_type] = (acc[pl.plan_type] || 0) + (pl.quantity - pl.used);
      return acc;
    }, {}) || {};
    res.status(200).json({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        ...user,
        purchasedLocations: purchasedLocations || [],
        credits
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load user" });
  }
}));
router.post(
  "/checkout-plan",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new ValidationError("User not authenticated");
    const { planType } = req.body;
    if (!planType || !["templates", "chatbots"].includes(planType)) {
      throw new ValidationError("Invalid plan type");
    }
    const session = await stripeService.createCheckoutSession({
      email: req.user.email,
      userId: req.user.id,
      planType,
      successUrl: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancelUrl: `${process.env.FRONTEND_URL}/pricing?canceled=true`
    });
    res.status(200).json({ url: session.url, sessionId: session.id });
  })
);
router.get("/prices", asyncHandler(async (req, res) => {
  const templatesPrice = await stripeService.getPlanPrice("templates");
  const chatbotsPrice = await stripeService.getPlanPrice("chatbots");
  res.json({
    templates: templatesPrice,
    chatbots: chatbotsPrice
  });
}));
var auth_routes_default = router;

// src/routes/api.routes.ts
import { Router as Router2 } from "express";

// src/services/ProviderService.ts
var TwilioProvider = class {
  name = "twilio";
  isActive = true;
  capabilities = ["messaging", "virtual_numbers"];
  async sendSMS(to, message) {
    console.log(`[Twilio Mock] Sending SMS to ${to}: ${message}`);
    return { success: true, messageId: `twilio-sms-${Date.now()}` };
  }
  async sendWhatsApp(to, message) {
    console.log(`[Twilio Mock] Sending WhatsApp to ${to}: ${message}`);
    return { success: true, messageId: `twilio-wa-${Date.now()}` };
  }
  async generateVirtualNumber(countryCode) {
    console.log(`[Twilio Mock] Generating virtual number for ${countryCode}`);
    const number = `+${countryCode}${Math.floor(1e9 + Math.random() * 9e9)}`;
    return { success: true, number };
  }
  async releaseVirtualNumber(number) {
    console.log(`[Twilio Mock] Releasing virtual number ${number}`);
    return { success: true };
  }
};
var VonageProvider = class {
  name = "vonage";
  isActive = true;
  capabilities = ["messaging", "virtual_numbers"];
  async sendSMS(to, message) {
    console.log(`[Vonage Mock] Sending SMS to ${to}: ${message}`);
    return { success: true, messageId: `vonage-sms-${Date.now()}` };
  }
  async sendWhatsApp(to, message) {
    console.log(`[Vonage Mock] Sending WhatsApp to ${to}: ${message}`);
    return { success: true, messageId: `vonage-wa-${Date.now()}` };
  }
  async generateVirtualNumber(countryCode) {
    console.log(`[Vonage Mock] Generating virtual number for ${countryCode}`);
    const number = `+${countryCode}${Math.floor(1e9 + Math.random() * 9e9)}`;
    return { success: true, number };
  }
  async releaseVirtualNumber(number) {
    console.log(`[Vonage Mock] Releasing virtual number ${number}`);
    return { success: true };
  }
};
var ChatbotProvider = class {
  name = "unmi-chatbot";
  isActive = true;
  capabilities = ["chatbot"];
  async routeToBot(botId, userId, initialMessage) {
    console.log(`[Chatbot Mock] Routing user ${userId} to bot ${botId} with message: ${initialMessage}`);
    return { success: true, sessionId: `bot-session-${Date.now()}` };
  }
  async disconnectBot(sessionId) {
    console.log(`[Chatbot Mock] Disconnecting bot session ${sessionId}`);
    return { success: true };
  }
};
var ProviderService = class {
  providers = /* @__PURE__ */ new Map();
  defaultMessagingProvider = "twilio";
  defaultVirtualNumberProvider = "twilio";
  defaultChatbotProvider = "unmi-chatbot";
  constructor() {
    this.registerProvider(new TwilioProvider());
    this.registerProvider(new VonageProvider());
    this.registerProvider(new ChatbotProvider());
  }
  /**
   * Register a new provider (OCP: Open for extension)
   */
  registerProvider(provider) {
    this.providers.set(provider.name, provider);
    console.log(`\u2705 Provider registered: ${provider.name} (${provider.capabilities.join(", ")})`);
  }
  /**
   * Get provider by name
   */
  getProvider(name) {
    return this.providers.get(name);
  }
  /**
   * Get all active providers
   */
  getActiveProviders() {
    return Array.from(this.providers.values()).filter((p) => p.isActive);
  }
  /**
   * Set default provider for a capability
   */
  setDefaultProvider(capability, providerName) {
    const provider = this.providers.get(providerName);
    if (!provider || !provider.capabilities.includes(capability)) {
      throw new Error(`Provider ${providerName} does not support ${capability}`);
    }
    switch (capability) {
      case "messaging":
        this.defaultMessagingProvider = providerName;
        break;
      case "virtual_numbers":
        this.defaultVirtualNumberProvider = providerName;
        break;
      case "chatbot":
        this.defaultChatbotProvider = providerName;
        break;
    }
    console.log(`\u2705 Default ${capability} provider set to: ${providerName}`);
  }
  // ==========================================
  // MESSAGING METHODS
  // ==========================================
  async sendSMS(to, message, providerName) {
    const provider = this.providers.get(providerName || this.defaultMessagingProvider);
    if (!provider || !provider.sendSMS) {
      return { success: false, error: "Messaging provider not available" };
    }
    try {
      return await provider.sendSMS(to, message);
    } catch (error) {
      console.error(`[ProviderService] SMS send failed:`, error);
      return { success: false, error: error.message };
    }
  }
  async sendWhatsApp(to, message, providerName) {
    const provider = this.providers.get(providerName || this.defaultMessagingProvider);
    if (!provider || !provider.sendWhatsApp) {
      return { success: false, error: "WhatsApp provider not available" };
    }
    try {
      return await provider.sendWhatsApp(to, message);
    } catch (error) {
      console.error(`[ProviderService] WhatsApp send failed:`, error);
      return { success: false, error: error.message };
    }
  }
  // ==========================================
  // VIRTUAL NUMBER METHODS
  // ==========================================
  async generateVirtualNumber(countryCode = "34", providerName) {
    const provider = this.providers.get(providerName || this.defaultVirtualNumberProvider);
    if (!provider || !provider.generateVirtualNumber) {
      return { success: false, error: "Virtual number provider not available" };
    }
    try {
      return await provider.generateVirtualNumber(countryCode);
    } catch (error) {
      console.error(`[ProviderService] Virtual number generation failed:`, error);
      return { success: false, error: error.message };
    }
  }
  async releaseVirtualNumber(number, providerName) {
    const provider = this.providers.get(providerName || this.defaultVirtualNumberProvider);
    if (!provider || !provider.releaseVirtualNumber) {
      return { success: false, error: "Virtual number provider not available" };
    }
    try {
      return await provider.releaseVirtualNumber(number);
    } catch (error) {
      console.error(`[ProviderService] Virtual number release failed:`, error);
      return { success: false, error: error.message };
    }
  }
  // ==========================================
  // CHATBOT METHODS
  // ==========================================
  async routeToBot(botId, userId, initialMessage, providerName) {
    const provider = this.providers.get(providerName || this.defaultChatbotProvider);
    if (!provider || !provider.routeToBot) {
      return { success: false, error: "Chatbot provider not available" };
    }
    try {
      return await provider.routeToBot(botId, userId, initialMessage);
    } catch (error) {
      console.error(`[ProviderService] Bot routing failed:`, error);
      return { success: false, error: error.message };
    }
  }
  async disconnectBot(sessionId, providerName) {
    const provider = this.providers.get(providerName || this.defaultChatbotProvider);
    if (!provider || !provider.disconnectBot) {
      return { success: false, error: "Chatbot provider not available" };
    }
    try {
      return await provider.disconnectBot(sessionId);
    } catch (error) {
      console.error(`[ProviderService] Bot disconnect failed:`, error);
      return { success: false, error: error.message };
    }
  }
};
var providerService = new ProviderService();

// src/services/FlowService.ts
import { z as z2 } from "zod";

// src/services/WhatsAppCloudService.ts
var WhatsAppCloudService = class {
  accessToken;
  apiVersion;
  baseUrl;
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
    this.apiVersion = process.env.WHATSAPP_API_VERSION || "v21.0";
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
    if (!this.accessToken) {
      console.warn("\u26A0\uFE0F WHATSAPP_ACCESS_TOKEN not configured");
    }
  }
  /**
   * Enviar template de WhatsApp (requiere aprobación previa en Meta)
   */
  async sendTemplate(params) {
    try {
      const url = `${this.baseUrl}/${params.phoneNumberId}/messages`;
      const components = [];
      if (params.template.variables && params.template.variables.length > 0 && params.variables) {
        components.push({
          type: "body",
          parameters: params.template.variables.map((key) => ({
            type: "text",
            text: params.variables?.[key] ?? ""
          }))
        });
      }
      const payload = {
        messaging_product: "whatsapp",
        to: params.to,
        type: "template",
        template: {
          name: params.templateName,
          language: {
            code: params.languageCode || "es"
          },
          components: components.length > 0 ? components : void 0
        }
      };
      console.log("\u{1F4E4} Sending WhatsApp template:", {
        to: params.to,
        template: params.templateName
      });
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("\u274C WhatsApp API error:", data);
        return {
          messageId: "",
          status: "failed",
          error: data.error?.message || "Unknown error"
        };
      }
      console.log("\u2705 Template sent successfully:", data.messages[0].id);
      return {
        messageId: data.messages[0].id,
        status: "sent"
      };
    } catch (error) {
      console.error("\u274C Error sending WhatsApp template:", error);
      return {
        messageId: "",
        status: "failed",
        error: error.message
      };
    }
  }
  /**
   * Enviar mensaje de texto simple (solo válido dentro de ventana de 24h)
   */
  async sendTextMessage(params) {
    try {
      const url = `${this.baseUrl}/${params.phoneNumberId}/messages`;
      const payload = {
        messaging_product: "whatsapp",
        to: params.to,
        type: "text",
        text: {
          body: params.message
        }
      };
      console.log("\u{1F4E4} Sending WhatsApp text message:", {
        to: params.to,
        preview: params.message.substring(0, 50)
      });
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("\u274C WhatsApp API error:", data);
        return {
          messageId: "",
          status: "failed",
          error: data.error?.message || "Unknown error"
        };
      }
      console.log("\u2705 Text message sent successfully:", data.messages[0].id);
      return {
        messageId: data.messages[0].id,
        status: "sent"
      };
    } catch (error) {
      console.error("\u274C Error sending WhatsApp text:", error);
      return {
        messageId: "",
        status: "failed",
        error: error.message
      };
    }
  }
  /**
   * Procesar template: reemplazar variables
   */
  processTemplate(template, variables) {
    let content = template.content;
    if (!variables) return content;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, "g");
      content = content.replace(placeholder, value);
    });
    return content;
  }
  /**
   * Verificar si el servicio está configurado correctamente
   */
  isConfigured() {
    return !!this.accessToken;
  }
  /**
   * Marcar mensaje como leído (para notificar al usuario que viste su mensaje)
   */
  async markAsRead(messageId, phoneNumberId) {
    try {
      const url = `${this.baseUrl}/${phoneNumberId}/messages`;
      const payload = {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId
      };
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      return response.ok;
    } catch (error) {
      console.error("Error marking message as read:", error);
      return false;
    }
  }
};
var whatsAppCloudService = new WhatsAppCloudService();

// src/services/FlowService.ts
var userFlowPreferencesSchema = z2.object({
  userId: z2.string(),
  preferredFlow: z2.enum(["templates", "chatbot", "both"]),
  autoActivateTemplates: z2.boolean().default(false),
  autoActivateChatbot: z2.boolean().default(false),
  defaultTemplateId: z2.string().optional(),
  defaultChatbotId: z2.string().optional()
});
var postCallEventSchema = z2.object({
  callId: z2.string(),
  userId: z2.string(),
  locationId: z2.number(),
  virtualNumber: z2.string(),
  callerNumber: z2.string(),
  callType: z2.enum(["missed", "answered", "voicemail"]),
  timestamp: z2.string(),
  duration: z2.number().optional()
});
var templateCompletionSchema = z2.object({
  templateId: z2.string(),
  userId: z2.string(),
  locationId: z2.number(),
  recipientNumber: z2.string(),
  variables: z2.record(z2.string()).optional(),
  sendImmediately: z2.boolean().default(false)
});
var FlowService = class {
  // In-memory mock storage (replace with Supabase in production)
  userPreferences = /* @__PURE__ */ new Map();
  callEvents = [];
  templateCompletions = /* @__PURE__ */ new Map();
  /**
   * Get user's flow preferences (determines which sections are visible)
   */
  async getUserFlowPreferences(userId) {
    let preferences = this.userPreferences.get(userId);
    if (!preferences) {
      preferences = {
        userId,
        preferredFlow: "templates",
        // Default to templates flow
        autoActivateTemplates: false,
        autoActivateChatbot: false
      };
      this.userPreferences.set(userId, preferences);
    }
    return preferences;
  }
  /**
   * Update user's flow preferences
   */
  async updateUserFlowPreferences(preferences) {
    this.userPreferences.set(preferences.userId, preferences);
    console.log(`\u2705 Flow preferences updated for user ${preferences.userId}: ${preferences.preferredFlow}`);
  }
  /**
   * Handle post-missed-call trigger
   * This is the main orchestration method
   */
  async handleMissedCall(event) {
    const actionsTriggered = [];
    const errors = [];
    console.log(`
\u{1F4DE} [FlowService] Processing missed call: ${event.callId}`);
    this.callEvents.push(event);
    const preferences = await this.getUserFlowPreferences(event.userId);
    if (preferences.preferredFlow === "templates" || preferences.preferredFlow === "both") {
      if (preferences.autoActivateTemplates && preferences.defaultTemplateId) {
        try {
          const result = await this.autoCompleteAndSendTemplate({
            templateId: preferences.defaultTemplateId,
            userId: event.userId,
            locationId: event.locationId,
            recipientNumber: event.callerNumber,
            sendImmediately: true
          });
          if (result.success) {
            actionsTriggered.push("template-sent");
            console.log(`\u2705 Auto-sent template to ${event.callerNumber}`);
          } else {
            errors.push(`Template send failed: ${result.error}`);
          }
        } catch (error) {
          errors.push(`Template error: ${error.message}`);
        }
      } else {
        actionsTriggered.push("template-section-shown");
        console.log(`\u{1F4CB} Templates section available for manual completion`);
      }
    }
    if (preferences.preferredFlow === "chatbot" || preferences.preferredFlow === "both") {
      if (preferences.autoActivateChatbot && preferences.defaultChatbotId) {
        try {
          const result = await this.autoRouteToChatbot(
            preferences.defaultChatbotId,
            event.userId,
            `Missed call from ${event.callerNumber}`
          );
          if (result.success) {
            actionsTriggered.push("chatbot-routed");
            console.log(`\u2705 Auto-routed to chatbot ${preferences.defaultChatbotId}`);
          } else {
            errors.push(`Chatbot routing failed: ${result.error}`);
          }
        } catch (error) {
          errors.push(`Chatbot error: ${error.message}`);
        }
      } else {
        actionsTriggered.push("chatbot-section-shown");
        console.log(`\u{1F916} Chatbots section available for manual connection`);
      }
    }
    return {
      success: errors.length === 0,
      actionsTriggered,
      errors
    };
  }
  /**
   * Auto-complete and send template
   */
  async autoCompleteAndSendTemplate(completion) {
    const templateMessage = `Hello! You missed a call from our store. We'd love to help you. Reply to this message or call us back.`;
    const result = await providerService.sendWhatsApp(
      completion.recipientNumber,
      templateMessage
    );
    if (result.success) {
      this.templateCompletions.set(completion.templateId, {
        ...completion,
        sentAt: (/* @__PURE__ */ new Date()).toISOString(),
        messageId: result.messageId
      });
    }
    return result;
  }
  /**
   * Auto-route to chatbot
   */
  async autoRouteToChatbot(botId, userId, initialMessage) {
    return await providerService.routeToBot(botId, userId, initialMessage);
  }
  /**
   * Get call events for a user (for dashboard display)
   */
  async getUserCallEvents(userId, limit = 50) {
    return this.callEvents.filter((event) => event.userId === userId).slice(-limit).reverse();
  }
  /**
   * Get template completion history
   */
  async getTemplateCompletions(userId) {
    return Array.from(this.templateCompletions.values()).filter((c) => c.userId === userId);
  }
  /**
   * Determine which sections should be visible for a user
   */
  async getVisibleSections(userId) {
    const preferences = await this.getUserFlowPreferences(userId);
    return {
      templates: preferences.preferredFlow === "templates" || preferences.preferredFlow === "both",
      chatbots: preferences.preferredFlow === "chatbot" || preferences.preferredFlow === "both",
      both: preferences.preferredFlow === "both"
    };
  }
  async handleMissedCallWithWhatsApp(callData) {
    try {
      console.log("\u{1F4DE} Processing missed call with WhatsApp from:", callData.callerNumber);
      const phoneNumber = await supabaseService.getPhoneNumberById(callData.phoneNumberId);
      if (!phoneNumber) {
        throw new Error("Phone number not found");
      }
      if (!phoneNumber.providerId) {
        throw new Error("Phone number does not have a providerId (Meta phone_number_id)");
      }
      const location = await supabaseService.getLocationById(callData.locationId);
      if (!location) {
        throw new Error("Location not found");
      }
      const templates = await supabaseService.getTemplates(callData.userId);
      const locationTemplates = templates.filter(
        (t) => t.locationId === callData.locationId && t.channel === "whatsapp" && t.type === "missed_call"
      );
      if (locationTemplates.length === 0) {
        console.warn("\u26A0\uFE0F No WhatsApp template found for missed calls in this location");
        return {
          success: false,
          error: "No template configured"
        };
      }
      const template = locationTemplates[0];
      const variables = {
        business_name: location.name,
        customer_phone: callData.callerNumber,
        timestamp: (/* @__PURE__ */ new Date()).toLocaleString("es-ES")
      };
      const result = await whatsAppCloudService.sendTemplate({
        to: callData.callerNumber,
        templateName: template.name,
        languageCode: "es",
        variables,
        phoneNumberId: phoneNumber.providerId,
        template
      });
      if (result.status === "failed") {
        console.error("\u274C Failed to send WhatsApp template:", result.error);
        await supabaseService.createMessage({
          userId: callData.userId,
          phoneNumberId: callData.phoneNumberId,
          type: "WhatsApp",
          content: whatsAppCloudService.processTemplate(template, variables),
          recipient: callData.callerNumber,
          status: "failed",
          direction: "outbound",
          templateId: template.id,
          errorMessage: result.error
        });
        return {
          success: false,
          error: result.error
        };
      }
      await supabaseService.createMessage({
        userId: callData.userId,
        phoneNumberId: callData.phoneNumberId,
        type: "WhatsApp",
        content: whatsAppCloudService.processTemplate(template, variables),
        recipient: callData.callerNumber,
        status: "sent",
        direction: "outbound",
        whatsappMessageId: result.messageId,
        templateId: template.id
      });
      console.log("\u2705 WhatsApp template sent successfully:", result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        template: template.name
      };
    } catch (error) {
      console.error("\u274C Error handling missed call with WhatsApp:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  /**
   * Enviar mensaje de texto directo por WhatsApp (ventana 24h)
   */
  async sendDirectWhatsAppMessage(params) {
    try {
      const phoneNumber = await supabaseService.getPhoneNumberById(params.phoneNumberId);
      if (!phoneNumber || !phoneNumber.providerId) {
        throw new Error("Invalid phone number or missing providerId");
      }
      const result = await whatsAppCloudService.sendTextMessage({
        to: params.recipient,
        message: params.message,
        phoneNumberId: phoneNumber.providerId
      });
      await supabaseService.createMessage({
        userId: params.userId,
        phoneNumberId: params.phoneNumberId,
        type: "WhatsApp",
        content: params.message,
        recipient: params.recipient,
        status: result.status === "sent" ? "sent" : "failed",
        direction: "outbound",
        whatsappMessageId: result.messageId,
        errorMessage: result.error
      });
      return {
        success: result.status === "sent",
        messageId: result.messageId,
        error: result.error
      };
    } catch (error) {
      console.error("Error sending direct WhatsApp message:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};
var flowService = new FlowService();

// src/utils/validateMetaTemplate.ts
var MetaTemplateValidationError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "MetaTemplateValidationError";
  }
};
var VARIABLE_REGEX = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
function validateMetaTemplate(content, variables = []) {
  if (content.length > 1024) {
    throw new MetaTemplateValidationError(
      "Template content exceeds 1024 characters (Meta limit)"
    );
  }
  const foundVariables = [];
  let match;
  while ((match = VARIABLE_REGEX.exec(content)) !== null) {
    foundVariables.push(match[1]);
  }
  const duplicates = foundVariables.filter(
    (v, i) => foundVariables.indexOf(v) !== i
  );
  if (duplicates.length > 0) {
    throw new MetaTemplateValidationError(
      `Duplicate variables not allowed: ${[...new Set(duplicates)].join(", ")}`
    );
  }
  const missing = foundVariables.filter((v) => !variables.includes(v));
  const unused = variables.filter((v) => !foundVariables.includes(v));
  if (missing.length > 0) {
    throw new MetaTemplateValidationError(
      `Variables used in content but not declared: ${missing.join(", ")}`
    );
  }
  if (unused.length > 0) {
    throw new MetaTemplateValidationError(
      `Declared variables not used in content: ${unused.join(", ")}`
    );
  }
  const orderMismatch = variables.length === foundVariables.length && variables.some((v, i) => v !== foundVariables[i]);
  if (orderMismatch) {
    throw new MetaTemplateValidationError(
      `Variable order mismatch. Expected: [${foundVariables.join(", ")}]`
    );
  }
}

// src/routes/api.routes.ts
var router2 = Router2();
router2.get("/locations", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const locations = await supabaseService.getLocations(profile.id);
  res.json({ locations });
}));
router2.get("/locations/:id", requireAuth, asyncHandler(async (req, res) => {
  const location = await supabaseService.getLocationById(parseInt(req.params.id));
  if (!location) throw new NotFoundError("Location not found");
  res.json({ location });
}));
router2.post("/locations", requireAuth, asyncHandler(async (req, res) => {
  const validation = createLocationSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid location data");
  }
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const location = await supabaseService.createLocation({
    ...validation.data,
    userId: profile.id
  });
  res.status(201).json({ location });
}));
router2.put("/locations/:id", requireAuth, asyncHandler(async (req, res) => {
  const locationId = parseInt(req.params.id);
  const validation = updateLocationSchema.safeParse(req.body);
  if (!validation.success) throw new ValidationError("Invalid location data");
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const existing = await supabaseService.getLocationById(locationId);
  if (!existing || existing.userId !== profile.id) throw new NotFoundError("Location not found");
  const updated = await supabaseService.updateLocation(locationId, validation.data);
  res.json({ location: updated });
}));
router2.get("/templates", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const templates = await supabaseService.getTemplates(profile.id);
  res.json({ templates });
}));
router2.get("/templates/:id", requireAuth, asyncHandler(async (req, res) => {
  const templateId = parseInt(req.params.id);
  if (isNaN(templateId)) throw new ValidationError("Invalid template ID");
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const template = await supabaseService.getTemplateById(templateId);
  if (!template || template.userId !== profile.id) throw new NotFoundError("Template not found");
  res.json({ template });
}));
router2.post("/templates", requireAuth, asyncHandler(async (req, res) => {
  const validation = createTemplateSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid template data");
  }
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  try {
    validateMetaTemplate(validation.data.content, validation.data.variables || []);
  } catch (err) {
    if (err instanceof MetaTemplateValidationError) {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
  const template = await supabaseService.createTemplate({
    ...validation.data,
    userId: profile.id
  });
  res.status(201).json(template);
}));
router2.put("/templates/:id", requireAuth, asyncHandler(async (req, res) => {
  const templateId = parseInt(req.params.id);
  if (isNaN(templateId)) throw new ValidationError("Invalid template ID");
  const validation = createTemplateSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid template data");
  }
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const existing = await supabaseService.getTemplateById(templateId);
  if (!existing || existing.userId !== profile.id) throw new NotFoundError("Template not found");
  try {
    validateMetaTemplate(validation.data.content, validation.data.variables || []);
  } catch (err) {
    if (err instanceof MetaTemplateValidationError) {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
  const template = await supabaseService.updateTemplate(templateId, {
    ...validation.data,
    userId: profile.id
  });
  res.json(template);
}));
router2.delete("/templates/:id", requireAuth, asyncHandler(async (req, res) => {
  const templateId = parseInt(req.params.id);
  if (isNaN(templateId)) throw new ValidationError("Invalid template ID");
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const existing = await supabaseService.getTemplateById(templateId);
  if (!existing || existing.userId !== profile.id) throw new NotFoundError("Template not found");
  await supabaseService.deleteTemplate(templateId);
  res.status(204).send();
}));
router2.get("/locations/:locationId/templates", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const locationId = parseInt(req.params.locationId);
  if (isNaN(locationId)) throw new ValidationError("Invalid location ID");
  const templates = await supabaseService.getTemplates(profile.id);
  const filtered = templates.filter((t) => t.locationId === locationId);
  res.json({ templates: filtered });
}));
router2.get("/calls", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const calls = await supabaseService.getCalls(profile.id);
  res.json({ calls });
}));
router2.get("/calls/stats", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const stats = await supabaseService.getCallStats(profile.id);
  res.json(stats);
}));
router2.post("/calls", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const call = await supabaseService.createCall({
    ...req.body,
    userId: profile.id
  });
  res.status(201).json(call);
}));
router2.get("/messages", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const messages = await supabaseService.getMessages(profile.id);
  res.json({ messages });
}));
router2.get("/messages/stats", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const stats = await supabaseService.getMessageStats(profile.id);
  res.json(stats);
}));
router2.post("/messages/whatsapp", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const message = await supabaseService.createMessage({
    userId: profile.id,
    phoneNumberId: req.body.phoneNumberId,
    type: "WhatsApp",
    content: req.body.content,
    recipient: req.body.recipient,
    status: "pending"
  });
  res.status(201).json(message);
}));
router2.post("/whatsapp/send-template", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const { templateId, recipient, phoneNumberId, variables } = req.body;
  if (!templateId || !recipient || !phoneNumberId) {
    throw new ValidationError("templateId, recipient, and phoneNumberId are required");
  }
  const template = await supabaseService.getTemplateById(templateId);
  if (!template || template.userId !== profile.id) {
    throw new NotFoundError("Template not found");
  }
  try {
    validateMetaTemplate(template.content, template.variables || []);
  } catch (err) {
    if (err instanceof MetaTemplateValidationError) {
      return res.status(400).json({ error: `Meta validation failed: ${err.message}` });
    }
    throw err;
  }
  const missingVars = (template.variables || []).filter((v) => !(v in (variables || {})));
  if (missingVars.length > 0) {
    return res.status(400).json({ error: `Missing variables: ${missingVars.join(", ")}` });
  }
  const phoneNumber = await supabaseService.getPhoneNumberById(phoneNumberId);
  if (!phoneNumber || phoneNumber.userId !== profile.id) {
    throw new NotFoundError("Phone number not found");
  }
  if (!phoneNumber.providerId) {
    throw new ValidationError("Phone number does not have a WhatsApp provider ID configured");
  }
  let contentToSend = template.content;
  if (variables && Object.keys(variables).length > 0) {
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      contentToSend = contentToSend.replace(placeholder, String(value));
    });
  }
  const result = await flowService.sendDirectWhatsAppMessage({
    userId: profile.id,
    phoneNumberId: phoneNumber.id,
    recipient,
    message: contentToSend
  });
  if (!result.success) {
    throw new Error(result.error || "Failed to send WhatsApp message");
  }
  res.status(200).json({
    success: true,
    messageId: result.messageId,
    message: "Template sent successfully"
  });
}));
router2.post("/whatsapp/simulate-missed-call", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const {
    callerNumber,
    phoneNumberId,
    locationId
  } = req.body;
  if (!callerNumber || !phoneNumberId || !locationId) {
    throw new ValidationError("callerNumber, phoneNumberId, and locationId are required");
  }
  const phoneNumber = await supabaseService.getPhoneNumberById(phoneNumberId);
  if (!phoneNumber || phoneNumber.userId !== profile.id) {
    throw new NotFoundError("Phone number not found");
  }
  const location = await supabaseService.getLocationById(locationId);
  if (!location || location.userId !== profile.id) {
    throw new NotFoundError("Location not found");
  }
  await supabaseService.createCall({
    userId: profile.id,
    phoneNumberId: phoneNumber.id,
    callerNumber,
    status: "missed",
    duration: 0,
    routedToLocation: location.id,
    callType: "inbound"
  });
  const result = await flowService.handleMissedCallWithWhatsApp({
    callerNumber,
    phoneNumberId: phoneNumber.id,
    locationId: location.id,
    userId: profile.id
  });
  res.status(200).json({
    success: result.success,
    messageId: result.messageId,
    template: result.template,
    error: result.error,
    message: result.success ? "Missed call processed and template sent successfully" : "Missed call processed but template sending failed"
  });
}));
router2.get("/whatsapp/conversation/:recipient", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const recipient = req.params.recipient;
  const limit = parseInt(req.query.limit) || 50;
  const messages = await supabaseService.getConversationHistory(profile.id, recipient, limit);
  res.json({
    recipient,
    messages,
    count: messages.length
  });
}));
router2.get("/phone-numbers", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const phoneNumbers = await supabaseService.getPhoneNumbers(profile.id);
  res.json({ phoneNumbers });
}));
router2.post("/phone-numbers", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const phoneNumber = await supabaseService.createPhoneNumber({
    ...req.body,
    userId: profile.id
  });
  res.status(201).json(phoneNumber);
}));
router2.put("/phone-numbers/:id", requireAuth, asyncHandler(async (req, res) => {
  const phoneNumberId = parseInt(req.params.id);
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const updated = await supabaseService.updatePhoneNumber(phoneNumberId, req.body);
  res.json(updated);
}));
router2.get("/routing-rules", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const rules = await supabaseService.getRoutingRules(profile.id);
  res.json({ rules });
}));
router2.post("/routing-rules", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const rule = await supabaseService.createRoutingRule({
    ...req.body,
    userId: profile.id
  });
  res.status(201).json(rule);
}));
router2.get("/flow/preferences", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const preferences = await flowService.getUserFlowPreferences(profile.id.toString());
  res.json(preferences);
}));
router2.put("/flow/preferences", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  await flowService.updateUserFlowPreferences({
    userId: profile.id.toString(),
    ...req.body
  });
  res.json({ success: true });
}));
router2.get("/flow/sections", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const sections = await flowService.getVisibleSections(profile.id.toString());
  res.json(sections);
}));
router2.post("/flow/post-call", requireAuth, asyncHandler(async (req, res) => {
  const validation = postCallEventSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid post-call event data");
  }
  const result = await flowService.handleMissedCall(validation.data);
  res.json(result);
}));
router2.post("/flow/send-template", requireAuth, asyncHandler(async (req, res) => {
  const validation = templateCompletionSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid template completion data");
  }
  const result = await flowService.autoCompleteAndSendTemplate(validation.data);
  res.json(result);
}));
router2.post("/flow/connect-chatbot", requireAuth, asyncHandler(async (req, res) => {
  const { botId, initialMessage } = req.body;
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const result = await flowService.autoRouteToChatbot(botId, profile.id.toString(), initialMessage);
  res.json(result);
}));
router2.get("/flow/call-events", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const events = await flowService.getUserCallEvents(profile.id.toString());
  res.json({ events });
}));
router2.get("/flow/template-completions", requireAuth, asyncHandler(async (req, res) => {
  const profile = await supabaseService.getUserByAuthId(req.user.id);
  if (!profile) throw new NotFoundError("User not found");
  const completions = await flowService.getTemplateCompletions(profile.id.toString());
  res.json({ completions });
}));
router2.get("/providers", requireAuth, asyncHandler(async (req, res) => {
  const providers = providerService.getActiveProviders();
  res.json({
    providers: providers.map((p) => ({
      name: p.name,
      capabilities: p.capabilities,
      isActive: p.isActive
    }))
  });
}));
router2.post("/providers/generate-number", requireAuth, asyncHandler(async (req, res) => {
  const { countryCode = "34", provider } = req.body;
  const result = await providerService.generateVirtualNumber(countryCode, provider);
  res.json(result);
}));
router2.post("/providers/send-message", requireAuth, asyncHandler(async (req, res) => {
  const { to, message, type = "whatsapp", provider } = req.body;
  const result = type === "sms" ? await providerService.sendSMS(to, message, provider) : await providerService.sendWhatsApp(to, message, provider);
  res.json(result);
}));
var api_routes_default = router2;

// src/routes/webhook.routes.ts
import { Router as Router3 } from "express";
import express from "express";
var router3 = Router3();
router3.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      res.status(400).send("Missing stripe-signature header");
      return;
    }
    let event;
    try {
      event = stripeService.constructWebhookEvent(req.body, sig);
    } catch (err) {
      console.error("\u26A0\uFE0F Webhook signature verification failed:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    console.log(`\u2705 Received Stripe event: ${event.type}`);
    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutCompleted(event);
          break;
        case "payment_intent.succeeded":
          await handlePaymentSucceeded(event);
          break;
        case "payment_intent.payment_failed":
          await handlePaymentFailed(event);
          break;
        case "customer.subscription.created":
          await handleSubscriptionCreated(event);
          break;
        case "customer.subscription.updated":
          await handleSubscriptionUpdated(event);
          break;
        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(event);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({
        error: "Webhook processing failed",
        type: event.type
      });
    }
  }
);
router3.get(
  "/whatsapp",
  asyncHandler(async (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    console.log("\u{1F50D} Webhook verification request:", { mode, token: token ? "***" : "missing" });
    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log("\u2705 Webhook verified successfully");
      res.status(200).send(challenge);
      return;
    }
    console.error("\u274C Webhook verification failed");
    throw new ValidationError("Invalid verification token");
  })
);
router3.post(
  "/whatsapp",
  asyncHandler(async (req, res) => {
    const body = req.body;
    console.log("\u{1F4EC} Webhook received:", JSON.stringify(body, null, 2));
    if (!body?.entry || !Array.isArray(body.entry)) {
      console.error("\u274C Invalid webhook payload structure");
      throw new ValidationError("Invalid webhook payload");
    }
    for (const entry of body.entry) {
      const changes = entry.changes;
      if (!changes || !Array.isArray(changes)) continue;
      for (const change of changes) {
        const value = change.value;
        if (value?.messages && Array.isArray(value.messages)) {
          await handleIncomingMessages(value);
        }
        if (value?.statuses && Array.isArray(value.statuses)) {
          await handleMessageStatuses(value);
        }
      }
    }
    res.status(200).json({ success: true });
  })
);
async function handleCheckoutCompleted(event) {
  const session = event.data.object;
  const email = session.customer_details?.email || session.customer_email;
  if (!email) throw new Error("No email found in checkout session");
  console.log("\u{1F4E7} Processing checkout for:", email);
  const password = session.metadata?.password;
  if (!password) throw new Error("Password is required for registration");
  console.log("\u2705 Password found in metadata");
  const selections = session.metadata?.selections ? JSON.parse(session.metadata.selections) : [];
  const userMeta = {
    stripe_session_id: session.id,
    stripe_customer_id: session.customer ?? null
  };
  let authUser;
  try {
    const { data, error } = await database_default.auth.admin.createUser({
      email,
      password,
      user_metadata: userMeta,
      email_confirm: true
    });
    if (error) {
      if (error.code === "email_exists") {
        console.log("\u26A0\uFE0F User already exists, fetching...");
        const { data: listData, error: listError } = await database_default.auth.admin.listUsers();
        if (listError) throw listError;
        authUser = listData.users.find((u) => u.email === email);
        if (!authUser) throw new Error("User exists but could not be retrieved");
      } else {
        throw error;
      }
    } else {
      authUser = data?.user;
    }
  } catch (err) {
    console.error("Failed to create/find auth user:", err);
    throw err;
  }
  if (!authUser) throw new Error("Could not obtain auth user");
  const authId = authUser.id;
  const { data: existingUser } = await database_default.from("users").select("*").eq("email", email).single();
  let userRecord = existingUser;
  if (userRecord) {
    if (authId && userRecord.auth_id !== authId) {
      await database_default.from("users").update({ auth_id: authId }).eq("id", userRecord.id);
      userRecord.auth_id = authId;
    }
  } else {
    userRecord = await supabaseService.createUser({
      auth_id: authId,
      username: session.metadata?.username || email.split("@")[0],
      email,
      companyName: session.metadata?.companyName || "",
      termsAccepted: true,
      termsAcceptedAt: /* @__PURE__ */ new Date(),
      subscriptionStatus: "active"
    });
  }
  const purchasedSelections = selections.length > 0 ? selections : [{ planType: "templates", quantity: 1 }];
  await supabaseService.recordPurchasedLocations(userRecord.id, purchasedSelections);
  console.log("\u{1F389} Checkout completed successfully!");
  console.log("\u{1F4E7} Email:", email);
  console.log("\u{1F194} User ID:", userRecord.id);
  console.log("\u{1F511} Auth ID:", authId);
}
async function handlePaymentSucceeded(event) {
  const paymentIntent = event.data.object;
  console.log("\u2705 Payment succeeded:", paymentIntent.id);
  if (paymentIntent.metadata?.userId) {
    console.log(`Payment succeeded for user: ${paymentIntent.metadata.userId}`);
  }
}
async function handlePaymentFailed(event) {
  const paymentIntent = event.data.object;
  console.error("\u274C Payment failed:", paymentIntent.id);
  if (paymentIntent.metadata?.userId) {
    console.log(`Notify user: ${paymentIntent.metadata.userId}`);
  }
}
async function handleSubscriptionCreated(event) {
  const subscription = event.data.object;
  console.log("\u2705 Subscription created:", subscription.id);
}
async function handleSubscriptionUpdated(event) {
  const subscription = event.data.object;
  console.log("\u{1F4DD} Subscription updated:", subscription.id);
}
async function handleSubscriptionDeleted(event) {
  const subscription = event.data.object;
  console.log("\u274C Subscription deleted:", subscription.id);
}
async function handleIncomingMessages(value) {
  const phoneNumberId = value.metadata?.phone_number_id;
  const messages = value.messages;
  if (!phoneNumberId || !messages || messages.length === 0) return;
  console.log(`\u{1F4E8} Processing ${messages.length} incoming message(s)`);
  for (const messageEvent of messages) {
    try {
      const from = messageEvent.from;
      const messageId = messageEvent.id;
      let content = "";
      if (messageEvent.type === "text" && messageEvent.text?.body) {
        content = messageEvent.text.body;
      } else if (messageEvent.type === "interactive") {
        if (messageEvent.interactive?.button_reply) {
          content = messageEvent.interactive.button_reply.title;
        } else if (messageEvent.interactive?.list_reply) {
          content = messageEvent.interactive.list_reply.title;
        }
      } else if (messageEvent.type === "image") {
        content = "[Imagen recibida]";
      } else if (messageEvent.type === "document") {
        content = "[Documento recibido]";
      } else if (messageEvent.type === "audio") {
        content = "[Audio recibido]";
      } else if (messageEvent.type === "video") {
        content = "[Video recibido]";
      } else {
        content = `[Mensaje tipo: ${messageEvent.type}]`;
      }
      console.log(`\u{1F4E9} Message from ${from}: ${content.substring(0, 50)}`);
      const phoneNumber = await supabaseService.getPhoneNumberByProviderId(phoneNumberId);
      if (!phoneNumber) {
        console.error(`\u274C Phone number not found for provider_id: ${phoneNumberId}`);
        continue;
      }
      await supabaseService.createMessage({
        userId: phoneNumber.userId,
        phoneNumberId: phoneNumber.id,
        type: "WhatsApp",
        content,
        recipient: from,
        status: "received",
        direction: "inbound",
        whatsappMessageId: messageId
      });
      console.log(`\u2705 Message saved to database`);
    } catch (error) {
      console.error("Error processing incoming message:", error);
    }
  }
}
async function handleMessageStatuses(value) {
  const statuses = value.statuses;
  if (!statuses || statuses.length === 0) return;
  console.log(`\u{1F4CA} Processing ${statuses.length} status update(s)`);
  for (const status of statuses) {
    try {
      const messageId = status.id;
      const newStatus = status.status;
      console.log(`\u{1F4C8} Status update for message ${messageId}: ${newStatus}`);
      let mappedStatus = "sent";
      if (newStatus === "sent") mappedStatus = "sent";
      else if (newStatus === "delivered") mappedStatus = "delivered";
      else if (newStatus === "read") mappedStatus = "read";
      else if (newStatus === "failed") mappedStatus = "failed";
      await supabaseService.updateMessageStatus(messageId, mappedStatus);
      console.log(`\u2705 Message status updated to: ${mappedStatus}`);
      if (newStatus === "failed" && status.errors) {
        const errorMessage = status.errors.map((e) => `${e.code}: ${e.title}`).join(", ");
        await supabaseService.updateMessageError(messageId, errorMessage);
        console.error(`\u274C Message failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error processing status update:", error);
    }
  }
}
var webhook_routes_default = router3;

// src/index.ts
dotenv3.config();
var app = express2();
var PORT = process.env.PORT || 5001;
var FRONTEND_URL2 = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
app.use(cors({
  origin: FRONTEND_URL2,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use("/api/webhooks", webhook_routes_default);
app.use((req, res, next) => {
  const start = Date.now();
  let capturedJsonResponse;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      let logLine = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const sanitized = { ...capturedJsonResponse };
        delete sanitized.password;
        delete sanitized.token;
        delete sanitized.accessToken;
        delete sanitized.refreshToken;
        const jsonStr = JSON.stringify(sanitized);
        logLine += ` :: ${jsonStr.length > 100 ? jsonStr.slice(0, 97) + "..." : jsonStr}`;
      }
      console.log(logLine);
    }
  });
  next();
});
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});
app.use("/api", auth_routes_default);
app.use("/api", api_routes_default);
app.use(notFoundHandler);
app.use(errorHandler);
var server = createServer(app);
server.listen(PORT, () => {
  console.log("");
  console.log("\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
  console.log("\u2551   \u{1F680} UNMI Backend Server Started     \u2551");
  console.log("\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563");
  console.log(`\u2551   Port:        ${PORT.toString().padEnd(24)}\u2551`);
  console.log(`\u2551   Environment: ${(process.env.NODE_ENV || "development").padEnd(24)}\u2551`);
  console.log(`\u2551   Frontend:    ${FRONTEND_URL2.slice(0, 24).padEnd(24)}\u2551`);
  console.log("\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563");
  console.log("\u2551   Routes:                             \u2551");
  console.log("\u2551   GET  /health                        \u2551");
  console.log("\u2551   POST /api/register                  \u2551");
  console.log("\u2551   POST /api/login                     \u2551");
  console.log("\u2551   POST /api/logout                    \u2551");
  console.log("\u2551   GET  /api/user                      \u2551");
  console.log("\u2551   GET  /api/locations                 \u2551");
  console.log("\u2551   GET  /api/templates                 \u2551");
  console.log("\u2551   GET  /api/calls                     \u2551");
  console.log("\u2551   GET  /api/messages                  \u2551");
  console.log("\u2551   POST /api/webhooks/stripe           \u2551");
  console.log("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D");
  console.log("");
});
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
var index_default = app;
export {
  index_default as default
};
