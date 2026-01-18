// Authentication Routes
// Implementa SRP: Solo rutas de autenticación

import { Router, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/database';
import { supabaseService } from '../services/SupabaseService';
import { stripeService } from '../services/StripeService';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';
import { loginSchema, registerSchema } from '../../shared/schema';

const router = Router();

// POST /api/register - Registro de usuario con Stripe
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Datos de registro inválidos');
    }

    const { username, email, password, companyName, selections, termsAccepted } = validation.data;

    if (!termsAccepted) {
      throw new ValidationError('Debes aceptar los términos y condiciones');
    }

    const tempUserId = crypto.randomUUID();

    // Usar createCheckoutSessionCustom para múltiples selecciones
    const session = await stripeService.createCheckoutSessionCustom({
      email,
      userId: tempUserId,
      selections,
      metadata: {
        username,
        companyName,
        password, // ⚠️ No enviar password en producción
        selections: JSON.stringify(selections),
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

  console.log('🔐 Login attempt for:', email); // Para debugging

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.session) {
    console.error('❌ Login failed:', error?.message);
    res.status(400).json({
      message: 'Invalid credentials',
      error: 'INVALID_CREDENTIALS'
    });
    return;
  }

  console.log('✅ Auth successful, fetching user profile...');

  // Obtener el usuario completo de tu tabla
  const user = await supabaseService.getUserByAuthId(data.user.id);

  if (!user) {
    console.error('❌ User profile not found for auth_id:', data.user.id);
    res.status(404).json({
      message: 'User profile not found',
      error: 'PROFILE_NOT_FOUND'
    });
    return;
  }

  console.log('✅ User profile found:', user.id);

  // Obtener purchased_locations para mostrar créditos
  const { data: purchasedLocations } = await supabase
    .from('purchased_locations')
    .select('*')
    .eq('user_id', user.id);

  const credits = purchasedLocations?.reduce((acc, pl) => {
    acc[pl.plan_type] = (acc[pl.plan_type] || 0) + (pl.quantity - (pl.used || 0));
    return acc;
  }, {} as Record<string, number>) || {};

  console.log('✅ Login successful, credits:', credits);

  res.status(200).json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: {
      ...user,
      purchasedLocations: purchasedLocations || [],
      credits,
    },
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

  const { data: purchasedLocations } = await supabase
    .from('purchased_locations')
    .select('*')
    .eq('user_id', profile.id);

  const credits = purchasedLocations?.reduce((acc, pl) => {
    acc[pl.plan_type] = (acc[pl.plan_type] || 0) + (pl.quantity - (pl.used || 0));
    return acc;
  }, {} as Record<string, number>) || {};

  const activePlans = [...new Set(purchasedLocations?.map(pl => pl.plan_type) ?? [])];

  console.log('📊 User credits:', credits);
  console.log('📦 User active plans:', activePlans);

  res.status(200).json({
    user: {
      ...profile,
      purchasedLocations: purchasedLocations || [],
      credits, 
      activePlans, 
    }
  });
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
/* router.post('/refresh', asyncHandler(async (req, res) => {
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
})); */

// POST /api/refresh - Refresh token TEST
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session || !data.session.user) {
    res.status(401).json({ message: 'Invalid refresh token' });
    return;
  }

  const authId = data.session.user.id;

  try {
    const user = await supabaseService.getUserByAuthId(authId);
    if (!user) throw new Error('User not found');

    const { data: purchasedLocations } = await supabase
      .from('purchased_locations')
      .select('*')
      .eq('user_id', user.id);

    const credits = purchasedLocations?.reduce((acc, pl) => {
      acc[pl.plan_type] = (acc[pl.plan_type] || 0) + (pl.quantity - pl.used);
      return acc;
    }, {} as Record<string, number>) || {};

    res.status(200).json({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        ...user,
        purchasedLocations: purchasedLocations || [],
        credits,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to load user' });
  }
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