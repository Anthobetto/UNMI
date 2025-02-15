import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
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

export const phoneNumbers = pgTable("phone_numbers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  locationId: integer("location_id").notNull(),
  number: text("phone_number").notNull().unique(),
  active: boolean("active").notNull().default(true),
});

export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  phoneNumberId: integer("phone_number_id").notNull(),
  callerNumber: text("caller_number").notNull(),
  status: text("status").notNull(), // 'answered', 'missed', 'rejected'
  duration: integer("duration"), // in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'missed_call', 'after_hours', 'welcome'
});

// Define message type as a const for type safety
export const MessageType = {
  SMS: 'SMS',
  WhatsApp: 'WhatsApp'
} as const;

export type MessageTypeValue = typeof MessageType[keyof typeof MessageType];

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  callId: integer("call_id"),  // Optional, as messages can be sent without a call
  type: text("type").notNull().$type<MessageTypeValue>(),
  content: text("content").notNull(),
  recipient: text("recipient").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const routingRules = pgTable("routing_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  locationId: integer("location_id").notNull(),
  priority: integer("priority").notNull(),
  conditions: jsonb("conditions").notNull(),
});

// Create schemas
export const insertUserSchema = createInsertSchema(users);
export const insertLocationSchema = createInsertSchema(locations);
export const insertTemplateSchema = createInsertSchema(templates);
export const insertRoutingRuleSchema = createInsertSchema(routingRules);
export const insertMessageSchema = createInsertSchema(messages);
export const insertPhoneNumberSchema = createInsertSchema(phoneNumbers);
export const insertCallSchema = createInsertSchema(calls);

// Export types
export type User = typeof users.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type RoutingRule = typeof routingRules.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type PhoneNumber = typeof phoneNumbers.$inferSelect;
export type Call = typeof calls.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type InsertRoutingRule = z.infer<typeof insertRoutingRuleSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertPhoneNumber = z.infer<typeof insertPhoneNumberSchema>;
export type InsertCall = z.infer<typeof insertCallSchema>;