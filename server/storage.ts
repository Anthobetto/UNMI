import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";
import type { User, InsertUser } from "@shared/schema";

export class DatabaseStorage {
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
      console.log('Creating new user:', { ...userData, password_hash: '[REDACTED]' });
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