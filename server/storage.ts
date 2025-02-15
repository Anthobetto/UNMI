import { IStorage } from "./types";
import {
  User, Location, Template, RoutingRule, PhoneNumber, Call,
  InsertUser, InsertLocation, InsertTemplate, InsertRoutingRule,
  InsertPhoneNumber, InsertCall,
  users, locations, templates, routingRules, phoneNumbers, calls,
  Message, InsertMessage, messages
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Location methods
  async getLocations(userId: number): Promise<Location[]> {
    return db.select().from(locations).where(eq(locations.userId, userId));
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const [location] = await db.insert(locations).values(insertLocation).returning();
    return location;
  }

  // Phone number methods
  async getPhoneNumbers(userId: number): Promise<PhoneNumber[]> {
    return db.select().from(phoneNumbers).where(eq(phoneNumbers.userId, userId));
  }

  async getLocationPhoneNumbers(locationId: number): Promise<PhoneNumber[]> {
    return db.select()
      .from(phoneNumbers)
      .where(eq(phoneNumbers.locationId, locationId));
  }

  async createPhoneNumber(insertPhoneNumber: InsertPhoneNumber): Promise<PhoneNumber> {
    const [phoneNumber] = await db.insert(phoneNumbers)
      .values(insertPhoneNumber)
      .returning();
    return phoneNumber;
  }

  // Call methods
  async getCalls(userId: number): Promise<Call[]> {
    return db.select().from(calls).where(eq(calls.userId, userId));
  }

  async getCallsByPhoneNumber(phoneNumberId: number): Promise<Call[]> {
    return db.select()
      .from(calls)
      .where(eq(calls.phoneNumberId, phoneNumberId));
  }

  async createCall(insertCall: InsertCall): Promise<Call> {
    const [call] = await db.insert(calls).values(insertCall).returning();
    return call;
  }

  // Template methods
  async getTemplates(userId: number): Promise<Template[]> {
    return db.select().from(templates).where(eq(templates.userId, userId));
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db.insert(templates).values(insertTemplate).returning();
    return template;
  }

  // Routing rules methods
  async getRoutingRules(userId: number): Promise<RoutingRule[]> {
    return db.select().from(routingRules).where(eq(routingRules.userId, userId));
  }

  async createRoutingRule(insertRule: InsertRoutingRule): Promise<RoutingRule> {
    const [rule] = await db.insert(routingRules).values(insertRule).returning();
    return rule;
  }

  // Message methods
  async getMessages(userId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.userId, userId));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async getMessageStats(userId: number): Promise<{ sms: number; whatsapp: number }> {
    const userMessages = await this.getMessages(userId);
    return {
      sms: userMessages.filter(m => m.type === 'SMS').length,
      whatsapp: userMessages.filter(m => m.type === 'WhatsApp').length
    };
  }
}

export const storage = new DatabaseStorage();