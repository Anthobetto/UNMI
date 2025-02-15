import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  companyName: text("company_name").notNull(),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  content: text("content").notNull(),
});

export const routingRules = pgTable("routing_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  locationId: integer("location_id").notNull(),
  priority: integer("priority").notNull(),
  conditions: jsonb("conditions").notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertLocationSchema = createInsertSchema(locations);
export const insertTemplateSchema = createInsertSchema(templates);
export const insertRoutingRuleSchema = createInsertSchema(routingRules);

export type User = typeof users.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type RoutingRule = typeof routingRules.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type InsertRoutingRule = z.infer<typeof insertRoutingRuleSchema>;
