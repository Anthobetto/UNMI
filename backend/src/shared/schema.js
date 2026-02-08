// BACKEND: schema.ts
import { z } from "zod";

// ==================
// ENUMS (Actualizados)
// ==================
// ✅ CAMBIO CLAVE: De templates/chatbots a small/pro
export const planTypeEnum = z.enum(['small', 'pro']); 
export const subscriptionStatusEnum = z.enum(['active', 'inactive', 'trial', 'cancelled']);
export const templateTypeEnum = z.enum(['missed_call', 'after_hours', 'welcome', 'follow_up']);
export const messageChannelEnum = z.enum(['sms', 'whatsapp', 'both']);
export const callStatusEnum = z.enum(['answered', 'missed', 'rejected']);
export const callTypeEnum = z.enum(['direct', 'forwarded', 'ivr', 'inbound']);
export const messageTypeEnum = z.enum(['SMS', 'WhatsApp']);
export const messageStatusEnum = z.enum(['pending', 'sent', 'delivered', 'received', 'read', 'failed']);
export const messageDirectionEnum = z.enum(['inbound', 'outbound']);

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
    planType: planTypeEnum.optional(), // ✅ Actualizado
    subscriptionStatus: subscriptionStatusEnum.optional(),
});

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

export const updateLocationSchema = locationSchema.partial();

// ==================
// TEMPLATE SCHEMA
// ==================
export const templateSchema = z.object({
    id: z.number(),
    userId: z.string().uuid(),
    locationId: z.number().optional(),
    groupId: z.number().optional(),
    name: z.string().min(1),
    content: z.string().min(1),
    type: templateTypeEnum,
    channel: messageChannelEnum,
    variables: z.array(z.string()).optional(),
});

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
    providerId: z.string(),
});

// ==================
// CALL SCHEMA
// ==================
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

// ==================
// MESSAGE SCHEMA
// ==================
export const messageSchema = z.object({
    id: z.number(),
    userId: z.string().uuid(),
    phoneNumberId: z.number(),
    type: messageTypeEnum,
    content: z.string(),
    recipient: z.string(),
    status: messageStatusEnum,
    createdAt: z.date(),
    direction: messageDirectionEnum.optional(),
    whatsappMessageId: z.string().optional(),
    templateId: z.number().optional(),
    errorMessage: z.string().optional(),
});

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

// ==================
// VALIDATION SCHEMAS (Auth & Forms)
// ==================
export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// ✅ REGISTER SCHEMA CORREGIDO PARA PAYWALL
export const registerSchema = z.object({
    username: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    companyName: z.string().min(1, 'Nombre de empresa requerido'),
    termsAccepted: z.boolean().refine(val => val === true, {
        message: "Debes aceptar los términos y condiciones",
    }),
    // Estructura nueva: planType (small/pro), quantity (locs), departments
    selections: z.array(z.object({
        planType: planTypeEnum, 
        quantity: z.number().min(1),
        departments: z.number().min(1).optional(), // Nuevo campo
        price: z.number().optional()
    })).min(1, 'Debes seleccionar al menos un plan'),
});

export const createLocationSchema = z.object({
    name: z.string().min(1, 'Nombre requerido'),
    address: z.string().min(1, 'Dirección requerida'),
    phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Número de teléfono inválido').optional(),
    phoneType: messageChannelEnum.optional(),
    planType: planTypeEnum.optional(), // ✅ Actualizado
});

export const createTemplateSchema = templateSchema.omit({ id: true, userId: true });