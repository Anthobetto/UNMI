// Webhook Routes - Stripe + WhatsApp events
// Implementa SRP: Solo manejo de webhooks externos
import { Router } from 'express';
import express from 'express';
import supabase from '../config/database';
import { supabaseService } from '../services/SupabaseService';
import { stripeService } from '../services/StripeService';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';
const router = Router();
// ==================
// STRIPE WEBHOOK
// ==================
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
        res.status(400).send('Missing stripe-signature header');
        return;
    }
    let event;
    try {
        event = stripeService.constructWebhookEvent(req.body, sig);
    }
    catch (err) {
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
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({
            error: 'Webhook processing failed',
            type: event.type
        });
    }
});
// ==================
// WHATSAPP WEBHOOK
// ==================
// Verificación del webhook (GET) - Meta lo llama para verificar
router.get('/whatsapp', asyncHandler(async (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    console.log('🔍 Webhook verification request:', { mode, token: token ? '***' : 'missing' });
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully');
        res.status(200).send(challenge);
        return;
    }
    console.error('❌ Webhook verification failed');
    throw new ValidationError('Invalid verification token');
}));
// Recepción de eventos (POST) - Meta envía mensajes y estados aquí
router.post('/whatsapp', asyncHandler(async (req, res) => {
    const body = req.body;
    console.log('📬 Webhook received:', JSON.stringify(body, null, 2));
    if (!body?.entry || !Array.isArray(body.entry)) {
        console.error('❌ Invalid webhook payload structure');
        throw new ValidationError('Invalid webhook payload');
    }
    for (const entry of body.entry) {
        const changes = entry.changes;
        if (!changes || !Array.isArray(changes))
            continue;
        for (const change of changes) {
            const value = change.value;
            // 📨 MENSAJES ENTRANTES
            if (value?.messages && Array.isArray(value.messages)) {
                await handleIncomingMessages(value);
            }
            // ✅ CAMBIOS DE ESTADO
            if (value?.statuses && Array.isArray(value.statuses)) {
                await handleMessageStatuses(value);
            }
        }
    }
    res.status(200).json({ success: true });
}));
// ==================
// STRIPE HANDLERS
// ==================
async function handleCheckoutCompleted(event) {
    const session = event.data.object;
    const email = session.customer_details?.email || session.customer_email;
    if (!email)
        throw new Error('No email found in checkout session');
    console.log('📧 Processing checkout for:', email);
    const password = session.metadata?.password;
    if (!password)
        throw new Error('Password is required for registration');
    console.log('✅ Password found in metadata');
    const selections = session.metadata?.selections
        ? JSON.parse(session.metadata.selections)
        : [];
    const userMeta = {
        stripe_session_id: session.id,
        stripe_customer_id: session.customer ?? null,
    };
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
                if (listError)
                    throw listError;
                authUser = listData.users.find(u => u.email === email);
                if (!authUser)
                    throw new Error('User exists but could not be retrieved');
            }
            else {
                throw error;
            }
        }
        else {
            authUser = data?.user;
        }
    }
    catch (err) {
        console.error('Failed to create/find auth user:', err);
        throw err;
    }
    if (!authUser)
        throw new Error('Could not obtain auth user');
    const authId = authUser.id;
    const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
    let userRecord = existingUser;
    if (userRecord) {
        if (authId && userRecord.auth_id !== authId) {
            await supabase
                .from('users')
                .update({ auth_id: authId })
                .eq('id', userRecord.id);
            userRecord.auth_id = authId;
        }
    }
    else {
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
    const purchasedSelections = selections.length > 0
        ? selections
        : [{ planType: 'templates', quantity: 1 }];
    await supabaseService.recordPurchasedLocations(userRecord.id, purchasedSelections);
    console.log('🎉 Checkout completed successfully!');
    console.log('📧 Email:', email);
    console.log('🆔 User ID:', userRecord.id);
    console.log('🔑 Auth ID:', authId);
}
async function handlePaymentSucceeded(event) {
    const paymentIntent = event.data.object;
    console.log('✅ Payment succeeded:', paymentIntent.id);
    if (paymentIntent.metadata?.userId) {
        console.log(`Payment succeeded for user: ${paymentIntent.metadata.userId}`);
    }
}
async function handlePaymentFailed(event) {
    const paymentIntent = event.data.object;
    console.error('❌ Payment failed:', paymentIntent.id);
    if (paymentIntent.metadata?.userId) {
        console.log(`Notify user: ${paymentIntent.metadata.userId}`);
    }
}
async function handleSubscriptionCreated(event) {
    const subscription = event.data.object;
    console.log('✅ Subscription created:', subscription.id);
}
async function handleSubscriptionUpdated(event) {
    const subscription = event.data.object;
    console.log('📝 Subscription updated:', subscription.id);
}
async function handleSubscriptionDeleted(event) {
    const subscription = event.data.object;
    console.log('❌ Subscription deleted:', subscription.id);
}
// ==================
// WHATSAPP HANDLERS
// ==================
async function handleIncomingMessages(value) {
    const phoneNumberId = value.metadata?.phone_number_id;
    const messages = value.messages;
    if (!phoneNumberId || !messages || messages.length === 0)
        return;
    console.log(`📨 Processing ${messages.length} incoming message(s)`);
    for (const messageEvent of messages) {
        try {
            const from = messageEvent.from;
            const messageId = messageEvent.id;
            let content = '';
            if (messageEvent.type === 'text' && messageEvent.text?.body) {
                content = messageEvent.text.body;
            }
            else if (messageEvent.type === 'interactive') {
                if (messageEvent.interactive?.button_reply) {
                    content = messageEvent.interactive.button_reply.title;
                }
                else if (messageEvent.interactive?.list_reply) {
                    content = messageEvent.interactive.list_reply.title;
                }
            }
            else if (messageEvent.type === 'image') {
                content = '[Imagen recibida]';
            }
            else if (messageEvent.type === 'document') {
                content = '[Documento recibido]';
            }
            else if (messageEvent.type === 'audio') {
                content = '[Audio recibido]';
            }
            else if (messageEvent.type === 'video') {
                content = '[Video recibido]';
            }
            else {
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
        }
        catch (error) {
            console.error('Error processing incoming message:', error);
        }
    }
}
async function handleMessageStatuses(value) {
    const statuses = value.statuses;
    if (!statuses || statuses.length === 0)
        return;
    console.log(`📊 Processing ${statuses.length} status update(s)`);
    for (const status of statuses) {
        try {
            const messageId = status.id;
            const newStatus = status.status;
            console.log(`📈 Status update for message ${messageId}: ${newStatus}`);
            let mappedStatus = 'sent';
            if (newStatus === 'sent')
                mappedStatus = 'sent';
            else if (newStatus === 'delivered')
                mappedStatus = 'delivered';
            else if (newStatus === 'read')
                mappedStatus = 'read';
            else if (newStatus === 'failed')
                mappedStatus = 'failed';
            await supabaseService.updateMessageStatus(messageId, mappedStatus);
            console.log(`✅ Message status updated to: ${mappedStatus}`);
            if (newStatus === 'failed' && status.errors) {
                const errorMessage = status.errors
                    .map((e) => `${e.code}: ${e.title}`)
                    .join(', ');
                await supabaseService.updateMessageError(messageId, errorMessage);
                console.error(`❌ Message failed: ${errorMessage}`);
            }
        }
        catch (error) {
            console.error('Error processing status update:', error);
        }
    }
}
export default router;
