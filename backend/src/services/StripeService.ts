import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

if (!STRIPE_SECRET_KEY) {
  console.warn('⚠️ Missing Stripe secret key. Payment functionality will be limited.');
}

export type StripePlanType = 'small' | 'pro' | 'templates' | 'chatbots';

export interface IStripeService {
  createCheckoutSession(params: CheckoutSessionParams): Promise<Stripe.Checkout.Session>;
  createCheckoutSessionCustom(params: CheckoutSessionCustomParams): Promise<Stripe.Checkout.Session>;
  createCustomer(email: string, metadata?: Record<string, string>): Promise<Stripe.Customer>;
  getSession(sessionId: string): Promise<Stripe.Checkout.Session | null>;
  constructWebhookEvent(body: any, signature: string): Stripe.Event;
  getPlanPrice(planType: StripePlanType): Promise<number>;
  upgradeExistingSubscription(customerId: string, newStripeItems: { price: string, quantity: number }[]): Promise<Stripe.Subscription>;
  mapSelectionsToStripeItems(selections: any[]): { price: string, quantity: number }[];
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
    quantity: number;
    departments?: number;
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

  async createCheckoutSession(params: CheckoutSessionParams): Promise<Stripe.Checkout.Session> {
    const { email, userId, planType, successUrl, cancelUrl, metadata = {} } = params;
    let priceId = '';

    if (planType === 'small' || planType === 'templates') {
      priceId = process.env.STRIPE_PRICE_SMALL || process.env.STRIPE_PRICE_TEMPLATES || '';
    } else if (planType === 'pro' || planType === 'chatbots') {
      priceId = process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_CHATBOTS || '';
    }

    if (!priceId) {
      throw new Error(`Price ID no configurado en .env para el plan: ${planType}`);
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
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

      if (!session.url) throw new Error('Failed to generate checkout session URL');
      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  async createCheckoutSessionCustom(params: CheckoutSessionCustomParams): Promise<Stripe.Checkout.Session> {
    const { selections, email, userId } = params;
    const line_items = this.mapSelectionsToStripeItems(selections);

    try {
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
          selections: JSON.stringify(selections),
          ...params.metadata,
        },
        success_url: params.successUrl || `${FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: params.cancelUrl || `${FRONTEND_URL}/pricing?canceled=true`,
      });

      if (!session.url) throw new Error('Failed to generate checkout session URL');
      return session;
    } catch (error: any) {
      console.error('CRASH al llamar a Stripe:', error.message);
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

    if (!priceId) return 0;

    try {
      const price = await this.stripe.prices.retrieve(priceId);
      if (!price.unit_amount) return 0;
      return price.unit_amount / 100;
    } catch (error) {
      console.error(`Error fetching price for ${planType}:`, error);
      return 0;
    }
  }

  async upgradeExistingSubscription(customerId: string, newStripeItems: { price: string, quantity: number }[]): Promise<Stripe.Subscription> {
    const subscriptions = await this.stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      throw new Error('No se encontró una suscripción activa para este cliente.');
    }

    const currentSub = subscriptions.data[0];

    const itemsToClear = currentSub.items.data.map(item => ({
      id: item.id,
      deleted: true
    }));

    const itemsToAdd = newStripeItems.map(item => ({
      price: item.price,
      quantity: item.quantity
    }));

    const updatedSub = await this.stripe.subscriptions.update(currentSub.id, {
      items: [...itemsToClear, ...itemsToAdd],
      proration_behavior: 'create_prorations',
    });

    return updatedSub;
  }

  public mapSelectionsToStripeItems(selections: any[]): { price: string, quantity: number }[] {
    const items: { price: string, quantity: number }[] = [];
    const selection = selections[0]; 
    if (!selection) return items;

    const isSmall = selection.planType === 'small' || selection.planType === 'templates';
    const isPro = selection.planType === 'pro' || selection.planType === 'chatbots';

    const basePriceId = isPro 
      ? (process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_CHATBOTS) 
      : (process.env.STRIPE_PRICE_SMALL || process.env.STRIPE_PRICE_TEMPLATES);

    if (!basePriceId) {
      throw new Error(`Falta configurar STRIPE_PRICE_${selection.planType.toUpperCase()} en tu archivo .env`);
    }
    
    items.push({ price: basePriceId, quantity: 1 });

    if (isPro) {
      const extraLocs = Math.max(0, (selection.quantity || 1) - 1);
      if (extraLocs > 0) {
        const locPriceId = process.env.STRIPE_PRICE_EXTRA_LOC;
        if (!locPriceId) throw new Error('Falta STRIPE_PRICE_EXTRA_LOC en el .env');
        items.push({ price: locPriceId, quantity: extraLocs });
      }

      const extraDepts = Math.max(0, (selection.departments || 1) - 1);
      if (extraDepts > 0) {
        const deptPriceId = process.env.STRIPE_PRICE_EXTRA_DEPT;
        if (!deptPriceId) throw new Error('Falta STRIPE_PRICE_EXTRA_DEPT en el .env');
        items.push({ price: deptPriceId, quantity: extraDepts });
      }
    }

    return items;
  }

  constructWebhookEvent(body: any, signature: string): Stripe.Event {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    try {
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