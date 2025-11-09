// Authentication Routes
// Implementa SRP: Solo rutas de autenticación

import { Router, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/database';
import { supabaseService } from '../services/SupabaseService';
import { stripeService } from '../services/StripeService';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';
import { loginSchema, registerSchema } from '../../../shared/schema';

const router = Router();

// POST /api/register - Registro de usuario con Stripe
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Datos de registro inválidos');
    }

    const { username, email, password, companyName, planType, termsAccepted } = validation.data;

    if (!termsAccepted) {
      throw new ValidationError('Debes aceptar los términos y condiciones');
    }

    const tempUserId = crypto.randomUUID();

    const session = await stripeService.createCheckoutSession({
      email,
      userId: tempUserId,
      planType,
      metadata: {
        username,
        companyName,
        password, // ⚠️ No enviar password en producción
        type: 'registration',
      },
      successUrl: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancelUrl: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
    });

    res.status(200).json({
      url: session.url,
      tempUserId,
      sessionId: session.id,
    });
  })
);

// POST /api/login - Inicio de sesión
router.post('/login', asyncHandler(async (req, res) => {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError('Invalid login credentials');
  }

  const { email, password } = validation.data;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.session) {
    res.status(400).json({
      message: 'Invalid credentials',
      error: 'INVALID_CREDENTIALS'
    });
    return;
  }

  res.status(200).json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: data.user,
  });
}));

// POST /api/logout - Cierre de sesión
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(200).json({
    message: 'Logout successful. Please delete token on client.'
  });
});

// GET /api/user - Obtener usuario autenticado
router.get('/user', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  const profile = await supabaseService.getUserByAuthId(req.user.id);

  if (!profile) {
    res.status(404).json({ message: 'User profile not found' });
    return;
  }

  res.status(200).json({ user: profile });
}));

// PUT /api/user/plan - Actualizar plan del usuario
router.put('/user/plan', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  const { planType } = req.body;

  if (!planType || !['templates', 'chatbots'].includes(planType)) {
    throw new ValidationError('Invalid plan type');
  }

  const profile = await supabaseService.getUserByAuthId(req.user.id);

  if (!profile) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  await supabaseService.updateUserPlan(profile.id, planType);

  res.status(200).json({
    message: 'Plan updated successfully',
    planType
  });
}));

// POST /api/refresh - Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    res.status(401).json({ message: 'Invalid refresh token' });
    return;
  }

  res.status(200).json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
}));

// POST /api/checkout-plan - Cambiar plan (usuarios ya registrados)
router.post(
  '/checkout-plan',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { planType } = req.body;

    if (!planType || !['templates', 'chatbots'].includes(planType)) {
      throw new ValidationError('Invalid plan type');
    }

    const session = await stripeService.createCheckoutSession({
      email: req.user.email,
      userId: req.user.id,
      planType,
      successUrl: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancelUrl: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
    });

    res.status(200).json({ url: session.url, sessionId: session.id });
  })
);

// GET /api/prices - Obtener precios desde Stripe
router.get('/prices', asyncHandler(async (req, res) => {
  const templatesPrice = await stripeService.getPlanPrice('templates');
  const chatbotsPrice = await stripeService.getPlanPrice('chatbots');

  res.json({
    templates: templatesPrice,
    chatbots: chatbotsPrice,
  });
}));


export default router;