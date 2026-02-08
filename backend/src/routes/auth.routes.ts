// Authentication Routes
// Implementa SRP: Solo rutas de autenticación

import { Router, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/database';
import { supabaseService } from '../services/SupabaseService';
import { stripeService } from '../services/StripeService';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';
// Importamos los schemas actualizados que ya aceptan small/pro
import { loginSchema, registerSchema } from '../shared/schema'; 

const router = Router();

// ==========================================
// POST /api/register - Registro con Paywall
// ==========================================
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    // 1. Validar con el nuevo schema (ya acepta 'small'/'pro')
    const validation = registerSchema.safeParse(req.body);
    
    if (!validation.success) {
      // Tip: Devolver el error exacto de Zod ayuda mucho al frontend
      console.error("Validation error:", validation.error);
      throw new ValidationError('Datos de registro inválidos');
    }

    const { username, email, password, companyName, selections, termsAccepted } = validation.data;

    if (!termsAccepted) {
      throw new ValidationError('Debes aceptar los términos y condiciones');
    }

    const tempUserId = crypto.randomUUID();

    // 2. Llamar a Stripe. 
    // Como actualizamos StripeService y el Schema, los tipos ahora coinciden ('small' | 'pro').
    const session = await stripeService.createCheckoutSessionCustom({
      email,
      userId: tempUserId,
      selections: selections as any, // Cast seguro porque schema y servicio están sincronizados
      metadata: {
        username,
        companyName,
        // No enviamos password en metadata por seguridad, se gestiona tras el webhook
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

// ==========================================
// POST /api/login - Inicio de sesión
// ==========================================
router.post('/login', asyncHandler(async (req, res) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError('Invalid login credentials');
  }

  const { email, password } = validation.data;

  // 1. Auth con Supabase
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

  // 2. Obtener perfil enriquecido (SupabaseService ya normaliza los planes)
  const user = await supabaseService.getUserByAuthId(data.user.id);

  if (!user) {
    res.status(404).json({
      message: 'User profile not found',
      error: 'PROFILE_NOT_FOUND'
    });
    return;
  }

  // 3. Calcular créditos/consumo
  // Nota: Esto podría moverse al SupabaseService para limpiar el controlador
  const { data: purchasedLocations } = await supabase
    .from('purchased_locations')
    .select('*')
    .eq('user_id', user.id);

  const credits = purchasedLocations?.reduce((acc, pl) => {
    // Normalizamos claves por si la DB tiene datos viejos
    let key = pl.plan_type;
    if (key === 'templates') key = 'small';
    if (key === 'chatbots') key = 'pro';

    acc[key] = (acc[key] || 0) + (pl.quantity - (pl.used || 0));
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
}));

// POST /api/logout
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logout successful' });
});

// ==========================================
// GET /api/user - Obtener usuario
// ==========================================
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
    let key = pl.plan_type;
    if (key === 'templates') key = 'small';
    if (key === 'chatbots') key = 'pro';
    
    acc[key] = (acc[key] || 0) + (pl.quantity - (pl.used || 0));
    return acc;
  }, {} as Record<string, number>) || {};

  const activePlans = [...new Set(purchasedLocations?.map(pl => pl.plan_type) ?? [])];

  res.status(200).json({
    user: {
      ...profile,
      purchasedLocations: purchasedLocations || [],
      credits, 
      activePlans, 
    }
  });
}));

// ==========================================
// PUT /api/user/plan - Actualizar plan
// ==========================================
router.put('/user/plan', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  const { planType } = req.body;

  // ✅ VALIDACIÓN ACTUALIZADA: small / pro
  if (!planType || !['small', 'pro'].includes(planType)) {
    throw new ValidationError('Invalid plan type. Must be small or pro.');
  }

  const profile = await supabaseService.getUserByAuthId(req.user.id);

  if (!profile) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  // SupabaseService ya acepta 'small' | 'pro' gracias a nuestra actualización anterior
  await supabaseService.updateUserPlan(profile.id, planType as 'small' | 'pro');

  res.status(200).json({
    message: 'Plan updated successfully',
    planType
  });
}));

// POST /api/refresh
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
      let key = pl.plan_type;
      if (key === 'templates') key = 'small';
      if (key === 'chatbots') key = 'pro';

      acc[key] = (acc[key] || 0) + (pl.quantity - pl.used);
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

// ==========================================
// POST /api/checkout-plan - Checkout para usuarios logueados
// ==========================================
router.post(
  '/checkout-plan',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { planType } = req.body; // Debería venir también quantity y departments si es custom

    // ✅ VALIDACIÓN ACTUALIZADA
    if (!planType || !['small', 'pro'].includes(planType)) {
      throw new ValidationError('Invalid plan type');
    }

    // Nota: createCheckoutSession es para upgrades simples. 
    // Si quieres soportar selecciones complejas (extras) aquí también, 
    // deberías usar createCheckoutSessionCustom similar al registro.
    const session = await stripeService.createCheckoutSession({
      email: req.user.email,
      userId: req.user.id,
      planType: planType as any, // Cast seguro tras validación
      successUrl: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancelUrl: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
    });

    res.status(200).json({ url: session.url, sessionId: session.id });
  })
);

// ==========================================
// GET /api/prices - Precios Actualizados
// ==========================================
router.get('/prices', asyncHandler(async (req, res) => {
  // ✅ OBTENEMOS PRECIOS DE LOS NUEVOS PLANES
  // Asegúrate de que getPlanPrice en StripeService soporte 'small' y 'pro'
  const smallPrice = await stripeService.getPlanPrice('small');
  const proPrice = await stripeService.getPlanPrice('pro');

  res.json({
    templates: smallPrice, // Mantenemos keys viejas si el front aun las busca así temporalmente
    chatbots: proPrice,
    // Keys nuevas para el futuro
    small: smallPrice,
    pro: proPrice
  });
}));

export default router;