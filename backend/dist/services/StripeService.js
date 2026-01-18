// Stripe Service - DIP (Dependency Inversion Principle)
// Abstracción sobre Stripe API para facilitar testing y cambios
import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
if (!STRIPE_SECRET_KEY) {
    console.warn('⚠️ Missing Stripe secret key. Payment functionality will be limited.');
}
export class StripeService {
    stripe;
    webhookSecret;
    constructor() {
        this.stripe = new Stripe(STRIPE_SECRET_KEY || 'dummy_key', {
            apiVersion: '2025-02-24.acacia',
        });
        this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    }
    async createCheckoutSession(params) {
        const { email, userId, planType, successUrl, cancelUrl, metadata = {}, } = params;
        // Mapeo de plan a Price ID
        const priceIdMap = {
            templates: process.env.STRIPE_PRICE_TEMPLATES,
            chatbots: process.env.STRIPE_PRICE_CHATBOTS,
            initial_registration: process.env.STRIPE_PRICE_TEMPLATES,
        };
        const priceId = priceIdMap[planType];
        if (!priceId) {
            throw new Error(`Price ID no configurado para el plan: ${planType}`);
        }
        try {
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                customer_email: email,
                success_url: successUrl || `${FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
                cancel_url: cancelUrl || `${FRONTEND_URL}/pricing?canceled=true`,
                metadata: {
                    userId,
                    planType,
                    ...metadata,
                },
            });
            if (!session.url) {
                throw new Error('Failed to generate checkout session URL');
            }
            return session;
        }
        catch (error) {
            console.error('Error creating checkout session:', error);
            throw new Error('Failed to create checkout session');
        }
    }
    // ✅ Método para checkout con múltiples selecciones
    async createCheckoutSessionCustom(params) {
        const line_items = params.selections.map(sel => {
            const priceId = process.env[`STRIPE_PRICE_${sel.planType.toUpperCase()}`];
            if (!priceId)
                throw new Error(`No price configured for ${sel.planType}`);
            return { price: priceId, quantity: sel.quantity };
        });
        try {
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items,
                mode: 'subscription',
                customer_email: params.email,
                metadata: {
                    userId: params.userId,
                    ...params.metadata,
                },
                success_url: params.successUrl || `${FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
                cancel_url: params.cancelUrl || `${FRONTEND_URL}/pricing?canceled=true`,
            });
            if (!session.url)
                throw new Error('Failed to generate checkout session URL');
            return session;
        }
        catch (error) {
            console.error('Error creating custom checkout session:', error);
            throw new Error('Failed to create custom checkout session');
        }
    }
    async createCustomer(email, metadata) {
        try {
            const customer = await this.stripe.customers.create({
                email,
                metadata: metadata || {},
            });
            return customer;
        }
        catch (error) {
            console.error('Error creating Stripe customer:', error);
            throw new Error('Failed to create customer');
        }
    }
    async getSession(sessionId) {
        try {
            const session = await this.stripe.checkout.sessions.retrieve(sessionId);
            return session;
        }
        catch (error) {
            console.error('Error retrieving session:', error);
            return null;
        }
    }
    // Obtener precio desde Stripe (para mostrar en frontend)
    async getPlanPrice(planType) {
        const priceIdMap = {
            templates: process.env.STRIPE_PRICE_TEMPLATES,
            chatbots: process.env.STRIPE_PRICE_CHATBOTS,
        };
        const price = await this.stripe.prices.retrieve(priceIdMap[planType]);
        if (!price.unit_amount)
            throw new Error(`No se encontró precio para ${planType}`);
        return price.unit_amount / 100; // convertir a euros
    }
    constructWebhookEvent(body, signature) {
        if (!this.webhookSecret) {
            throw new Error('Webhook secret not configured');
        }
        try {
            return this.stripe.webhooks.constructEvent(body, signature, this.webhookSecret);
        }
        catch (error) {
            console.error('Webhook signature verification failed:', error);
            throw new Error('Invalid webhook signature');
        }
    }
}
export const stripeService = new StripeService();
