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

  // Content management methods
  async getContents(userId: number): Promise<Content[]> {
    return db.select().from(contents).where(eq(contents.userId, userId));
  }

  async getContentsByCategory(userId: number, category: string): Promise<Content[]> {
    return db.select()
      .from(contents)
      .where(eq(contents.userId, userId))
      .where(eq(contents.category, category));
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const [content] = await db.insert(contents)
      .values(insertContent)
      .returning();
    return content;
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

  // Group methods
  async getGroups(userId: number): Promise<Group[]> {
    return db.select().from(groups).where(eq(groups.userId, userId));
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const [group] = await db.insert(groups).values(insertGroup).returning();
    return group;
  }

  // Location methods with group support
  async getLocations(userId: number): Promise<Location[]> {
    return db.select().from(locations).where(eq(locations.userId, userId));
  }

  async getGroupLocations(groupId: number): Promise<Location[]> {
    return db.select().from(locations).where(eq(locations.groupId, groupId));
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    // Check if this is the first location for the user
    const existingLocations = await db
      .select()
      .from(locations)
      .where(eq(locations.userId, location.userId));

    const isFirstLocation = existingLocations.length === 0;

    const result = await db
      .insert(locations)
      .values({
        ...location,
        isFirstLocation,
        trialStartDate: isFirstLocation ? new Date() : null,
      })
      .returning();
    return result[0];
  }

  // Enhanced phone number methods
  async getPhoneNumbers(userId: number): Promise<PhoneNumber[]> {
    return db.select().from(phoneNumbers).where(eq(phoneNumbers.userId, userId));
  }

  async getLocationPhoneNumbers(locationId: number): Promise<PhoneNumber[]> {
    return db.select()
      .from(phoneNumbers)
      .where(eq(phoneNumbers.locationId, locationId));
  }

  async getLinkedNumbers(phoneNumber: string): Promise<PhoneNumber[]> {
    return db.select()
      .from(phoneNumbers)
      .where(eq(phoneNumbers.linkedNumber, phoneNumber));
  }

  async createPhoneNumber(insertPhoneNumber: InsertPhoneNumber): Promise<PhoneNumber> {
    const [phoneNumber] = await db.insert(phoneNumbers)
      .values(insertPhoneNumber)
      .returning();
    return phoneNumber;
  }

  // Enhanced template methods
  async getTemplates(userId: number): Promise<Template[]> {
    return db.select().from(templates).where(eq(templates.userId, userId));
  }

  async getLocationTemplates(locationId: number): Promise<Template[]> {
    return db.select()
      .from(templates)
      .where(eq(templates.locationId, locationId));
  }

  async getGroupTemplates(groupId: number): Promise<Template[]> {
    return db.select()
      .from(templates)
      .where(eq(templates.groupId, groupId));
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db.insert(templates).values(insertTemplate).returning();
    return template;
  }

  // Enhanced call methods
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
    const [message] = await db.insert(messages).values([insertMessage]).returning();
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