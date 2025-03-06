import { pgTable, text, serial, integer, boolean, jsonb, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table - Core authentication and user management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  companyName: text("company_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  locations: many(locations),
  templates: many(templates),
  phoneNumbers: many(phoneNumbers),
  calls: many(calls),
  messages: many(messages)
}));

// Groups table - For organizing locations
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  sharedNumber: text("shared_number"),
  active: boolean("active").default(true),
});

// Groups relations
export const groupsRelations = relations(groups, ({ one, many }) => ({
  user: one(users, {
    fields: [groups.userId],
    references: [users.id],
  }),
  locations: many(locations)
}));

// Locations table - Business locations
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  groupId: integer("group_id").references(() => groups.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  timezone: text("timezone").default("UTC"),
  businessHours: jsonb("business_hours"),
  trialStartDate: timestamp("trial_start_date"),
  isFirstLocation: boolean("is_first_location").default(false),
  paymentIntentId: text("payment_intent_id"),
  active: boolean("active").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Locations relations
export const locationsRelations = relations(locations, ({ one, many }) => ({
  user: one(users, {
    fields: [locations.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [locations.groupId],
    references: [groups.id],
  }),
  phoneNumbers: many(phoneNumbers),
  templates: many(templates)
}));

// Phone numbers table
export const phoneNumbers = pgTable("phone_numbers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  locationId: integer("location_id").notNull().references(() => locations.id),
  number: text("phone_number").notNull().unique(),
  type: text("type").notNull(), // 'fixed', 'mobile', 'shared'
  linkedNumber: text("linked_number"),
  channel: text("channel").notNull(), // 'whatsapp', 'sms', or 'both'
  active: boolean("active").notNull().default(true),
  forwardingEnabled: boolean("forwarding_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Phone numbers relations
export const phoneNumbersRelations = relations(phoneNumbers, ({ one, many }) => ({
  user: one(users, {
    fields: [phoneNumbers.userId],
    references: [users.id],
  }),
  location: one(locations, {
    fields: [phoneNumbers.locationId],
    references: [locations.id],
  }),
  calls: many(calls),
  messages: many(messages)
}));

// Message templates
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  locationId: integer("location_id").references(() => locations.id),
  groupId: integer("group_id").references(() => groups.id),
  name: text("name").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'missed_call', 'after_hours', 'welcome'
  channel: text("channel").notNull(), // 'whatsapp', 'sms', or 'both'
  variables: jsonb("variables").default('{}'),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Templates relations
export const templatesRelations = relations(templates, ({ one }) => ({
  user: one(users, {
    fields: [templates.userId],
    references: [users.id],
  }),
  location: one(locations, {
    fields: [templates.locationId],
    references: [locations.id],
  }),
  group: one(groups, {
    fields: [templates.groupId],
    references: [groups.id],
  })
}));

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  phoneNumberId: integer("phone_number_id").notNull().references(() => phoneNumbers.id),
  type: text("type").notNull(), // 'SMS' or 'WhatsApp'
  content: text("content").notNull(),
  recipient: text("recipient").notNull(),
  status: text("status").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Messages relations
export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  phoneNumber: one(phoneNumbers, {
    fields: [messages.phoneNumberId],
    references: [phoneNumbers.id],
  })
}));

// Calls table
export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  phoneNumberId: integer("phone_number_id").notNull().references(() => phoneNumbers.id),
  callerNumber: text("caller_number").notNull(),
  status: text("status").notNull(), // 'answered', 'missed', 'rejected'
  duration: integer("duration"), // in seconds
  routedToLocation: integer("routed_to_location").references(() => locations.id),
  callType: text("call_type"), // 'direct', 'forwarded', 'ivr'
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Calls relations
export const callsRelations = relations(calls, ({ one }) => ({
  user: one(users, {
    fields: [calls.userId],
    references: [users.id],
  }),
  phoneNumber: one(phoneNumbers, {
    fields: [calls.phoneNumberId],
    references: [phoneNumbers.id],
  }),
  routedLocation: one(locations, {
    fields: [calls.routedToLocation],
    references: [locations.id],
  })
}));

// Create insert schemas with validation
export const insertUserSchema = createInsertSchema(users).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  companyName: z.string().min(2, "Company name is required")
});

export const insertGroupSchema = createInsertSchema(groups);
export const insertLocationSchema = createInsertSchema(locations);
export const insertPhoneNumberSchema = createInsertSchema(phoneNumbers);
export const insertTemplateSchema = createInsertSchema(templates);
export const insertMessageSchema = createInsertSchema(messages);
export const insertCallSchema = createInsertSchema(calls);

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type PhoneNumber = typeof phoneNumbers.$inferSelect;
export type InsertPhoneNumber = z.infer<typeof insertPhoneNumberSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Call = typeof calls.$inferSelect;
export type InsertCall = z.infer<typeof insertCallSchema>;