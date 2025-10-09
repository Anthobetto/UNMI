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

export interface IStripeService {
  createCheckoutSession(params: CheckoutSessionParams): Promise<Stripe.Checkout.Session>;
  createCustomer(email: string, metadata?: Record<string, string>): Promise<Stripe.Customer>;
  getSession(sessionId: string): Promise<Stripe.Checkout.Session | null>;
  constructWebhookEvent(body: any, signature: string): Stripe.Event;
}

export interface CheckoutSessionParams {
  email: string;
  userId: string;
  planType: 'templates' | 'chatbots' | 'initial_registration';
  amount: number;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
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
    const {
      email,
      userId,
      planType,
      amount,
      successUrl,
      cancelUrl,
      metadata = {},
    } = params;

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: this.getPlanName(planType),
                description: this.getPlanDescription(planType),
              },
              unit_amount: amount * 100, // Stripe usa centavos
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
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
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
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

  private getPlanName(planType: string): string {
    const planNames: Record<string, string> = {
      'initial_registration': 'Registro Inicial UNMI',
      'templates': 'Plan Templates UNMI',
      'chatbots': 'Plan Chatbots UNMI',
    };

    return planNames[planType] || 'Plan UNMI';
  }

  private getPlanDescription(planType: string): string {
    const descriptions: Record<string, string> = {
      'initial_registration': 'Acceso a la plataforma con configuración inicial',
      'templates': 'Gestión de plantillas y mensajes automáticos',
      'chatbots': 'Chatbots inteligentes con IA',
    };

    return descriptions[planType] || 'Suscripción UNMI';
  }
}

export const stripeService = new StripeService();




