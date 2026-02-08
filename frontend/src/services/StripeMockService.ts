// src/services/StripeMockService.ts
// Stripe Mock Service - OCP (Open-Closed Principle)

import { Plan, PlanSelectionForm, StripeSession } from '@/types';

export interface IPaymentService {
  getPlans(planType?: 'small' | 'pro'): Plan[];
  createCheckoutSession(formData: PlanSelectionForm): Promise<StripeSession>;
  getSessionStatus(sessionId: string): StripeSession | null;
  calculateExtraMessageCost(planId: string, extraMessages: number): number;
}

export class StripeMockService implements IPaymentService {
  private sessions: Map<string, StripeSession> = new Map();
  
  // ✅ Datos actualizados a la nueva lógica 'small' | 'pro'
  private plans: Plan[] = [
    {
      id: 'price_small_monthly',
      name: 'Small Bussiness',
      type: 'small',
      price: 60,
      features: ['1 Sede', '1 Departamento', '150 Mensajes'],
      messageLimit: 150,
      extraMessagePrice: 0.15,
    },
    {
      id: 'price_pro_monthly',
      name: 'UNMI Pro',
      type: 'pro',
      price: 120,
      features: ['Multi-Sede', 'Multi-Departamento', 'IA Avanzada'],
      messageLimit: 360,
      extraMessagePrice: 0.10,
      popular: true,
    }
  ];

  public addPlan(plan: Plan): void {
    this.plans.push(plan);
  }

  getPlans(planType?: 'small' | 'pro'): Plan[] {
    if (planType) {
      return this.plans.filter(plan => plan.type === planType);
    }
    return this.plans;
  }

  async createCheckoutSession(formData: PlanSelectionForm): Promise<StripeSession> {
    // ✅ Búsqueda robusta: Intentamos por ID, y si no, por TIPO
    let plan = this.plans.find(p => p.id === formData.planId);
    
    if (!plan) {
      // Fallback: buscar por tipo si el ID no coincide
      plan = this.plans.find(p => p.type === formData.planType);
    }

    if (!plan) {
      console.warn("Plan no encontrado para:", formData);
      // Fallback de seguridad para no romper la app
      plan = this.plans[0];
    }

    const sessionId = `cs_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: StripeSession = {
      id: sessionId,
      url: `https://checkout.stripe.com/mock/${sessionId}?plan=${plan.type}`,
      planType: plan.type, // Asegura que sea 'small' | 'pro'
      amount: plan.price,
      status: 'pending',
    };

    this.sessions.set(sessionId, session);

    // Simulamos que el pago se completa a los 2 segundos
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

  // ✅ Webhook simulado para pruebas locales
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