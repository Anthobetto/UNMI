// Custom Hook para gestión de planes y suscripciones
// Implementa SRP - Solo operaciones de planes

import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { stripeMockService } from '@/services/StripeMockService';
import type { Plan, PlanSelectionForm, StripeSession } from '@/types';

// Hook para obtener todos los planes
export function usePlans(planType?: 'templates' | 'chatbots'): UseQueryResult<Plan[]> {
  return useQuery({
    queryKey: ['plans', planType],
    queryFn: () => stripeMockService.getPlans(planType),
    staleTime: 10 * 60 * 1000, // 10 minutes - planes no cambian frecuentemente
  });
}

// Hook para obtener un plan específico por ID
export function usePlan(planId: string): UseQueryResult<Plan | null> {
  return useQuery({
    queryKey: ['plan', planId],
    queryFn: () => stripeMockService.getPlanById(planId),
    staleTime: 10 * 60 * 1000,
    enabled: !!planId,
  });
}

// Hook para crear sesión de checkout de Stripe
export function useCreateCheckoutSession(): UseMutationResult<StripeSession, Error, PlanSelectionForm> {
  return useMutation({
    mutationFn: async (formData: PlanSelectionForm) => {
      return await stripeMockService.createCheckoutSession(formData);
    },
    onSuccess: (session) => {
      console.log('Checkout session created:', session.id);
      // En producción, redirigir a session.url
    },
    onError: (error) => {
      console.error('Error creating checkout session:', error);
    },
  });
}

// Hook para verificar estado de una sesión
export function useSessionStatus(sessionId: string | null): UseQueryResult<StripeSession | null> {
  return useQuery({
    queryKey: ['session-status', sessionId],
    queryFn: () => {
      if (!sessionId) return null;
      return stripeMockService.getSessionStatus(sessionId);
    },
    enabled: !!sessionId,
    refetchInterval: (data) => {
      // Refetch cada 2 segundos si la sesión está pendiente
      if (data?.status === 'pending') {
        return 2000;
      }
      return false;
    },
  });
}

// Hook para calcular costo de mensajes extra
export function useCalculateExtraCost(planId: string, extraMessages: number) {
  return useQuery({
    queryKey: ['extra-cost', planId, extraMessages],
    queryFn: () => stripeMockService.calculateExtraMessageCost(planId, extraMessages),
    staleTime: Infinity, // El cálculo es determinista
    enabled: !!planId && extraMessages > 0,
  });
}

// Hook combinado con todas las acciones de planes
export function usePlanActions() {
  const createCheckoutSession = useCreateCheckoutSession();

  const getPlanById = (planId: string): Plan | null => {
    return stripeMockService.getPlanById(planId);
  };

  const calculateExtraCost = (planId: string, extraMessages: number): number => {
    return stripeMockService.calculateExtraMessageCost(planId, extraMessages);
  };

  const compareElans = (plan1Id: string, plan2Id: string) => {
    const plan1 = stripeMockService.getPlanById(plan1Id);
    const plan2 = stripeMockService.getPlanById(plan2Id);
    
    if (!plan1 || !plan2) return null;

    return {
      priceDifference: plan2.price - plan1.price,
      messageLimitDifference: plan2.messageLimit - plan1.messageLimit,
      featuresDifference: {
        plan1Only: plan1.features.filter(f => !plan2.features.includes(f)),
        plan2Only: plan2.features.filter(f => !plan1.features.includes(f)),
        common: plan1.features.filter(f => plan2.features.includes(f)),
      },
    };
  };

  return {
    createCheckoutSession,
    getPlanById,
    calculateExtraCost,
    comparePlans: compareElans,
  };
}

// Hook para obtener el plan recomendado basado en uso
export function useRecommendedPlan(
  currentPlanId: string,
  messagesUsed: number,
  messageLimit: number
): UseQueryResult<Plan | null> {
  return useQuery({
    queryKey: ['recommended-plan', currentPlanId, messagesUsed, messageLimit],
    queryFn: () => {
      const currentPlan = stripeMockService.getPlanById(currentPlanId);
      if (!currentPlan) return null;

      const usagePercentage = (messagesUsed / messageLimit) * 100;

      // Si usa más del 80%, recomendar upgrade
      if (usagePercentage > 80) {
        const allPlans = stripeMockService.getPlans(currentPlan.type);
        const higherPlans = allPlans.filter(
          p => p.messageLimit > currentPlan.messageLimit
        );
        
        // Retornar el siguiente plan más alto
        return higherPlans.sort((a, b) => a.messageLimit - b.messageLimit)[0] || null;
      }

      // Si usa menos del 30%, recomendar downgrade
      if (usagePercentage < 30) {
        const allPlans = stripeMockService.getPlans(currentPlan.type);
        const lowerPlans = allPlans.filter(
          p => p.messageLimit < currentPlan.messageLimit && p.messageLimit > messagesUsed
        );
        
        // Retornar el siguiente plan más bajo que aún cubre el uso
        return lowerPlans.sort((a, b) => b.messageLimit - a.messageLimit)[0] || null;
      }

      // Plan actual es óptimo
      return null;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!currentPlanId,
  });
}

// Hook para obtener estadísticas del plan actual
export function usePlanStats(planId: string, messagesUsed: number) {
  return useQuery({
    queryKey: ['plan-stats', planId, messagesUsed],
    queryFn: () => {
      const plan = stripeMockService.getPlanById(planId);
      if (!plan) return null;

      const usagePercentage = (messagesUsed / plan.messageLimit) * 100;
      const remaining = plan.messageLimit - messagesUsed;
      const overLimit = messagesUsed > plan.messageLimit;
      const extraMessages = overLimit ? messagesUsed - plan.messageLimit : 0;
      const extraCost = stripeMockService.calculateExtraMessageCost(planId, extraMessages);

      return {
        plan,
        messagesUsed,
        remaining,
        usagePercentage,
        overLimit,
        extraMessages,
        extraCost,
        totalCost: plan.price + extraCost,
      };
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!planId,
  });
}




