import { 
  users, locations, phoneNumbers, templates, calls, messages,
  type User, type Location, type Template, type PhoneNumber, type Call, type Message,
  type InsertUser, type InsertLocation, type InsertTemplate, type InsertPhoneNumber, 
  type InsertCall, type InsertMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
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
  createPhoneNumber(phoneNumber: InsertPhoneNumber): Promise<PhoneNumber>;
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
  getPhoneNumberByNumber(number: string): Promise<PhoneNumber | undefined>;
  getTemplateByType(locationId: number, type: string): Promise<Template | undefined>;
  updateLocation(id: number, updates: Partial<Location>): Promise<Location>;
  getLocationByPaymentIntent(paymentIntentId: string): Promise<Location | undefined>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Location methods
  async getLocations(userId: number): Promise<Location[]> {
    return await db.select().from(locations).where(eq(locations.userId, userId));
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const [newLocation] = await db.insert(locations).values(location).returning();
    return newLocation;
  }

  async updateLocation(id: number, updates: Partial<Location>): Promise<Location> {
    const [updated] = await db.update(locations)
      .set(updates)
      .where(eq(locations.id, id))
      .returning();
    return updated;
  }

  async getLocationByPaymentIntent(paymentIntentId: string): Promise<Location | undefined> {
    const results = await db.select().from(locations)
      .where(eq(locations.paymentIntentId, paymentIntentId));
    return results[0];
  }

  // Phone number methods
  async getPhoneNumbers(userId: number): Promise<PhoneNumber[]> {
    return await db.select().from(phoneNumbers).where(eq(phoneNumbers.userId, userId));
  }

  async getLocationPhoneNumbers(locationId: number): Promise<PhoneNumber[]> {
    return await db.select().from(phoneNumbers).where(eq(phoneNumbers.locationId, locationId));
  }

  async createPhoneNumber(phoneNumber: InsertPhoneNumber): Promise<PhoneNumber> {
    const [newNumber] = await db.insert(phoneNumbers).values(phoneNumber).returning();
    return newNumber;
  }

  async getPhoneNumberByNumber(number: string): Promise<PhoneNumber | undefined> {
    const results = await db.select().from(phoneNumbers)
      .where(eq(phoneNumbers.number, number));
    return results[0];
  }

  // Template methods
  async getTemplates(userId: number): Promise<Template[]> {
    return await db.select().from(templates).where(eq(templates.userId, userId));
  }

  async getLocationTemplates(locationId: number): Promise<Template[]> {
    return await db.select().from(templates).where(eq(templates.locationId, locationId));
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db.insert(templates).values(template).returning();
    return newTemplate;
  }

  async getTemplateByType(locationId: number, type: string): Promise<Template | undefined> {
    const results = await db.select().from(templates)
      .where(and(
        eq(templates.locationId, locationId),
        eq(templates.type, type)
      ));
    return results[0];
  }

  // Call methods
  async getCalls(userId: number): Promise<Call[]> {
    return await db.select().from(calls).where(eq(calls.userId, userId));
  }

  async createCall(call: InsertCall): Promise<Call> {
    const [newCall] = await db.insert(calls).values(call).returning();
    return newCall;
  }

  // Message methods
  async getMessages(userId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.userId, userId));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }
  async getContents(userId: number): Promise<Content[]> {
    throw new Error("Method not implemented.");
  }
  async getContentsByCategory(userId: number, category: string): Promise<Content[]> {
    throw new Error("Method not implemented.");
  }
  async createContent(content: InsertContent): Promise<Content> {
    throw new Error("Method not implemented.");
  }
  async getGroups(userId: number): Promise<Group[]> {
    throw new Error("Method not implemented.");
  }
  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    throw new Error("Method not implemented.");
  }
  async getGroupLocations(groupId: number): Promise<Location[]> {
    throw new Error("Method not implemented.");
  }
  async getLinkedNumbers(phoneNumber: string): Promise<PhoneNumber[]> {
    throw new Error("Method not implemented.");
  }
  async getGroupTemplates(groupId: number): Promise<Template[]> {
    throw new Error("Method not implemented.");
  }
  async getCallsByPhoneNumber(phoneNumberId: number): Promise<Call[]> {
    throw new Error("Method not implemented.");
  }
  async getRoutingRules(userId: number): Promise<RoutingRule[]> {
    throw new Error("Method not implemented.");
  }
  async createRoutingRule(insertRule: InsertRoutingRule): Promise<RoutingRule> {
    throw new Error("Method not implemented.");
  }
  async getMessageStats(userId: number): Promise<{ sms: number; whatsapp: number }> {
    throw new Error("Method not implemented.");
  }

}

export const storage = new DatabaseStorage();