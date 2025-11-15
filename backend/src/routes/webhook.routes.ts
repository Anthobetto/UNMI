// Webhook Routes - Stripe events
// Implementa SRP: Solo manejo de webhooks externos
import { Router, Request, Response } from 'express';
import express from 'express';
import Stripe from 'stripe';
import supabase from '../config/database';
import { supabaseService } from '@/services/SupabaseService';
import { stripeService } from '../services/StripeService';

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
  const email = session.customer_details?.email || session.customer_email;

  if (!email) throw new Error('No email found in checkout session');
  console.log('📧 Processing checkout for:', email);

  const password = session.metadata?.password;
  if (!password) throw new Error('Password is required for registration');
  console.log('✅ Password found in metadata');

  const selections = session.metadata?.selections
    ? JSON.parse(session.metadata.selections)
    : [];

  const userMeta = {
    stripe_session_id: session.id,
    stripe_customer_id: session.customer ?? null,
  };

  // 1️⃣ Crear usuario en Supabase Auth o recuperar existente
  let authUser;
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: userMeta,
      email_confirm: true,
    });

    if (error) {
      if (error.code === 'email_exists') {
        console.log('⚠️ User already exists, fetching...');
        const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        authUser = listData.users.find(u => u.email === email);
        if (!authUser) throw new Error('User exists but could not be retrieved');
      } else {
        throw error;
      }
    } else {
      authUser = data?.user;
    }
  } catch (err) {
    console.error('Failed to create/find auth user:', err);
    throw err;
  }

  if (!authUser) throw new Error('Could not obtain auth user');
  const authId = authUser.id;

  // 2️⃣ Buscar usuario en tabla `users`
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  let userRecord = existingUser;

  // 3️⃣ Si existe, actualizar auth_id si falta
  if (userRecord) {
    if (authId && userRecord.auth_id !== authId) {
      await supabase
        .from('users')
        .update({ auth_id: authId })
        .eq('id', userRecord.id);
      userRecord.auth_id = authId;
    }
  } else {
    // 4️⃣ Crear nuevo usuario (sin planType, solo datos básicos)
    userRecord = await supabaseService.createUser({
      auth_id: authId,
      username: session.metadata?.username || email.split('@')[0],
      email,
      companyName: session.metadata?.companyName || '',
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      subscriptionStatus: 'active',
    });
  }

  // 5️⃣ Registrar purchased_locations según las selecciones
  const purchasedSelections = selections.length > 0 
    ? selections 
    : [{ planType: 'templates', quantity: 1 }]; // fallback

  await supabaseService.recordPurchasedLocations(userRecord.id, purchasedSelections);

  console.log('🎉 Checkout completed successfully!');
  console.log('📧 Email:', email);
  console.log('🆔 User ID:', userRecord.id);
  console.log('🔑 Auth ID:', authId);
}



async function handlePaymentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.log('✅ Payment succeeded:', paymentIntent.id);

  if (paymentIntent.metadata?.userId) {
    console.log(`Payment succeeded for user: ${paymentIntent.metadata.userId}`);
  }
}

async function handlePaymentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.error('❌ Payment failed:', paymentIntent.id);

  if (paymentIntent.metadata?.userId) {
    console.log(`Notify user: ${paymentIntent.metadata.userId}`);
  }
}

async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log('✅ Subscription created:', subscription.id);
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log('📝 Subscription updated:', subscription.id);
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log('❌ Subscription deleted:', subscription.id);
}

export default router;