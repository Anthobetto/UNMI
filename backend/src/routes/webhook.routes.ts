// Webhook Routes - Stripe events
// Implementa SRP: Solo manejo de webhooks externos

import { Router, Request, Response } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { stripeService } from '../services/StripeService';
import { supabase } from '../config/database';
import { supabaseService } from '../services/SupabaseService';

const router = Router();

// Stripe webhook - requiere raw body
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripeService.constructWebhookEvent(req.body, sig);
    } catch (err: any) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    console.log(`✅ Received Stripe event: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event);
          break;

        case 'payment_intent.succeeded':
          await handlePaymentSucceeded(event);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentFailed(event);
          break;

        case 'customer.subscription.created':
          await handleSubscriptionCreated(event);
          break;

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ 
        error: 'Webhook processing failed',
        type: event.type 
      });
    }
  }
);

// ==================
// WEBHOOK HANDLERS
// ==================

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  console.log('✅ Checkout session completed:', session.id);

  const metadata = session.metadata;
  if (!metadata) {
    console.error('No metadata in session');
    return;
  }

  const { userId, planType, username, companyName, password } = metadata;

  // Si es registro inicial, crear usuario en Supabase
  if (planType === 'initial_registration' && username && companyName && password) {
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: session.customer_email || '',
        password: password,
        email_confirm: true, // Auto-confirmar email
      });

      if (authError || !authData.user) {
        console.error('Error creating auth user:', authError);
        return;
      }

      // 2. Crear perfil en tabla users
      await supabaseService.createUser({
        auth_id: authData.user.id,
        username,
        email: session.customer_email || '',
        companyName,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        planType: undefined, // Se asignará cuando elija plan
        subscriptionStatus: 'trial',
      });

      console.log('✅ User created successfully:', authData.user.id);
    } catch (error) {
      console.error('Error in registration flow:', error);
    }
  }

  // Si es compra de plan, actualizar usuario
  if (planType && ['templates', 'chatbots'].includes(planType)) {
    try {
      const profile = await supabaseService.getUserById(userId);
      if (profile) {
        await supabaseService.updateUserPlan(
          userId,
          planType as 'templates' | 'chatbots'
        );
        console.log(`✅ User plan updated to: ${planType}`);
      }
    } catch (error) {
      console.error('Error updating user plan:', error);
    }
  }
}

async function handlePaymentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.log('✅ Payment succeeded:', paymentIntent.id);

  // Actualizar estado de suscripción si aplica
  if (paymentIntent.metadata?.userId) {
    // Lógica adicional si es necesario
  }
}

async function handlePaymentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.error('❌ Payment failed:', paymentIntent.id);

  // Notificar al usuario o realizar acciones de recuperación
  if (paymentIntent.metadata?.userId) {
    // Enviar email de error, etc.
  }
}

async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log('✅ Subscription created:', subscription.id);

  // Actualizar estado en la base de datos
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log('📝 Subscription updated:', subscription.id);

  // Actualizar plan del usuario si cambió
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log('❌ Subscription deleted:', subscription.id);

  // Desactivar acceso del usuario
}

export default router;




