import { users, locations, routingRules } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { User, InsertUser, Location, RoutingRule } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage {
  public sessionStore: session.Store;

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
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getLocations(userId: number): Promise<Location[]> {
    return await db
      .select()
      .from(locations)
      .where(eq(locations.userId, userId));
  }

  async createLocation(location: Omit<Location, "id">): Promise<Location> {
    const [newLocation] = await db
      .insert(locations)
      .values(location)
      .returning();
    return newLocation;
  }

  async getRules(userId: number): Promise<RoutingRule[]> {
    return await db
      .select()
      .from(routingRules)
      .where(eq(routingRules.userId, userId))
      .orderBy(routingRules.priority);
  }

  async createRule(rule: Omit<RoutingRule, "id">): Promise<RoutingRule> {
    const [newRule] = await db
      .insert(routingRules)
      .values(rule)
      .returning();
    return newRule;
  }
}

export const storage = new DatabaseStorage();