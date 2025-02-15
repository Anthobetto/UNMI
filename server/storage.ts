import { IStorage } from "@shared/schema";
import { User, Location, RoutingRule, InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private locations: Map<number, Location>;
  private rules: Map<number, RoutingRule>;
  private currentId: number;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.locations = new Map();
    this.rules = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, plan: "basic" };
    this.users.set(id, user);
    return user;
  }

  async getLocations(userId: number): Promise<Location[]> {
    return Array.from(this.locations.values()).filter(
      (location) => location.userId === userId,
    );
  }

  async createLocation(location: Omit<Location, "id">): Promise<Location> {
    const id = this.currentId++;
    const newLocation = { ...location, id };
    this.locations.set(id, newLocation);
    return newLocation;
  }

  async getRules(userId: number): Promise<RoutingRule[]> {
    return Array.from(this.rules.values())
      .filter((rule) => rule.userId === userId)
      .sort((a, b) => a.priority - b.priority);
  }

  async createRule(rule: Omit<RoutingRule, "id">): Promise<RoutingRule> {
    const id = this.currentId++;
    const newRule = { ...rule, id };
    this.rules.set(id, newRule);
    return newRule;
  }
}

export const storage = new MemStorage();
