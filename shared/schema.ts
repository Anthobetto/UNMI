import { z } from "zod";

export interface User {
  id: number;
  username: string;
  password: string;
  companyName: string;
  plan: "basic" | "pro" | "enterprise";
}

export interface Location {
  id: number;
  userId: number;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
}

export interface RoutingRule {
  id: number;
  userId: number;
  locationId: number;
  priority: number;
  conditions: Record<string, any>;
  action: string;
}

export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  companyName: z.string().min(1, "Company name is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export const PRICING_TIERS = {
  basic: {
    name: "Basic",
    price: 29,
    features: ["Up to 3 locations", "Basic call routing", "Email support"],
  },
  pro: {
    name: "Professional",
    price: 79,
    features: [
      "Up to 10 locations",
      "Advanced routing rules",
      "Priority support",
      "Call analytics",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 199,
    features: [
      "Unlimited locations",
      "Custom routing logic",
      "24/7 phone support",
      "API access",
      "Dedicated account manager",
    ],
  },
} as const;

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getLocations(userId: number): Promise<Location[]>;
  createLocation(location: Omit<Location, "id">): Promise<Location>;
  getRules(userId: number): Promise<RoutingRule[]>;
  createRule(rule: Omit<RoutingRule, "id">): Promise<RoutingRule>;
  sessionStore: any;
}