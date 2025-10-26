// Stripe Mock Service - OCP (Open-Closed Principle)

import { Plan, PlanSelectionForm, StripeSession } from '@/types';

export interface IPaymentService {
  getPlans(planType?: 'templates' | 'chatbots'): Plan[];
  createCheckoutSession(formData: PlanSelectionForm): Promise<StripeSession>;
  getSessionStatus(sessionId: string): StripeSession | null;
  calculateExtraMessageCost(planId: string, extraMessages: number): number;
}

export class StripeMockService implements IPaymentService {
  private sessions: Map<string, StripeSession> = new Map();
  private plans: Plan[] = [
    {
      id: 'templates-basic',
      name: 'Templates Basic',
      type: 'templates',
      price: 60,
      features: ['templateAutomation'],
      messageLimit: 1000,
      extraMessagePrice: 1,
    },
    {
      id: 'templates-pro',
      name: 'Templates Pro',
      type: 'templates',
      price: 120,
      features: ['templateAutomation', 'fullApi', 'integrations'],
      messageLimit: 5000,
      extraMessagePrice: 0.8,
    },
    {
      id: 'chatbots-basic',
      name: 'Chatbots Basic',
      type: 'chatbots',
      price: 60,
      features: ['aiChatbots', 'aiBasic'],
      messageLimit: 1000,
      extraMessagePrice: 1,
    },
    {
      id: 'chatbots-pro',
      name: 'Chatbots Pro',
      type: 'chatbots',
      price: 120,
      features: ['aiChatbots', 'aiAdvanced', 'accountManager', 'sla'],
      messageLimit: 5000,
      extraMessagePrice: 0.8,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      type: 'chatbots',
      price: 0, // Custom pricing
      features: [
        'unlimitedMessages',
        'combinedTemplatesChatbots',
        'accountManager',
        'sla',
        'fullApi',
        'integrations'
      ],
      messageLimit: Infinity,
      extraMessagePrice: 0,
      popular: true,
    },
  ];

  public addPlan(plan: Plan): void {
    this.plans.push(plan);
  }

  getPlans(planType?: 'templates' | 'chatbots'): Plan[] {
    if (planType) {
      return this.plans.filter(plan => plan.type === planType);
    }
    return this.plans;
  }

  async createCheckoutSession(formData: PlanSelectionForm): Promise<StripeSession> {
    const plan = this.plans.find(p => p.id === formData.planId);
    if (!plan) throw new Error('Plan no encontrado');

    const sessionId = `cs_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: StripeSession = {
      id: sessionId,
      url: `https://checkout.stripe.com/mock/${sessionId}?plan=${plan.type}`,
      planType: plan.type,
      amount: plan.price,
      status: 'pending',
    };

    this.sessions.set(sessionId, session);

    setTimeout(() => {
      const currentSession = this.sessions.get(sessionId);
      if (currentSession) {
        currentSession.status = 'completed';
        this.sessions.set(sessionId, currentSession);
      }
    }, 2000);

    return session;
  }

  getSessionStatus(sessionId: string): StripeSession | null {
    return this.sessions.get(sessionId) || null;
  }

  async completePayment(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.status = 'completed';
    this.sessions.set(sessionId, session);
    return true;
  }

  async failPayment(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.status = 'failed';
    this.sessions.set(sessionId, session);
    return true;
  }

  calculateExtraMessageCost(planId: string, extraMessages: number): number {
    const plan = this.plans.find(p => p.id === planId);
    if (!plan) return 0;
    return extraMessages * plan.extraMessagePrice;
  }

  getPlanById(planId: string): Plan | null {
    return this.plans.find(plan => plan.id === planId) || null;
  }

  async handleWebhook(eventType: string, data: any): Promise<boolean> {
    console.log(`Mock webhook received: ${eventType}`, data);

    switch (eventType) {
      case 'checkout.session.completed':
        return this.completePayment(data.session_id);
      case 'payment_intent.payment_failed':
        return this.failPayment(data.session_id);
      default:
        console.log(`Unhandled webhook event: ${eventType}`);
        return true;
    }
  }
}

export const stripeMockService = new StripeMockService();
