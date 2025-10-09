/**
 * PaywallService - Single Responsibility Principle
 * Handles ONLY payment/subscription operations
 * Mock implementation for development without Stripe API calls
 */

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  stripePriceId?: string;
}

export interface CheckoutSession {
  url: string;
  sessionId: string;
}

/**
 * Plans configuration (puede venir de API en producción)
 */
export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Up to 1,000 messages/month',
      'Basic call routing',
      'WhatsApp integration',
      'Email support',
      'Basic analytics',
    ],
    stripePriceId: 'price_starter_monthly',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 129,
    currency: 'EUR',
    interval: 'month',
    popular: true,
    features: [
      'Up to 5,000 messages/month',
      'Advanced call routing',
      'WhatsApp + SMS integration',
      'Priority support',
      'Advanced analytics',
      'Multi-location support',
    ],
    stripePriceId: 'price_professional_monthly',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Unlimited messages',
      'Custom routing rules',
      'Full omnichannel integration',
      '24/7 phone support',
      'Custom analytics dashboard',
      'Unlimited locations',
      'API access',
    ],
    stripePriceId: 'price_enterprise_monthly',
  },
];

/**
 * PaywallService - Mock implementation para desarrollo
 */
export class PaywallService {
  /**
   * Obtener planes disponibles
   */
  async getPlans(): Promise<Plan[]> {
    // En producción, esto vendría de API
    return Promise.resolve(PLANS);
  }

  /**
   * Crear sesión de checkout (Mock)
   * En producción, esto llamaría a /api/create-checkout-session
   */
  async createCheckoutSession(planId: string, email: string): Promise<CheckoutSession> {
    // MOCK: Simula Stripe Checkout sin llamada real
    console.log(`[MOCK] Creating checkout session for plan: ${planId}, email: ${email}`);
    
    // Simula delay de red
    await new Promise(resolve => setTimeout(resolve, 500));

    // En producción:
    // const res = await fetch('/api/create-checkout-session', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ planId, email }),
    // });
    // return res.json();

    return {
      url: `/mock-checkout?plan=${planId}&email=${encodeURIComponent(email)}`,
      sessionId: `mock_${Date.now()}`,
    };
  }

  /**
   * Verificar estado de pago (Mock)
   * En producción, verificaría con Stripe API
   */
  async verifyPayment(sessionId: string): Promise<boolean> {
    console.log(`[MOCK] Verifying payment for session: ${sessionId}`);
    
    // En dev, siempre retorna true después de 1 segundo
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }

  /**
   * Obtener plan actual del usuario
   */
  async getCurrentPlan(userId: string): Promise<Plan | null> {
    // En producción, esto vendría de API con subscripción Stripe
    // const res = await fetch(`/api/users/${userId}/subscription`);
    // return res.json();

    // Mock: asume plan Professional
    return PLANS.find(p => p.id === 'professional') || null;
  }

  /**
   * Validar acceso a feature según plan
   */
  canAccessFeature(currentPlan: Plan | null, requiredPlan: string): boolean {
    if (!currentPlan) return false;

    const planHierarchy = ['starter', 'professional', 'enterprise'];
    const currentIndex = planHierarchy.indexOf(currentPlan.id);
    const requiredIndex = planHierarchy.indexOf(requiredPlan);

    return currentIndex >= requiredIndex;
  }
}

// Singleton instance
export const paywallService = new PaywallService();

