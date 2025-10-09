// Copiado y mejorado del código base UNMI
import { z } from "zod";

// ==================
// USER SCHEMA
// ==================
export const userSchema = z.object({
  id: z.string().uuid(),
  auth_id: z.string().uuid(),
  username: z.string().min(3),
  email: z.string().email(),
  companyName: z.string().min(1),
  termsAccepted: z.boolean(),
  termsAcceptedAt: z.date().optional(),
  planType: z.enum(['templates', 'chatbots']).optional(),
  subscriptionStatus: z.enum(['active', 'inactive', 'trial', 'cancelled']).optional(),
});

export type User = z.infer<typeof userSchema>;

// ==================
// LOCATION SCHEMA
// ==================
export const locationSchema = z.object({
  id: z.number(),
  userId: z.string().uuid(),
  groupId: z.number().optional(),
  name: z.string().min(1),
  address: z.string().min(1),
  timezone: z.string().default('UTC'),
  businessHours: z.record(z.any()).optional(),
  trialStartDate: z.date().optional(),
  isFirstLocation: z.boolean().default(false),
});

export type Location = z.infer<typeof locationSchema>;

// ==================
// TEMPLATE SCHEMA
// ==================
export const templateTypeEnum = z.enum(['missed_call', 'after_hours', 'welcome', 'follow_up']);
export const messageChannelEnum = z.enum(['sms', 'whatsapp', 'both']);

export const templateSchema = z.object({
  id: z.number(),
  userId: z.string().uuid(),
  locationId: z.number().optional(),
  groupId: z.number().optional(),
  name: z.string().min(1),
  content: z.string().min(1),
  type: templateTypeEnum,
  channel: messageChannelEnum,
  variables: z.record(z.any()).optional(),
});

export type Template = z.infer<typeof templateSchema>;
export type TemplateType = z.infer<typeof templateTypeEnum>;
export type MessageChannel = z.infer<typeof messageChannelEnum>;

// ==================
// PHONE NUMBER SCHEMA
// ==================
export const phoneNumberSchema = z.object({
  id: z.number(),
  userId: z.string().uuid(),
  locationId: z.number(),
  number: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  type: z.enum(['fixed', 'mobile', 'shared']),
  linkedNumber: z.string().optional(),
  channel: messageChannelEnum,
  active: z.boolean().default(true),
  forwardingEnabled: z.boolean().default(true),
});

export type PhoneNumber = z.infer<typeof phoneNumberSchema>;

// ==================
// CALL SCHEMA
// ==================
export const callStatusEnum = z.enum(['answered', 'missed', 'rejected']);
export const callTypeEnum = z.enum(['direct', 'forwarded', 'ivr']);

export const callSchema = z.object({
  id: z.number(),
  userId: z.string().uuid(),
  phoneNumberId: z.number(),
  callerNumber: z.string(),
  status: callStatusEnum,
  duration: z.number().optional(),
  createdAt: z.date(),
  routedToLocation: z.number().optional(),
  callType: callTypeEnum.optional(),
});

export type Call = z.infer<typeof callSchema>;
export type CallStatus = z.infer<typeof callStatusEnum>;
export type CallType = z.infer<typeof callTypeEnum>;

// ==================
// MESSAGE SCHEMA
// ==================
export const messageTypeEnum = z.enum(['SMS', 'WhatsApp']);
export const messageStatusEnum = z.enum(['sent', 'delivered', 'failed', 'pending']);

export const messageSchema = z.object({
  id: z.number(),
  userId: z.string().uuid(),
  phoneNumberId: z.number(),
  type: messageTypeEnum,
  content: z.string(),
  recipient: z.string(),
  status: messageStatusEnum,
  createdAt: z.date(),
});

export type Message = z.infer<typeof messageSchema>;
export type MessageType = z.infer<typeof messageTypeEnum>;
export type MessageStatus = z.infer<typeof messageStatusEnum>;

// ==================
// ROUTING RULE SCHEMA
// ==================
export const routingRuleSchema = z.object({
  id: z.number(),
  userId: z.string().uuid(),
  locationId: z.number(),
  priority: z.number(),
  conditions: z.record(z.any()),
  forwardingNumber: z.string().optional(),
  ivrOptions: z.record(z.any()).optional(),
});

export type RoutingRule = z.infer<typeof routingRuleSchema>;

// ==================
// VALIDATION SCHEMAS
// ==================
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  username: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  companyName: z.string().min(1, 'Nombre de empresa requerido'),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Debes aceptar los términos y condiciones",
  }),
});

export const createLocationSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  address: z.string().min(1, 'Dirección requerida'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Número de teléfono inválido'),
  phoneType: messageChannelEnum,
});

export const createTemplateSchema = templateSchema.omit({ id: true, userId: true });

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type CreateLocationData = z.infer<typeof createLocationSchema>;
export type CreateTemplateData = z.infer<typeof createTemplateSchema>;




