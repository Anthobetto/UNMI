// Webhook Routes - Stripe + WhatsApp events
// Implementa SRP: Solo manejo de webhooks externos
import { Router, Request, Response } from 'express';
import express from 'express';
import Stripe from 'stripe';
import supabase from '../config/database';
import { supabaseService } from '../services/SupabaseService';
import { stripeService } from '../services/StripeService';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';

const router = Router();

// ==================
// STRIPE WEBHOOK
// ==================
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      console.error('❌ Missing stripe-signature header');
      return res.status(400).send('Missing Stripe signature');
    }

    let event: Stripe.Event;
    try {
      event = stripeService.constructWebhookEvent(req.body, sig);
    } catch (err: any) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
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
      res.status(500).json({ error: 'Webhook processing failed', type: event.type });
    }
  }
);

// ==================
// STRIPE HANDLERS
// ==================
async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const email = session.customer_details?.email || session.customer_email;
  if (!email) throw new Error('No email found in checkout session');

  const password = session.metadata?.password;
  if (!password) throw new Error('Password is required for registration');

  const selections = session.metadata?.selections
    ? JSON.parse(session.metadata.selections)
    : [{ planType: 'templates', quantity: 1 }];

  const userMeta = { stripe_session_id: session.id, stripe_customer_id: session.customer ?? null };
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
        const { data: listData } = await supabase.auth.admin.listUsers();
        authUser = listData.users.find(u => u.email === email);
      } else {
        throw error;
      }
    } else {
      authUser = data?.user;
    }
  } catch (err) {
    console.error('💥 Failed to create/find auth user:', err);
    throw err;
  }

  if (!authUser) throw new Error('Could not obtain auth user');
  const authId = authUser.id;

  try {
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    let userRecord = existingUser;
    if (!userRecord) {
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

    await supabaseService.recordPurchasedLocations(userRecord.id, selections);
    console.log('🎉 Checkout completed successfully for user:', email);
  } catch (err) {
    console.error('💥 Failed during user record creation or recording selections:', err);
    throw err;
  }
}

async function handlePaymentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.log('✅ Payment succeeded:', paymentIntent.id);
}

async function handlePaymentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.error('❌ Payment failed:', paymentIntent.id);
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

// ==================
// WHATSAPP WEBHOOK
// ==================

// Verificación del webhook (GET)
router.get(
  '/whatsapp',
  asyncHandler(async (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔍 Webhook verification request:', { mode, token: token ? '***' : 'missing' });

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully');
      return res.status(200).send(challenge);
    }

    console.error('❌ Webhook verification failed');
    throw new ValidationError('Invalid verification token');
  })
);

// Recepción de eventos (POST)
router.post(
  '/whatsapp',
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body;
    console.log('📬 Webhook received:', JSON.stringify(body, null, 2));

    if (!body?.entry || !Array.isArray(body.entry)) {
      throw new ValidationError('Invalid webhook payload');
    }

    for (const entry of body.entry) {
      const changes = entry.changes;
      if (!changes || !Array.isArray(changes)) continue;

      for (const change of changes) {
        const value = change.value;

        if (value?.messages && Array.isArray(value.messages)) {
          await handleIncomingMessages(value);
        }

        if (value?.statuses && Array.isArray(value.statuses)) {
          await handleMessageStatuses(value);
        }
      }
    }

    res.status(200).json({ success: true });
  })
);

// ==================
// WHATSAPP HANDLERS
// ==================
async function handleIncomingMessages(value: any) {
  const phoneNumberId = value.metadata?.phone_number_id;
  const messages = value.messages;
  if (!phoneNumberId || !messages?.length) return;

  console.log(`📨 Processing ${messages.length} incoming message(s)`);

  for (const messageEvent of messages) {
    try {
      const from = messageEvent.from;
      const messageId = messageEvent.id;

      let content = '';
      switch (messageEvent.type) {
        case 'text':
          content = messageEvent.text?.body || '';
          break;
        case 'interactive':
          content =
            messageEvent.interactive?.button_reply?.title ||
            messageEvent.interactive?.list_reply?.title ||
            '';
          break;
        case 'image':
          content = '[Imagen recibida]';
          break;
        case 'document':
          content = '[Documento recibido]';
          break;
        case 'audio':
          content = '[Audio recibido]';
          break;
        case 'video':
          content = '[Video recibido]';
          break;
        default:
          content = `[Mensaje tipo: ${messageEvent.type}]`;
      }

      console.log(`📩 Message from ${from}: ${content.substring(0, 50)}`);

      const phoneNumber = await supabaseService.getPhoneNumberByProviderId(phoneNumberId);
      if (!phoneNumber) continue;

      await supabaseService.createMessage({
        userId: phoneNumber.userId,
        phoneNumberId: phoneNumber.id,
        type: 'WhatsApp',
        content,
        recipient: from,
        status: 'received',
        direction: 'inbound',
        whatsappMessageId: messageId,
      });

      console.log(`✅ Message saved to database`);
    } catch (error) {
      console.error('Error processing incoming message:', error);
    }
  }
}

async function handleMessageStatuses(value: any) {
  const statuses = value.statuses;
  if (!statuses?.length) return;

  console.log(`📊 Processing ${statuses.length} status update(s)`);

  for (const status of statuses) {
    try {
      const messageId = status.id;
      const newStatus = status.status;

      let mappedStatus: 'sent' | 'delivered' | 'read' | 'failed' = 'sent';
      if (['sent', 'delivered', 'read', 'failed'].includes(newStatus)) {
        mappedStatus = newStatus as 'sent' | 'delivered' | 'read' | 'failed';
      }

      await supabaseService.updateMessageStatus(messageId, mappedStatus);

      if (newStatus === 'failed' && status.errors) {
        const errorMessage = status.errors.map((e: any) => `${e.code}: ${e.title}`).join(', ');
        await supabaseService.updateMessageError(messageId, errorMessage);
        console.error(`❌ Message failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error processing status update:', error);
    }
  }
}

export default router;
