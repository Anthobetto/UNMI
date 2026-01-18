// API Routes - RESTful endpoints
// Organizado por recursos con SOLID principles
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { supabaseService } from '../services/SupabaseService';
import { createLocationSchema, createTemplateSchema, updateLocationSchema } from '../../shared/schema';
import { flowService, postCallEventSchema, templateCompletionSchema } from '../services/FlowService';
import { providerService } from '../services/ProviderService';
import { validateMetaTemplate, MetaTemplateValidationError } from '@/utils/validateMetaTemplate';
const router = Router();
// ==================
// LOCATIONS
// ==================
router.get('/locations', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const locations = await supabaseService.getLocations(profile.id);
    res.json({ locations });
}));
router.get('/locations/:id', requireAuth, asyncHandler(async (req, res) => {
    const location = await supabaseService.getLocationById(parseInt(req.params.id));
    if (!location)
        throw new NotFoundError('Location not found');
    res.json({ location });
}));
router.post('/locations', requireAuth, asyncHandler(async (req, res) => {
    const validation = createLocationSchema.safeParse(req.body);
    if (!validation.success) {
        throw new ValidationError('Invalid location data');
    }
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const location = await supabaseService.createLocation({
        ...validation.data,
        userId: profile.id,
    });
    res.status(201).json({ location });
}));
router.put('/locations/:id', requireAuth, asyncHandler(async (req, res) => {
    const locationId = parseInt(req.params.id);
    const validation = updateLocationSchema.safeParse(req.body);
    if (!validation.success)
        throw new ValidationError('Invalid location data');
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const existing = await supabaseService.getLocationById(locationId);
    if (!existing || existing.userId !== profile.id)
        throw new NotFoundError('Location not found');
    const updated = await supabaseService.updateLocation(locationId, validation.data);
    res.json({ location: updated });
}));
// ==================
// TEMPLATES
// ==================
router.get('/templates', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const templates = await supabaseService.getTemplates(profile.id);
    res.json({ templates });
}));
router.get('/templates/:id', requireAuth, asyncHandler(async (req, res) => {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId))
        throw new ValidationError('Invalid template ID');
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const template = await supabaseService.getTemplateById(templateId);
    if (!template || template.userId !== profile.id)
        throw new NotFoundError('Template not found');
    res.json({ template });
}));
router.post('/templates', requireAuth, asyncHandler(async (req, res) => {
    const validation = createTemplateSchema.safeParse(req.body);
    if (!validation.success) {
        throw new ValidationError('Invalid template data');
    }
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    // ======== VALIDACIÓN META-SAFE ========
    try {
        validateMetaTemplate(validation.data.content, validation.data.variables || []);
    }
    catch (err) {
        if (err instanceof MetaTemplateValidationError) {
            return res.status(400).json({ error: err.message });
        }
        throw err;
    }
    // ======================================
    const template = await supabaseService.createTemplate({
        ...validation.data,
        userId: profile.id,
    });
    res.status(201).json(template);
}));
router.put('/templates/:id', requireAuth, asyncHandler(async (req, res) => {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId))
        throw new ValidationError('Invalid template ID');
    const validation = createTemplateSchema.safeParse(req.body);
    if (!validation.success) {
        throw new ValidationError('Invalid template data');
    }
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const existing = await supabaseService.getTemplateById(templateId);
    if (!existing || existing.userId !== profile.id)
        throw new NotFoundError('Template not found');
    // VALIDACIÓN META-SAFE AL ACTUALIZAR
    try {
        validateMetaTemplate(validation.data.content, validation.data.variables || []);
    }
    catch (err) {
        if (err instanceof MetaTemplateValidationError) {
            return res.status(400).json({ error: err.message });
        }
        throw err;
    }
    const template = await supabaseService.updateTemplate(templateId, {
        ...validation.data,
        userId: profile.id,
    });
    res.json(template);
}));
router.delete('/templates/:id', requireAuth, asyncHandler(async (req, res) => {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId))
        throw new ValidationError('Invalid template ID');
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const existing = await supabaseService.getTemplateById(templateId);
    if (!existing || existing.userId !== profile.id)
        throw new NotFoundError('Template not found');
    await supabaseService.deleteTemplate(templateId);
    res.status(204).send();
}));
// Templates by location
router.get('/locations/:locationId/templates', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const locationId = parseInt(req.params.locationId);
    if (isNaN(locationId))
        throw new ValidationError('Invalid location ID');
    const templates = await supabaseService.getTemplates(profile.id);
    const filtered = templates.filter(t => t.locationId === locationId);
    res.json({ templates: filtered });
}));
// ==================
// CALLS
// ==================
router.get('/calls', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const calls = await supabaseService.getCalls(profile.id);
    res.json({ calls });
}));
router.get('/calls/stats', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const stats = await supabaseService.getCallStats(profile.id);
    res.json(stats);
}));
router.post('/calls', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const call = await supabaseService.createCall({
        ...req.body,
        userId: profile.id,
    });
    res.status(201).json(call);
}));
// ==================
// MESSAGES
// ==================
router.get('/messages', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const messages = await supabaseService.getMessages(profile.id);
    res.json({ messages });
}));
router.get('/messages/stats', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const stats = await supabaseService.getMessageStats(profile.id);
    res.json(stats);
}));
router.post('/messages/whatsapp', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const message = await supabaseService.createMessage({
        userId: profile.id,
        phoneNumberId: req.body.phoneNumberId,
        type: 'WhatsApp',
        content: req.body.content,
        recipient: req.body.recipient,
        status: 'pending',
    });
    res.status(201).json(message);
}));
// ==================
// WHATSAPP - ENVÍO DE TEMPLATES
// ==================
/**
 * Enviar template de WhatsApp manualmente
 */
// ==================
// WHATSAPP - ENVÍO DE TEMPLATES
// ==================
/**
 * Enviar template de WhatsApp manualmente con validación Meta-safe y de variables
 */
router.post('/whatsapp/send-template', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const { templateId, recipient, phoneNumberId, variables } = req.body;
    // Validar datos obligatorios
    if (!templateId || !recipient || !phoneNumberId) {
        throw new ValidationError('templateId, recipient, and phoneNumberId are required');
    }
    // Obtener template
    const template = await supabaseService.getTemplateById(templateId);
    if (!template || template.userId !== profile.id) {
        throw new NotFoundError('Template not found');
    }
    // VALIDACIÓN META-SAFE
    try {
        validateMetaTemplate(template.content, template.variables || []);
    }
    catch (err) {
        if (err instanceof MetaTemplateValidationError) {
            return res.status(400).json({ error: `Meta validation failed: ${err.message}` });
        }
        throw err;
    }
    // Validar que todas las variables requeridas estén presentes
    const missingVars = (template.variables || []).filter(v => !(v in (variables || {})));
    if (missingVars.length > 0) {
        return res.status(400).json({ error: `Missing variables: ${missingVars.join(', ')}` });
    }
    // Obtener phone number y validar ownership
    const phoneNumber = await supabaseService.getPhoneNumberById(phoneNumberId);
    if (!phoneNumber || phoneNumber.userId !== profile.id) {
        throw new NotFoundError('Phone number not found');
    }
    if (!phoneNumber.providerId) {
        throw new ValidationError('Phone number does not have a WhatsApp provider ID configured');
    }
    // Reemplazar variables en el contenido del template
    let contentToSend = template.content;
    if (variables && Object.keys(variables).length > 0) {
        Object.entries(variables).forEach(([key, value]) => {
            const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            contentToSend = contentToSend.replace(placeholder, String(value));
        });
    }
    // Enviar vía FlowService
    const result = await flowService.sendDirectWhatsAppMessage({
        userId: profile.id,
        phoneNumberId: phoneNumber.id,
        recipient: recipient,
        message: contentToSend,
    });
    if (!result.success) {
        throw new Error(result.error || 'Failed to send WhatsApp message');
    }
    res.status(200).json({
        success: true,
        messageId: result.messageId,
        message: 'Template sent successfully',
    });
}));
router.post('/whatsapp/simulate-missed-call', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const { callerNumber, phoneNumberId, locationId } = req.body;
    // Validar datos
    if (!callerNumber || !phoneNumberId || !locationId) {
        throw new ValidationError('callerNumber, phoneNumberId, and locationId are required');
    }
    // Verificar que el phoneNumber pertenece al usuario
    const phoneNumber = await supabaseService.getPhoneNumberById(phoneNumberId);
    if (!phoneNumber || phoneNumber.userId !== profile.id) {
        throw new NotFoundError('Phone number not found');
    }
    // Verificar que la location pertenece al usuario
    const location = await supabaseService.getLocationById(locationId);
    if (!location || location.userId !== profile.id) {
        throw new NotFoundError('Location not found');
    }
    // Registrar la llamada perdida
    await supabaseService.createCall({
        userId: profile.id,
        phoneNumberId: phoneNumber.id,
        callerNumber: callerNumber,
        status: 'missed',
        duration: 0,
        routedToLocation: location.id,
        callType: 'inbound',
    });
    // Disparar el flujo automático de WhatsApp
    const result = await flowService.handleMissedCallWithWhatsApp({
        callerNumber: callerNumber,
        phoneNumberId: phoneNumber.id,
        locationId: location.id,
        userId: profile.id,
    });
    res.status(200).json({
        success: result.success,
        messageId: result.messageId,
        template: result.template,
        error: result.error,
        message: result.success
            ? 'Missed call processed and template sent successfully'
            : 'Missed call processed but template sending failed',
    });
}));
/**
 * Obtener historial de conversación con un cliente
 */
router.get('/whatsapp/conversation/:recipient', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const recipient = req.params.recipient;
    const limit = parseInt(req.query.limit) || 50;
    const messages = await supabaseService.getConversationHistory(profile.id, recipient, limit);
    res.json({
        recipient,
        messages,
        count: messages.length,
    });
}));
// ==================
// PHONE NUMBERS
// ==================
router.get('/phone-numbers', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const phoneNumbers = await supabaseService.getPhoneNumbers(profile.id);
    res.json({ phoneNumbers });
}));
router.post('/phone-numbers', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const phoneNumber = await supabaseService.createPhoneNumber({
        ...req.body,
        userId: profile.id,
    });
    res.status(201).json(phoneNumber);
}));
router.put('/phone-numbers/:id', requireAuth, asyncHandler(async (req, res) => {
    const phoneNumberId = parseInt(req.params.id);
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const updated = await supabaseService.updatePhoneNumber(phoneNumberId, req.body);
    res.json(updated);
}));
// ==================
// ROUTING RULES
// ==================
router.get('/routing-rules', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const rules = await supabaseService.getRoutingRules(profile.id);
    res.json({ rules });
}));
router.post('/routing-rules', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const rule = await supabaseService.createRoutingRule({
        ...req.body,
        userId: profile.id,
    });
    res.status(201).json(rule);
}));
// ==================
// FLOW & PROVIDER SERVICES
// ==================
// Get user's flow preferences (determines section visibility)
router.get('/flow/preferences', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const preferences = await flowService.getUserFlowPreferences(profile.id.toString());
    res.json(preferences);
}));
// Update flow preferences
router.put('/flow/preferences', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    await flowService.updateUserFlowPreferences({
        userId: profile.id.toString(),
        ...req.body,
    });
    res.json({ success: true });
}));
// Get visible sections for user
router.get('/flow/sections', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const sections = await flowService.getVisibleSections(profile.id.toString());
    res.json(sections);
}));
// Trigger post-call flow (can be called by webhook or manual trigger)
router.post('/flow/post-call', requireAuth, asyncHandler(async (req, res) => {
    const validation = postCallEventSchema.safeParse(req.body);
    if (!validation.success) {
        throw new ValidationError('Invalid post-call event data');
    }
    const result = await flowService.handleMissedCall(validation.data);
    res.json(result);
}));
// Complete and send template
router.post('/flow/send-template', requireAuth, asyncHandler(async (req, res) => {
    const validation = templateCompletionSchema.safeParse(req.body);
    if (!validation.success) {
        throw new ValidationError('Invalid template completion data');
    }
    const result = await flowService.autoCompleteAndSendTemplate(validation.data);
    res.json(result);
}));
// Route to chatbot
router.post('/flow/connect-chatbot', requireAuth, asyncHandler(async (req, res) => {
    const { botId, initialMessage } = req.body;
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const result = await flowService.autoRouteToChatbot(botId, profile.id.toString(), initialMessage);
    res.json(result);
}));
// Get call events for user
router.get('/flow/call-events', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const events = await flowService.getUserCallEvents(profile.id.toString());
    res.json({ events });
}));
// Get template completions
router.get('/flow/template-completions', requireAuth, asyncHandler(async (req, res) => {
    const profile = await supabaseService.getUserByAuthId(req.user.id);
    if (!profile)
        throw new NotFoundError('User not found');
    const completions = await flowService.getTemplateCompletions(profile.id.toString());
    res.json({ completions });
}));
// ==================
// PROVIDER MANAGEMENT
// ==================
// Get available providers
router.get('/providers', requireAuth, asyncHandler(async (req, res) => {
    const providers = providerService.getActiveProviders();
    res.json({
        providers: providers.map(p => ({
            name: p.name,
            capabilities: p.capabilities,
            isActive: p.isActive,
        })),
    });
}));
// Generate virtual number
router.post('/providers/generate-number', requireAuth, asyncHandler(async (req, res) => {
    const { countryCode = '34', provider } = req.body;
    const result = await providerService.generateVirtualNumber(countryCode, provider);
    res.json(result);
}));
// Send SMS/WhatsApp via provider
router.post('/providers/send-message', requireAuth, asyncHandler(async (req, res) => {
    const { to, message, type = 'whatsapp', provider } = req.body;
    const result = type === 'sms'
        ? await providerService.sendSMS(to, message, provider)
        : await providerService.sendWhatsApp(to, message, provider);
    res.json(result);
}));
export default router;
