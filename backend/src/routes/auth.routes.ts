// Authentication Routes
// Implementa SRP: Solo rutas de autenticación

import { Router, Response } from 'express';
import { supabase } from '../config/database';
import { supabaseService } from '../services/SupabaseService';
import { stripeService } from '../services/StripeService';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';
import { loginSchema, registerSchema } from '../../../shared/schema';

const router = Router();

// POST /api/register - Registro de usuario con Stripe
router.post('/register', asyncHandler(async (req, res) => {
  // Validar datos del formulario
  const validation = registerSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw new ValidationError('Invalid registration data');
  }

  const { username, email, password, companyName, termsAccepted } = validation.data;

  if (!termsAccepted) {
    throw new ValidationError('You must accept the terms and conditions');
  }

  try {
    // Generar ID temporal para el usuario
    const tempUserId = crypto.randomUUID();

    // Crear sesión Stripe para pago inicial
    const session = await stripeService.createCheckoutSession({
      email,
      userId: tempUserId,
      planType: 'initial_registration',
      amount: 0, // Pago inicial de 0€
      metadata: {
        username,
        companyName,
        password, // En producción, NO enviar password en metadata
        type: 'initial_registration',
      },
    });

    res.json({
      url: session.url,
      tempUserId,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Error creating registration session:', error);
    throw new Error('Failed to create registration session');
  }
}));

// POST /api/login - Inicio de sesión
router.post('/login', asyncHandler(async (req, res) => {
  const validation = loginSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw new ValidationError('Invalid login credentials');
  }

  const { email, password } = validation.data;

  try {
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
  } catch (error) {
    console.error('Login error:', error);
    throw new Error('Login failed');
  }
}));

// POST /api/logout - Cierre de sesión
router.post('/logout', (req, res) => {
  try {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    res.status(200).json({ 
      message: 'Logout successful. Please delete token on client.' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error('Logout failed');
  }
});

// GET /api/user - Obtener usuario autenticado
router.get('/user', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  try {
    const profile = await supabaseService.getUserByAuthId(req.user.id);

    if (!profile) {
      res.status(404).json({ message: 'User profile not found' });
      return;
    }

    res.status(200).json({ user: profile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile');
  }
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

  try {
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
  } catch (error) {
    console.error('Error updating user plan:', error);
    throw new Error('Failed to update user plan');
  }
}));

// POST /api/refresh - Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  try {
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
  } catch (error) {
    console.error('Token refresh error:', error);
    throw new Error('Failed to refresh token');
  }
}));

export default router;




