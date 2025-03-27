import {
  User, Location, Template, RoutingRule, PhoneNumber, Call,
  InsertUser, InsertLocation, InsertTemplate, InsertRoutingRule,
  InsertPhoneNumber, InsertCall,
  Message, InsertMessage, messages,
  Group, InsertGroup, groups,
  Content, InsertContent, contents,
  users, locations, templates, routingRules, phoneNumbers, calls,
} from "@shared/schema";
import session from "express-session";
import { db as supabaseDb } from "./services/supabase";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

interface IStorage {
  sessionStore: session.Store;
  getContents(userId: number): Promise<Content[]>;
  getContentsByCategory(userId: number, category: string): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getGroups(userId: number): Promise<Group[]>;
  createGroup(insertGroup: InsertGroup): Promise<Group>;
  getLocations(userId: number): Promise<Location[]>;
  getGroupLocations(groupId: number): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  getPhoneNumbers(userId: number): Promise<PhoneNumber[]>;
  getLocationPhoneNumbers(locationId: number): Promise<PhoneNumber[]>;
  getLinkedNumbers(phoneNumber: string): Promise<PhoneNumber[]>;
  createPhoneNumber(insertPhoneNumber: InsertPhoneNumber): Promise<PhoneNumber>;
  getTemplates(userId: number): Promise<Template[]>;
  getLocationTemplates(locationId: number): Promise<Template[]>;
  getGroupTemplates(groupId: number): Promise<Template[]>;
  createTemplate(insertTemplate: InsertTemplate): Promise<Template>;
  getCalls(userId: number): Promise<Call[]>;
  getCallsByPhoneNumber(phoneNumberId: number): Promise<Call[]>;
  createCall(insertCall: InsertCall): Promise<Call>;
  getRoutingRules(userId: number): Promise<RoutingRule[]>;
  createRoutingRule(insertRule: InsertRoutingRule): Promise<RoutingRule>;
  getMessages(userId: number): Promise<Message[]>;
  createMessage(insertMessage: InsertMessage): Promise<Message>;
  getMessageStats(userId: number): Promise<{ sms: number; whatsapp: number }>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Helper method to convert camelCase to snake_case for Supabase
  private toSnakeCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    return Object.keys(obj).reduce((acc: any, key) => {
      const newKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      acc[newKey] = this.toSnakeCase(obj[key]);
      return acc;
    }, {});
  }

  // Content management methods
  async getContents(userId: number): Promise<Content[]> {
    const { data, error } = await supabaseDb.contents.getByUser(userId);
    if (error) throw error;
    return data || [];
  }

  async getContentsByCategory(userId: number, category: string): Promise<Content[]> {
    const { data, error } = await supabaseDb.contents.getByCategory(userId, category);
    if (error) throw error;
    return data || [];
  }

  async createContent(content: InsertContent): Promise<Content> {
    const { data, error } = await supabaseDb.contents.create(this.toSnakeCase(content));
    if (error) throw error;
    return data;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabaseDb.users.getById(id);
    if (error) throw error;
    return data || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabaseDb.users.getByUsername(username);
    if (error) throw error;
    return data || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabaseDb.users.create(this.toSnakeCase(insertUser));
    if (error) throw error;
    return data;
  }

  // Group methods
  async getGroups(userId: number): Promise<Group[]> {
    const { data, error } = await supabaseDb.groups.getByUser(userId);
    if (error) throw error;
    return data || [];
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const { data, error } = await supabaseDb.groups.create(this.toSnakeCase(insertGroup));
    if (error) throw error;
    return data;
  }

  // Location methods
  async getLocations(userId: number): Promise<Location[]> {
    const { data, error } = await supabaseDb.locations.getByUser(userId);
    if (error) throw error;
    return data || [];
  }

  async getGroupLocations(groupId: number): Promise<Location[]> {
    const { data, error } = await supabaseDb.locations.getByGroup(groupId);
    if (error) throw error;
    return data || [];
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const { data: existingLocations } = await supabaseDb.locations.getByUser(location.userId);
    const isFirstLocation = !existingLocations || existingLocations.length === 0;

    const { data, error } = await supabaseDb.locations.create(this.toSnakeCase({
      ...location,
      is_first_location: isFirstLocation,
      trial_start_date: isFirstLocation ? new Date().toISOString() : null,
    }));
    if (error) throw error;
    return data;
  }

  // Phone number methods
  async getPhoneNumbers(userId: number): Promise<PhoneNumber[]> {
    const { data, error } = await supabaseDb.phoneNumbers.getByUser(userId);
    if (error) throw error;
    return data || [];
  }

  async getLocationPhoneNumbers(locationId: number): Promise<PhoneNumber[]> {
    const { data, error } = await supabaseDb.phoneNumbers.getByLocation(locationId);
    if (error) throw error;
    return data || [];
  }

  async getLinkedNumbers(phoneNumber: string): Promise<PhoneNumber[]> {
    const { data, error } = await supabaseDb.phoneNumbers.getLinked(phoneNumber);
    if (error) throw error;
    return data || [];
  }

  async createPhoneNumber(phoneNumber: InsertPhoneNumber): Promise<PhoneNumber> {
    const { data, error } = await supabaseDb.phoneNumbers.create(this.toSnakeCase({
      user_id: phoneNumber.userId,
      location_id: phoneNumber.locationId,
      number: phoneNumber.number,
      type: phoneNumber.type,
      active: phoneNumber.active,
      linked_number: phoneNumber.linkedNumber
    }));
    if (error) throw error;
    return data;
  }

  // Template methods
  async getTemplates(userId: number): Promise<Template[]> {
    const { data, error } = await supabaseDb.templates.getByUser(userId);
    if (error) throw error;
    return data || [];
  }

  async getLocationTemplates(locationId: number): Promise<Template[]> {
    const { data, error } = await supabaseDb.templates.getByLocation(locationId);
    if (error) throw error;
    return data || [];
  }

  async getGroupTemplates(groupId: number): Promise<Template[]> {
    const { data, error } = await supabaseDb.templates.getByGroup(groupId);
    if (error) throw error;
    return data || [];
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const { data, error } = await supabaseDb.templates.create(this.toSnakeCase({
      user_id: template.userId,
      location_id: template.locationId,
      group_id: template.groupId,
      name: template.name,
      content: template.content,
      type: template.type,
      variables: template.variables
    }));
    if (error) throw error;
    return data;
  }

  // Call methods
  async getCalls(userId: number): Promise<Call[]> {
    const { data, error } = await supabaseDb.calls.getByUser(userId);
    if (error) throw error;
    return data || [];
  }

  async getCallsByPhoneNumber(phoneNumberId: number): Promise<Call[]> {
    const { data, error } = await supabaseDb.calls.getByPhoneNumber(phoneNumberId);
    if (error) throw error;
    return data || [];
  }

  async createCall(call: InsertCall): Promise<Call> {
    const { data, error } = await supabaseDb.calls.create(this.toSnakeCase({
      user_id: call.userId,
      phone_number_id: call.phoneNumberId,
      caller_number: call.callerNumber,
      status: call.status,
      duration: call.duration,
      created_at: call.createdAt?.toISOString(),
      routed_to_location: call.routedToLocation,
      call_type: call.callType
    }));
    if (error) throw error;
    return data;
  }

  // Routing rule methods
  async getRoutingRules(userId: number): Promise<RoutingRule[]> {
    const { data, error } = await supabaseDb.routingRules.getByUser(userId);
    if (error) throw error;
    return data || [];
  }

  async createRoutingRule(rule: InsertRoutingRule): Promise<RoutingRule> {
    const { data, error } = await supabaseDb.routingRules.create(this.toSnakeCase(rule));
    if (error) throw error;
    return data;
  }

  // Message methods
  async getMessages(userId: number): Promise<Message[]> {
    const { data, error } = await supabaseDb.messages.getByUser(userId);
    if (error) throw error;
    return data || [];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const { data, error } = await supabaseDb.messages.create(this.toSnakeCase({
      user_id: message.userId,
      phone_number_id: message.phoneNumberId,
      type: message.type,
      content: message.content,
      recipient: message.recipient,
      status: message.status,
      created_at: message.createdAt?.toISOString()
    }));
    if (error) throw error;
    return data;
  }

  async getMessageStats(userId: number): Promise<{ sms: number; whatsapp: number }> {
    const { data: messages, error } = await supabaseDb.messages.getByUser(userId);
    if (error) throw error;

    return {
      sms: (messages || []).filter(m => m.type === 'SMS').length,
      whatsapp: (messages || []).filter(m => m.type === 'WhatsApp').length
    };
  }
}

export const storage = new DatabaseStorage();