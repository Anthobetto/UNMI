import { IStorage } from "./types";
import {
  User, Location, Template, RoutingRule,
  InsertUser, InsertLocation, InsertTemplate, InsertRoutingRule,
  users, locations, templates, routingRules
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { Message, InsertMessage, messages } from "@shared/schema"; //Import missing types


const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

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

  async getLocations(userId: number): Promise<Location[]> {
    return db.select().from(locations).where(eq(locations.userId, userId));
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const [location] = await db.insert(locations).values(insertLocation).returning();
    return location;
  }

  async getTemplates(userId: number): Promise<Template[]> {
    return db.select().from(templates).where(eq(templates.userId, userId));
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db.insert(templates).values(insertTemplate).returning();
    return template;
  }

  async getRoutingRules(userId: number): Promise<RoutingRule[]> {
    return db.select().from(routingRules).where(eq(routingRules.userId, userId));
  }

  async createRoutingRule(insertRule: InsertRoutingRule): Promise<RoutingRule> {
    const [rule] = await db.insert(routingRules).values(insertRule).returning();
    return rule;
  }

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