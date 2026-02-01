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
// HANDLERS
// ==================

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const email = session.customer_details?.email || session.customer_email;
  console.log('📧 Checkout session received for email:', email);

  if (!email) throw new Error('No email found in checkout session');

  const password = session.metadata?.password;
  console.log('🔑 Metadata password:', password);

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
      console.error('❌ Supabase createUser error:', error);
      if (error.code === 'email_exists') {
        const { data: listData } = await supabase.auth.admin.listUsers();
        authUser = listData.users.find(u => u.email === email);
        console.log('⚠️ Existing auth user found:', authUser?.id);
      } else {
        throw error;
      }
    } else {
      authUser = data?.user;
      console.log('✅ Auth user created:', authUser?.id);
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

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

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
      console.log('✅ User record created:', userRecord.id);
    }

    await supabaseService.recordPurchasedLocations(userRecord.id, selections);
    console.log('🎉 Checkout completed successfully for user:', email);
  } catch (err) {
    console.error('💥 Failed during user record creation or recording selections:', err);
    throw err;
  }
}

// Otros handlers (paymentSucceeded, paymentFailed, subscriptions) se mantienen igual
async function handlePaymentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.log('✅ Payment succeeded:', paymentIntent.id);
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

// ==================
// WHATSAPP HANDLERS
// ==================

async function handleIncomingMessages(value: any) {
  const phoneNumberId = value.metadata?.phone_number_id;
  const messages = value.messages;

  if (!phoneNumberId || !messages || messages.length === 0) return;

  console.log(`📨 Processing ${messages.length} incoming message(s)`);

  for (const messageEvent of messages) {
    try {
      const from = messageEvent.from;
      const messageId = messageEvent.id;

      let content = '';
      if (messageEvent.type === 'text' && messageEvent.text?.body) {
        content = messageEvent.text.body;
      } else if (messageEvent.type === 'interactive') {
        if (messageEvent.interactive?.button_reply) {
          content = messageEvent.interactive.button_reply.title;
        } else if (messageEvent.interactive?.list_reply) {
          content = messageEvent.interactive.list_reply.title;
        }
      } else if (messageEvent.type === 'image') {
        content = '[Imagen recibida]';
      } else if (messageEvent.type === 'document') {
        content = '[Documento recibido]';
      } else if (messageEvent.type === 'audio') {
        content = '[Audio recibido]';
      } else if (messageEvent.type === 'video') {
        content = '[Video recibido]';
      } else {
        content = `[Mensaje tipo: ${messageEvent.type}]`;
      }

      console.log(`📩 Message from ${from}: ${content.substring(0, 50)}`);

      const phoneNumber = await supabaseService.getPhoneNumberByProviderId(phoneNumberId);

      if (!phoneNumber) {
        console.error(`❌ Phone number not found for provider_id: ${phoneNumberId}`);
        continue;
      }

      await supabaseService.createMessage({
        userId: phoneNumber.userId,
        phoneNumberId: phoneNumber.id,
        type: 'WhatsApp',
        content: content,
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

  if (!statuses || statuses.length === 0) return;

  console.log(`📊 Processing ${statuses.length} status update(s)`);

  for (const status of statuses) {
    try {
      const messageId = status.id;
      const newStatus = status.status;

      console.log(`📈 Status update for message ${messageId}: ${newStatus}`);

      let mappedStatus: 'sent' | 'delivered' | 'read' | 'failed' = 'sent';

      if (newStatus === 'sent') mappedStatus = 'sent';
      else if (newStatus === 'delivered') mappedStatus = 'delivered';
      else if (newStatus === 'read') mappedStatus = 'read';
      else if (newStatus === 'failed') mappedStatus = 'failed';

      await supabaseService.updateMessageStatus(messageId, mappedStatus);

      console.log(`✅ Message status updated to: ${mappedStatus}`);

      if (newStatus === 'failed' && status.errors) {
        const errorMessage = status.errors
          .map((e: any) => `${e.code}: ${e.title}`)
          .join(', ');

        await supabaseService.updateMessageError(messageId, errorMessage);
        console.error(`❌ Message failed: ${errorMessage}`);
      }

    } catch (error) {
      console.error('Error processing status update:', error);
    }
  }
}

export default router;