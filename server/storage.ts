import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";
import type { User, InsertUser } from "@shared/schema";

export class DatabaseStorage {
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error in getUser:', error);
      throw new Error('Failed to get user');
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      throw new Error('Failed to get user by username');
    }
  }

  async createUser(userData: Omit<InsertUser, "id">): Promise<User> {
    try {
      const [user] = await db.insert(users).values(userData).returning();
      return user;
    } catch (error) {
      console.error('Error in createUser:', error);
      throw new Error('Failed to create user');
    }
  }
}

export const storage = new DatabaseStorage();