import { IStorage } from "./types";
import {
  User, Location, Template, RoutingRule,
  InsertUser, InsertLocation, InsertTemplate, InsertRoutingRule
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private locations: Map<number, Location>;
  private templates: Map<number, Template>;
  private routingRules: Map<number, RoutingRule>;
  sessionStore: session.Store;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.locations = new Map();
    this.templates = new Map();
    this.routingRules = new Map();
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
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getLocations(userId: number): Promise<Location[]> {
    return Array.from(this.locations.values()).filter(
      (location) => location.userId === userId
    );
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = this.currentId++;
    const location = { ...insertLocation, id };
    this.locations.set(id, location);
    return location;
  }

  async getTemplates(userId: number): Promise<Template[]> {
    return Array.from(this.templates.values()).filter(
      (template) => template.userId === userId
    );
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = this.currentId++;
    const template = { ...insertTemplate, id };
    this.templates.set(id, template);
    return template;
  }

  async getRoutingRules(userId: number): Promise<RoutingRule[]> {
    return Array.from(this.routingRules.values()).filter(
      (rule) => rule.userId === userId
    );
  }

  async createRoutingRule(insertRule: InsertRoutingRule): Promise<RoutingRule> {
    const id = this.currentId++;
    const rule = { ...insertRule, id };
    this.routingRules.set(id, rule);
    return rule;
  }
}

export const storage = new MemStorage();
