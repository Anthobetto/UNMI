// Webhook Routes - Stripe + WhatsApp events
// Implementa SRP: Solo manejo de webhooks externos

import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { supabase } from '../config/database'; // Asegúrate de que exportas 'supabase' (cliente admin) aquí
import { supabaseService } from '../services/SupabaseService';
import { stripeService } from '../services/StripeService';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';

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

  // 🚨 CAMBIO FINAL:
  // Con la nueva config de index.ts, req.body YA ES EL BUFFER.
  // No necesitamos req.rawBody.
  const payload = req.body;

  // DEBUG: Vamos a ver qué nos llega realmente
  console.log(`📦 Webhook Payload Type: ${Buffer.isBuffer(payload) ? 'Buffer ✅' : typeof payload + ' ❌'}`);

  if (!Buffer.isBuffer(payload)) {
    // Si entra aquí, es que express.json se nos adelantó (no debería pasar con la config nueva)
    console.error('❌ El payload es un Objeto JSON, debería ser un Buffer. Revisa el orden en index.ts');
    return res.status(400).send('Webhook Error: Payload must be a Buffer, not JSON');
  }

  let event: Stripe.Event;

  // 2. Validar la firma con el rawBody
  try {
    // Pasamos el Buffer directamente
    event = stripeService.constructWebhookEvent(payload, sig);
    console.log(`✅ Webhook Stripe verificado: ${event.type}`);
  } catch (err: any) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 3. Procesar el evento
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

    // Respuesta de éxito a Stripe
    return res.json({ received: true });

  } catch (error) {
    console.error(`💥 Error procesando webhook (${event.type}):`, error);
    // Stripe reintentará si devolvemos 500, útil para errores temporales de DB
    return res.status(500).json({
      error: 'Webhook processing failed',
      type: event.type
    });
  }
});

// =================================================================
// STRIPE HANDLERS (Lógica de Negocio)
// =================================================================

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  // Datos básicos
  const email = session.customer_details?.email || session.customer_email;
  if (!email) throw new Error('No email found in checkout session');

  const metadata = session.metadata || {};
  const userId = metadata.userId; // ID del usuario (puede ser temporal o real)

  console.log(`💰 Procesando Checkout para: ${email} (User ID: ${userId})`);

  // Parsear selecciones (small/pro, cantidades, etc.)
  let selections: any[] = [];
  try {
    if (metadata.selections) {
      selections = JSON.parse(metadata.selections);
    } else {
      // Fallback por si no viene metadata (legacy)
      selections = [{ planType: metadata.planType || 'small', quantity: 1 }];
    }
  } catch (e) {
    console.error("Error parseando selections:", e);
    selections = [{ planType: 'small', quantity: 1 }];
  }

  // 1. Obtener o Crear Usuario en Supabase Auth
  // Nota: Si el usuario se registró en AuthPage, ya debería existir.
  // Si no existe, intentamos crearlo (requiere password en metadata, lo cual es arriesgado pero soportado).
  let authUser;

  // Intentamos buscarlo primero
  const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
  authUser = existingAuthUsers.users.find(u => u.email === email);

  if (!authUser) {
    // Si no existe, intentamos crearlo
    const password = metadata.password;
    if (!password) {
      console.warn(`⚠️ Usuario ${email} no existe y no hay contraseña en metadata. No se puede crear cuenta.`);
      // Aquí podríamos enviar un email al usuario para que "reclame" su cuenta
      return;
    }

    const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: metadata.username,
        company_name: metadata.companyName
      }
    });

    if (createError) throw createError;
    authUser = newAuthUser.user;
  }

  if (!authUser) throw new Error('Could not obtain auth user');

  // 2. Asegurar registro en tabla pública 'users'
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single();

  let userRecord = existingUser;

  if (!userRecord) {
    console.log("Creando registro de usuario en DB pública...");
    userRecord = await supabaseService.createUser({
      auth_id: authUser.id,
      username: metadata.username || email.split('@')[0],
      email: email,
      companyName: metadata.companyName || 'Sin Empresa',
      termsAccepted: true,
      subscriptionStatus: 'active',
      planType: selections[0].planType // 'small' o 'pro'
    });
  } else {
    // Actualizar plan si ya existía
    await supabaseService.updateUserPlan(userRecord.id, selections[0].planType);
  }

  // 3. Registrar compras (Localizaciones y Departamentos)
  // SupabaseService.recordPurchasedLocations debe estar preparado para recibir el array de selections
  // Si tu servicio aún no tiene este método exacto, aquí tienes la lógica inline:

  if (userRecord) {
    for (const sel of selections) {
      // Insertar en purchased_locations
      const { error: purchaseError } = await supabase
        .from('purchased_locations')
        .insert({
          user_id: userRecord.id,
          plan_type: sel.planType, // 'small' o 'pro'
          quantity: sel.quantity,
          departments_count: sel.departments || 1, // Guardamos departamentos si tu DB tiene la columna
          stripe_session_id: session.id,
          status: 'active',
          purchased_at: new Date()
        });

      if (purchaseError) console.error("Error guardando purchased_locations:", purchaseError);
    }
  }

  console.log('🎉 Checkout completado y procesado exitosamente.');
}

async function handlePaymentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.log('✅ Pago exitoso (Intent):', paymentIntent.id);
}

async function handlePaymentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.error('❌ Pago fallido:', paymentIntent.id);
  // Aquí podrías enviar un email de aviso o desactivar servicios temporalmente
}

async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log('✅ Suscripción creada:', subscription.id);
  // Lógica adicional si necesitas guardar el ID de suscripción en la tabla users
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log('📝 Suscripción actualizada:', subscription.id);
  // Verificar si está activa, impagada, o cancelada
  const status = subscription.status;
  // Actualizar DB según estado
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log('❌ Suscripción cancelada:', subscription.id);
  // Buscar usuario por stripe_customer_id y poner status 'inactive'
}


// =================================================================
// WHATSAPP WEBHOOK (Sin cambios, se mantiene tu lógica)
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