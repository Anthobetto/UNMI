// services/StripeService.ts - Versión Actualizada para Paywall (Small/Pro)

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

if (!STRIPE_SECRET_KEY) {
  console.warn('⚠️ Missing Stripe secret key. Payment functionality will be limited.');
}

// Definimos el tipo unificado para evitar conflictos
export type StripePlanType = 'small' | 'pro' | 'templates' | 'chatbots';

export interface IStripeService {
  createCheckoutSession(params: CheckoutSessionParams): Promise<Stripe.Checkout.Session>;
  createCheckoutSessionCustom(params: CheckoutSessionCustomParams): Promise<Stripe.Checkout.Session>;
  createCustomer(email: string, metadata?: Record<string, string>): Promise<Stripe.Customer>;
  getSession(sessionId: string): Promise<Stripe.Checkout.Session | null>;
  constructWebhookEvent(body: any, signature: string): Stripe.Event;
  getPlanPrice(planType: StripePlanType): Promise<number>;
}

export interface CheckoutSessionParams {
  email: string;
  userId: string;
  planType: StripePlanType;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionCustomParams {
  email: string;
  userId: string;
  selections: {
    planType: StripePlanType;
    quantity: number;     // Localizaciones
    departments?: number; // Departamentos (Opcional)
  }[];
  metadata?: Record<string, any>;
  successUrl?: string;
  cancelUrl?: string;
}

export class StripeService implements IStripeService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    this.stripe = new Stripe(STRIPE_SECRET_KEY || 'dummy_key', {
      apiVersion: '2025-02-24.acacia',
    });
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  // Checkout Simple (Cambio de plan directo)
  async createCheckoutSession(params: CheckoutSessionParams): Promise<Stripe.Checkout.Session> {
    const {
      email,
      userId,
      planType,
      successUrl,
      cancelUrl,
      metadata = {},
    } = params;

    // Mapeo seguro de nombres de plan a variables de entorno
    let priceId = '';

    // Mapeo para SMALL
    if (planType === 'small' || planType === 'templates') {
      priceId = process.env.STRIPE_PRICE_SMALL || process.env.STRIPE_PRICE_TEMPLATES || '';
    }
    // Mapeo para PRO
    else if (planType === 'pro' || planType === 'chatbots') {
      priceId = process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_CHATBOTS || '';
    }

    if (!priceId) {
      throw new Error(`Price ID no configurado en .env para el plan: ${planType}`);
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
          planType, // Guardamos el plan seleccionado
          ...metadata,
        },
      });

      if (!session.url) {
        throw new Error('Failed to generate checkout session URL');
      }

      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  // ✅ Checkout Avanzado (Registro con múltiples localizaciones/deptos)
  // Este es el que usa tu AuthPage
  // services/StripeService.ts

  async createCheckoutSessionCustom(params: CheckoutSessionCustomParams): Promise<Stripe.Checkout.Session> {
    console.log("💳 [StripeService] Iniciando creación de sesión custom...");
    console.log("📦 [StripeService] Selecciones recibidas:", JSON.stringify(params.selections));

    const { selections, email, userId } = params;
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // Iteramos
    for (const sel of selections) {
      let basePriceId = '';
      const isPro = sel.planType === 'pro' || sel.planType === 'chatbots';
      const isSmall = sel.planType === 'small' || sel.planType === 'templates';

      // 1. Obtener ID del precio BASE
      if (isSmall) {
        basePriceId = process.env.STRIPE_PRICE_SMALL || process.env.STRIPE_PRICE_TEMPLATES || '';
      } else if (isPro) {
        basePriceId = process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_CHATBOTS || '';
      }

      console.log(`🔍 [StripeService] Plan: ${sel.planType}, PriceID detectado: ${basePriceId}`);

      if (!basePriceId) {
        console.error(`❌ [StripeService] ERROR: No hay Price ID configurado para ${sel.planType}`);
        throw new Error(`Price ID no configurado para ${sel.planType}`);
      }

      // Añadir Precio Base
      line_items.push({ price: basePriceId, quantity: 1 });

      // 2. Calcular EXTRAS (Solo PRO)
      if (isPro) {
        const extraLocs = Math.max(0, sel.quantity - 1);
        if (extraLocs > 0 && process.env.STRIPE_PRICE_EXTRA_LOC) {
          console.log(`➕ [StripeService] Añadiendo ${extraLocs} localizaciones extra`);
          line_items.push({ price: process.env.STRIPE_PRICE_EXTRA_LOC, quantity: extraLocs });
        }

        const extraDepts = Math.max(0, (sel.departments || 1) - 1);
        if (extraDepts > 0 && process.env.STRIPE_PRICE_EXTRA_DEPT) {
          console.log(`➕ [StripeService] Añadiendo ${extraDepts} departamentos extra`);
          line_items.push({ price: process.env.STRIPE_PRICE_EXTRA_DEPT, quantity: extraDepts });
        }
      }
    }

    try {
      console.log("🚀 [StripeService] Enviando petición a Stripe API...", JSON.stringify(line_items));

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        mode: 'subscription',
        customer_email: email,
        metadata: {
          userId: userId,
          planType: selections[0].planType,
          locationsCount: selections[0].quantity,
          departmentsCount: selections[0].departments || 1,
          ...params.metadata,
        },
        success_url: params.successUrl || `${FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: params.cancelUrl || `${FRONTEND_URL}/pricing?canceled=true`,
      });

      console.log("✅ [StripeService] Sesión creada. URL:", session.url);

      if (!session.url) throw new Error('Failed to generate checkout session URL');
      return session;
    } catch (error: any) {
      console.error('❌ [StripeService] CRASH al llamar a Stripe:', error.message);
      throw new Error('Failed to create custom checkout session');
    }
  }

  async createCustomer(email: string, metadata?: Record<string, string>): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        metadata: metadata || {},
      });
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  async getSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      console.error('Error retrieving session:', error);
      return null;
    }
  }

  async getPlanPrice(planType: StripePlanType): Promise<number> {
    let priceId = '';

    if (planType === 'small' || planType === 'templates') {
      priceId = process.env.STRIPE_PRICE_SMALL || process.env.STRIPE_PRICE_TEMPLATES || '';
    } else if (planType === 'pro' || planType === 'chatbots') {
      priceId = process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_CHATBOTS || '';
    }

    if (!priceId) {
      console.warn(`No price configured for ${planType}`);
      return 0;
    }

    try {
      const price = await this.stripe.prices.retrieve(priceId);
      if (!price.unit_amount) return 0;
      return price.unit_amount / 100; // convertir a euros
    } catch (error) {
      console.error(`Error fetching price for ${planType}:`, error);
      return 0;
    }
  }

  constructWebhookEvent(body: any, signature: string): Stripe.Event {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    try {
      // Ya no hacemos magia aquí, confiamos en que el router nos pasó el buffer
      return this.stripe.webhooks.constructEvent(
        body,
        signature,
        this.webhookSecret
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new Error('Invalid webhook signature');
    }
  }
}

export const stripeService = new StripeService();