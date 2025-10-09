// API Routes - RESTful endpoints
// Organizado por recursos con SOLID principles

import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { supabaseService } from '../services/SupabaseService';
import { createLocationSchema, createTemplateSchema } from '../../../shared/schema';
import { flowService, postCallEventSchema, templateCompletionSchema } from '../services/FlowService';
import { providerService } from '../services/ProviderService';

const router = Router();

// ==================
// LOCATIONS
// ==================
router.get('/locations', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  const locations = await supabaseService.getLocations(profile.id);
  res.json({ locations });
}));

router.get('/locations/:id', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const location = await supabaseService.getLocationById(parseInt(req.params.id));
  if (!location) throw new NotFoundError('Location not found');

  res.json({ location });
}));

router.post('/locations', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validation = createLocationSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError('Invalid location data');
  }

  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  const location = await supabaseService.createLocation({
    ...validation.data,
    userId: profile.id,
  });

  res.status(201).json({ location });
}));

// ==================
// TEMPLATES
// ==================
router.get('/templates', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  const templates = await supabaseService.getTemplates(profile.id);
  res.json({ templates });
}));

router.get('/templates/:id', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const template = await supabaseService.getTemplateById(parseInt(req.params.id));
  if (!template) throw new NotFoundError('Template not found');

  res.json({ template });
}));

router.post('/templates', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validation = createTemplateSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError('Invalid template data');
  }

  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  const template = await supabaseService.createTemplate({
    ...validation.data,
    userId: profile.id,
  });

  res.status(201).json(template);
}));

router.put('/templates/:id', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const templateId = parseInt(req.params.id);
  const template = await supabaseService.updateTemplate(templateId, req.body);
  
  res.json(template);
}));

router.delete('/templates/:id', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const templateId = parseInt(req.params.id);
  await supabaseService.deleteTemplate(templateId);
  
  res.status(204).send();
}));

// Templates by location
router.get('/locations/:locationId/templates', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  const templates = await supabaseService.getTemplates(profile.id);
  const filtered = templates.filter(t => t.locationId === parseInt(req.params.locationId));
  
  res.json({ templates: filtered });
}));

// ==================
// CALLS
// ==================
router.get('/calls', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  const calls = await supabaseService.getCalls(profile.id);
  res.json({ calls });
}));

router.get('/calls/stats', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  const stats = await supabaseService.getCallStats(profile.id);
  res.json(stats);
}));

router.post('/calls', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  const call = await supabaseService.createCall({
    ...req.body,
    userId: profile.id,
  });

  res.status(201).json(call);
}));

// ==================
// MESSAGES
// ==================
router.get('/messages', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  const messages = await supabaseService.getMessages(profile.id);
  res.json({ messages });
}));

router.get('/messages/stats', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  const stats = await supabaseService.getMessageStats(profile.id);
  res.json(stats);
}));

router.post('/messages/whatsapp', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

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
// PHONE NUMBERS
// ==================
router.get('/phone-numbers', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  const phoneNumbers = await supabaseService.getPhoneNumbers(profile.id);
  res.json({ phoneNumbers });
}));

router.post('/phone-numbers', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  const phoneNumber = await supabaseService.createPhoneNumber({
    ...req.body,
    userId: profile.id,
  });

  res.status(201).json(phoneNumber);
}));

// ==================
// ROUTING RULES
// ==================
router.get('/routing-rules', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  const rules = await supabaseService.getRoutingRules(profile.id);
  res.json({ rules });
}));

router.post('/routing-rules', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

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
router.get('/flow/preferences', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  const preferences = await flowService.getUserFlowPreferences(profile.id.toString());
  res.json(preferences);
}));

// Update flow preferences
router.put('/flow/preferences', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  await flowService.updateUserFlowPreferences({
    userId: profile.id.toString(),
    ...req.body,
  });

  res.json({ success: true });
}));

// Get visible sections for user
router.get('/flow/sections', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  const sections = await flowService.getVisibleSections(profile.id.toString());
  res.json(sections);
}));

// Trigger post-call flow (can be called by webhook or manual trigger)
router.post('/flow/post-call', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validation = postCallEventSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError('Invalid post-call event data');
  }

  const result = await flowService.handleMissedCall(validation.data);
  res.json(result);
}));

// Complete and send template
router.post('/flow/send-template', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validation = templateCompletionSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError('Invalid template completion data');
  }

  const result = await flowService.autoCompleteAndSendTemplate(validation.data);
  res.json(result);
}));

// Route to chatbot
router.post('/flow/connect-chatbot', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { botId, initialMessage } = req.body;
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  const result = await flowService.autoRouteToChatbot(botId, profile.id.toString(), initialMessage);
  res.json(result);
}));

// Get call events for user
router.get('/flow/call-events', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  const events = await flowService.getUserCallEvents(profile.id.toString());
  res.json({ events });
}));

// Get template completions
router.get('/flow/template-completions', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await supabaseService.getUserByAuthId(req.user!.id);
  if (!profile) throw new NotFoundError('User not found');

  const completions = await flowService.getTemplateCompletions(profile.id.toString());
  res.json({ completions });
}));

// ==================
// PROVIDER MANAGEMENT
// ==================

// Get available providers
router.get('/providers', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
router.post('/providers/generate-number', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { countryCode = '34', provider } = req.body;
  const result = await providerService.generateVirtualNumber(countryCode, provider);
  res.json(result);
}));

// Send SMS/WhatsApp via provider
router.post('/providers/send-message', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { to, message, type = 'whatsapp', provider } = req.body;
  
  const result = type === 'sms' 
    ? await providerService.sendSMS(to, message, provider)
    : await providerService.sendWhatsApp(to, message, provider);

  res.json(result);
}));

export default router;




