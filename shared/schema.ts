import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  companyName: text("company_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  sharedNumber: text("shared_number"),
  active: boolean("active").default(true),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  groupId: integer("group_id"),  // Optional, for locations that belong to a group
  name: text("name").notNull(),
  address: text("address").notNull(),
  timezone: text("timezone").default("UTC"),
  businessHours: jsonb("business_hours"), // Store opening hours
  trialStartDate: timestamp("trial_start_date"),
  isFirstLocation: boolean("is_first_location").default(false),
});

export const phoneNumbers = pgTable("phone_numbers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  locationId: integer("location_id").notNull(),
  number: text("phone_number").notNull().unique(),
  type: text("type").notNull(), // 'fixed', 'mobile', 'shared'
  linkedNumber: text("linked_number"), // For fixed->mobile linking
  channel: text("channel").notNull(), // 'whatsapp', 'sms', or 'both'
  active: boolean("active").notNull().default(true),
  forwardingEnabled: boolean("forwarding_enabled").default(true),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  locationId: integer("location_id"), // Optional, for location-specific templates
  groupId: integer("group_id"), // Optional, for group-wide templates
  name: text("name").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'missed_call', 'after_hours', 'welcome'
  channel: text("channel").notNull(), // 'whatsapp', 'sms', or 'both'
  variables: jsonb("variables").default('{}'), // Dynamic variables for the template
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
  phoneNumberId: integer("phone_number_id").notNull(),
  type: text("type").notNull().$type<MessageTypeValue>(),
  content: text("content").notNull(),
  recipient: text("recipient").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  phoneNumberId: integer("phone_number_id").notNull(),
  callerNumber: text("caller_number").notNull(),
  status: text("status").notNull(), // 'answered', 'missed', 'rejected'
  duration: integer("duration"), // in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
  routedToLocation: integer("routed_to_location"), // For tracking call routing
  callType: text("call_type"), // 'direct', 'forwarded', 'ivr'
});

export const routingRules = pgTable("routing_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  locationId: integer("location_id").notNull(),
  priority: integer("priority").notNull(),
  conditions: jsonb("conditions").notNull(), // Store routing conditions
  forwardingNumber: text("forwarding_number"), // Number to forward to
  ivrOptions: jsonb("ivr_options"), // IVR menu configuration
});

export const contents = pgTable("contents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'video', 'image', 'pdf'
  url: text("url").notNull(),
  category: text("category").notNull(), // 'learning', 'marketing', 'training'
  metadata: jsonb("metadata").default('{}'), // For storing additional info like dimensions, duration, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  active: boolean("active").default(true),
});

// Create schemas
export const insertUserSchema = createInsertSchema(users).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  companyName: z.string().min(2, "Company name is required")
});
export const insertGroupSchema = createInsertSchema(groups);
export const insertLocationSchema = createInsertSchema(locations);
export const insertTemplateSchema = createInsertSchema(templates);
export const insertRoutingRuleSchema = createInsertSchema(routingRules);
export const insertMessageSchema = createInsertSchema(messages);
export const insertPhoneNumberSchema = createInsertSchema(phoneNumbers);
export const insertCallSchema = createInsertSchema(calls);
export const insertContentSchema = createInsertSchema(contents);

// Export types
export type User = typeof users.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type RoutingRule = typeof routingRules.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type PhoneNumber = typeof phoneNumbers.$inferSelect;
export type Call = typeof calls.$inferSelect;
export type Content = typeof contents.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type InsertRoutingRule = z.infer<typeof insertRoutingRuleSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertPhoneNumber = z.infer<typeof insertPhoneNumberSchema>;
export type InsertCall = z.infer<typeof insertCallSchema>;
export type InsertContent = z.infer<typeof insertContentSchema>;