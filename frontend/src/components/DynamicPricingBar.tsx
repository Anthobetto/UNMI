/**
 * PricingService - Frontend wrapper for dynamic pricing
 * Refleja la nueva lógica de negocio: Small vs Pro con extras.
 */

export type PlanType = 'small' | 'pro';

export interface PricingTier {
  id: PlanType;
  name: string;
  basePrice: number;      // Precio de entrada (ej: 60 o 120)
  includedMessages: number; // Mensajes diarios incluidos (ej: 5 o 12)
  maxMessages: number;    // Tope de mensajes diarios permitidos
  messageOverageRate: number; // Costo por mensaje extra (si aplica)
  
  // Límites y Costos de Infraestructura
  includedLocations: number;
  extraLocationPrice: number;
  maxLocations: number;
  
  includedDepartments: number;
  extraDepartmentPrice: number;
  maxDepartments: number;

  features: string[];
  popular?: boolean;
}

export interface PricingCalculation {
  tier: PricingTier;
  // Entradas
  dailyMessages: number;
  locations: number;
  departments: number;
  
  // Desglose de Costos
  basePrice: number;
  locationsCost: number;
  departmentsCost: number;
  messagesCost: number;
  
  // Totales
  totalMonthly: number;
  totalYearly: number; // Asumiendo un descuento anual habitual del 10-20%
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'small',
    name: 'Pequeña Empresa',
    basePrice: 60,
    includedMessages: 5,   // 150 al mes / 30 días
    maxMessages: 5,        // Tope fijo (no escalable en este plan)
    messageOverageRate: 0, 
    
    includedLocations: 1,
    extraLocationPrice: 0, // No permite extras
    maxLocations: 1,
    
    includedDepartments: 1,
    extraDepartmentPrice: 0, // No permite extras
    maxDepartments: 1,

    features: [
      '150 mensajes/mes (5 diarios)',
      '1 Localización',
      '1 Departamento',
      'Soporte por Email',
      'Analítica Básica',
    ],
  },
  {
    id: 'pro',
    name: 'UNMI Pro',
    basePrice: 120,
    includedMessages: 12,  // 360 al mes / 30 días
    maxMessages: 100,      // Escalable hasta 100 diarios (ejemplo)
    messageOverageRate: 0.15, // Precio por mensaje extra diario (opcional)

    includedLocations: 1,
    extraLocationPrice: 30, // 30€ por cada local extra
    maxLocations: 20,
    
    includedDepartments: 1,
    extraDepartmentPrice: 15, // 15€ por cada depto extra
    maxDepartments: 10,

    features: [
      '360 mensajes/mes base (12 diarios)',
      'Multi-localización',
      'Multi-departamento',
      'Enrutamiento Inteligente',
      'Soporte Prioritario',
      'Dashboard Avanzado',
    ],
    popular: true,
  }
];

export class PricingService {
  
  /**
   * Calcula el precio mensual total basado en la configuración del usuario.
   */
  calculateMonthly(
    tierId: PlanType,
    dailyMessages: number,
    locations: number = 1,
    departments: number = 1
  ): PricingCalculation {
    const tier = PRICING_TIERS.find(t => t.id === tierId);
    if (!tier) throw new Error(`Invalid tier ID: ${tierId}`);

    // Asegurar límites (Clamping)
    const validLocations = Math.max(1, Math.min(locations, tier.maxLocations));
    const validDepartments = Math.max(1, Math.min(departments, tier.maxDepartments));
    const validMessages = Math.max(tier.includedMessages, Math.min(dailyMessages, tier.maxMessages));

    // 1. Costo Base
    const basePrice = tier.basePrice;

    // 2. Costo de Localizaciones Extra
    // (Total locales - incluidos) * precio extra. Si es negativo, es 0.
    const extraLocs = Math.max(0, validLocations - tier.includedLocations);
    const locationsCost = extraLocs * tier.extraLocationPrice;

    // 3. Costo de Departamentos Extra
    const extraDepts = Math.max(0, validDepartments - tier.includedDepartments);
    const departmentsCost = extraDepts * tier.extraDepartmentPrice;

    // 4. Costo de Mensajes Extra (Upsell dinámico)
    // Si el usuario selecciona más mensajes de los incluidos en el base
    const extraMsgs = Math.max(0, validMessages - tier.includedMessages);
    // Costo mensual de los mensajes extra (ej: 5 extras * 30 días * 0.15€)
    const messagesCost = extraMsgs * 30 * tier.messageOverageRate;

    const totalMonthly = basePrice + locationsCost + departmentsCost + messagesCost;
    const totalYearly = totalMonthly * 12 * 0.9; // 10% descuento anual

    return {
      tier,
      dailyMessages: validMessages,
      locations: validLocations,
      departments: validDepartments,
      basePrice,
      locationsCost,
      departmentsCost,
      messagesCost,
      totalMonthly,
      totalYearly
    };
  }

  // Alias para compatibilidad con código existente si lo hubiera
  calculatePrice(tierId: PlanType, dailyMessages: number, locations: number, departments: number) {
    return this.calculateMonthly(tierId, dailyMessages, locations, departments);
  }

  /**
   * Genera una comparación de todos los planes para una configuración dada
   */
  compareAllTiers(dailyMessages: number, locations: number, departments: number): PricingCalculation[] {
    return PRICING_TIERS.map(tier => {
      // Si el plan no soporta la cantidad solicitada (ej: Small con 2 locales), 
      // forzamos el cálculo a sus límites máximos para mostrar la diferencia
      return this.calculateMonthly(tier.id, dailyMessages, locations, departments);
    });
  }

  /**
   * Obtiene el ID del precio de Stripe (Price ID) basado en el plan.
   * Útil para pasarlo al backend o a Paywall.app
   */
  getStripePriceId(plan: PlanType): string {
    // Estos IDs deberían venir de tus variables de entorno o constantes
    // Aquí es un ejemplo de mapeo
    const map = {
      'small': 'price_small_biz_xv123',
      'pro': 'price_pro_biz_yz456'
    };
    return map[plan];
  }
}

export const pricingService = new PricingService();