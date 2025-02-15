import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  companyName: text("company_name").notNull(),
  plan: text("plan").default("basic").notNull(),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  businessType: text("business_type"),
});

export const routingRules = pgTable("routing_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  locationId: integer("location_id").notNull(),
  priority: integer("priority").notNull(),
  conditions: jsonb("conditions").notNull(),
  action: text("action").notNull(),
});

export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  locationId: integer("location_id").notNull(),
  phoneNumber: text("phone_number").notNull(),
  messageSent: text("message_sent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  externalLink: text("external_link"),
  isSystem: boolean("is_system").default(false).notNull(),
  type: text("type").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  companyName: true,
});

export const insertLocationSchema = createInsertSchema(locations);
export const insertRuleSchema = createInsertSchema(routingRules);

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  userId: true,
  isSystem: true,
});

export const insertCallSchema = createInsertSchema(calls).omit({
  id: true,
  userId: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type RoutingRule = typeof routingRules.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type Call = typeof calls.$inferSelect;

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