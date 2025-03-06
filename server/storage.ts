import session from "express-session";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";
import type { User, InsertUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'sessions'
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      console.log('Getting user by ID:', id);
      const [user] = await db.select().from(users).where(eq(users.id, id));
      console.log('Found user:', user ? 'yes' : 'no');
      return user;
    } catch (error) {
      console.error('Error in getUser:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log('Getting user by username:', username);
      const [user] = await db.select().from(users).where(eq(users.username, username));
      console.log('Found user:', user ? 'yes' : 'no');
      return user;
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      throw error;
    }
  }

  async createUser(userData: Omit<InsertUser, "id">): Promise<User> {
    try {
      console.log('Creating new user:', { ...userData, password: '[REDACTED]' });
      const [user] = await db.insert(users).values(userData).returning();
      console.log('User created successfully:', user.id);
      return user;
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();

// Type definitions for IStorage interface
export interface IStorage {
  sessionStore: session.Store;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(userData: Omit<InsertUser, "id">): Promise<User>;
}

//Necessary type definitions (replace with your actual types)
type Content = any;
type InsertContent = any;
type Group = any;
type InsertGroup = any;
type Location = any;
type InsertLocation = any;
type PhoneNumber = any;
type InsertPhoneNumber = any;
type Template = any;
type InsertTemplate = any;
type Call = any;
type InsertCall = any;
type Message = any;
type InsertMessage = any;
type RoutingRule = any;
type InsertRoutingRule = any;