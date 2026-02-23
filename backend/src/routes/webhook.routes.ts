// Webhook Routes - Stripe + WhatsApp events
// Implementa SRP: Solo manejo de webhooks externos

import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { supabase } from '../config/database'; // Asegúrate de que exportas 'supabase' (cliente admin) aquí
import { supabaseService } from '../services/SupabaseService';
import { stripeService } from '../services/StripeService';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';
import crypto from 'crypto'; 

const router = Router();

// =================================================================
// STRIPE WEBHOOK
// =================================================================
router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    console.error('❌ Missing stripe-signature header');
    return res.status(400).send('Missing Stripe signature');
  }


  const payload = req.body;

  console.log(`📦 Webhook Payload Type: ${Buffer.isBuffer(payload) ? 'Buffer ✅' : typeof payload + ' ❌'}`);

  if (!Buffer.isBuffer(payload)) {
    console.error('❌ El payload es un Objeto JSON, debería ser un Buffer. Revisa el orden en index.ts');
    return res.status(400).send('Webhook Error: Payload must be a Buffer, not JSON');
  }

  let event: Stripe.Event;

  try {
    event = stripeService.constructWebhookEvent(payload, sig);
    console.log(`✅ Webhook Stripe verificado: ${event.type}`);
  } catch (err: any) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

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
        console.log(`ℹ️ Evento Stripe no manejado: ${event.type}`);
    }


  } catch (error) {
    console.error(`💥 Error procesando webhook (${event.type}):`, error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      type: event.type
    });
  }
});

// =================================================================
// STRIPE HANDLERS 
// =================================================================

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata || {};
  
  const email = session.customer_details?.email || session.customer_email;
  const authUserId = metadata.userId; 

  console.log(`💰 Procesando Checkout para: ${email} (Auth ID: ${authUserId})`);

  let selections: any[] = [];
  try {
    if (metadata.selections) selections = JSON.parse(metadata.selections);
    else selections = [{ planType: metadata.planType || 'small', quantity: 1, departments: 1 }];
  } catch (e) {
    selections = [{ planType: 'small', quantity: 1, departments: 1 }];
  }

  let userRecord;
  
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUserId) 
    .maybeSingle();

  if (fetchError) {
    console.error("❌ Error buscando al usuario en Supabase:", fetchError);
    throw fetchError;
  }

  if (existingUser) {
    console.log(`✅ Usuario encontrado (ID: ${existingUser.id}). Actualizando...`);
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'active',        
        stripe_customer_id: session.customer as string,
        plan_type: selections[0].planType,    
      })
      .eq('id', existingUser.id);
      
    if (updateError) throw updateError;
    userRecord = existingUser;

  } else {
    console.warn(`⚠️ El usuario ${email} pagó pero no tenía perfil público. CREANDO AHORA...`);
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        auth_id: authUserId, 
        email: email,
        username: email ? email.split('@')[0] : 'Usuario', 
        company_name: metadata.companyName || 'Sin Empresa',
        subscription_status: 'active', 
        stripe_customer_id: session.customer as string,
        plan_type: selections[0].planType,
        terms_accepted: true
      })
      .select()
      .single(); 

    if (insertError) {
      console.error("❌ Error creando usuario de emergencia:", insertError);
      throw insertError;
    }
    console.log(`✨ Usuario de emergencia creado con éxito (ID: ${newUser.id})`);
    userRecord = newUser;
  }

  if (userRecord) {
    console.log("🏗️ Registrando items comprados...");
    for (const sel of selections) {
       const { error: purchaseError } = await supabase
         .from('purchased_locations')
         .insert({
           user_id: userRecord.id, 
           plan_type: sel.planType,
           quantity: sel.quantity,
           departments_count: sel.departments || 1,
           stripe_session_id: session.id,
           status: 'active'
         });
       
       if (purchaseError) console.error("❌ Error guardando purchased_locations:", purchaseError);
    }
  }

  console.log('🎉 Proceso completado exitosamente.');
}

async function handlePaymentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.log('✅ Pago exitoso (Intent):', paymentIntent.id);
}

async function handlePaymentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.error('❌ Pago fallido:', paymentIntent.id);
}

async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log('✅ Suscripción creada:', subscription.id);
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log('📝 Suscripción actualizada:', subscription.id);
  const status = subscription.status;
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log('❌ Suscripción cancelada:', subscription.id);
}


// =================================================================
// WHATSAPP WEBHOOK
// =================================================================

// Verificación del webhook (GET)
router.get(
  '/whatsapp',
  asyncHandler(async (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔍 WhatsApp Webhook verification:', { mode, token: token ? '***' : 'missing' });

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ WhatsApp Webhook verified');
      return res.status(200).send(challenge);
    }

    console.error('❌ WhatsApp verification failed');
    throw new ValidationError('Invalid verification token');
  })
);

// Recepción de eventos (POST)
router.post(
  '/whatsapp',
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body;
    // console.log('📬 WA Event received'); // Comentado para no saturar logs

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
      if (!phoneNumber) {
        console.warn(`⚠️ Teléfono no encontrado en DB para ID proveedor: ${phoneNumberId}`);
        continue;
      }

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

  // console.log(`📊 Processing ${statuses.length} status update(s)`);

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
    }
  }
}

export default router;