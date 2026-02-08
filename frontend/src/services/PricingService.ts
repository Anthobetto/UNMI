export type PlanType = 'small' | 'pro';

export interface PricingTier {
  id: PlanType;
  name: string;
  basePrice: number;
  
  // Mensajería
  includedMessages: number; 
  maxMessages: number;   
  
  // Infraestructura
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
  dailyMessages: number;
  locations: number;
  departments: number;
  
  basePrice: number;
  locationsCost: number;
  departmentsCost: number;
  
  totalMonthly: number;
  totalYearly: number;
}

/**
 * B2B SaaS Pricing Tiers
 * Updated to match Business Logic: Small (60€) vs Pro (120€)
 */
export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'small',
    name: 'Pequeña Empresa',
    basePrice: 60,
    includedMessages: 5,   
    maxMessages: 5,       
    
    includedLocations: 1,
    extraLocationPrice: 0, // No permite extras
    maxLocations: 1,
    
    includedDepartments: 1,
    extraDepartmentPrice: 0, // No permite extras
    maxDepartments: 1,

    features: [
      '150 mensajes WhatsApp/mes',
      '1 Localización incluida',
      '1 Departamento incluido',
      'Soporte por Email',
      'Analítica Básica',
    ],
  },
  {
    id: 'pro',
    name: 'UNMI Pro',
    basePrice: 120,
    includedMessages: 12, 
    maxMessages: 100,     
    
    includedLocations: 1,
    extraLocationPrice: 30,
    maxLocations: 20,
    
    includedDepartments: 1,
    extraDepartmentPrice: 15, 
    maxDepartments: 10,

    features: [
      '360 mensajes WhatsApp/mes',
      'Multi-localización (+30€/ud)',
      'Multi-departamento (+15€/ud)',
      'Enrutamiento Avanzado',
      'Soporte Prioritario',
      'Dashboard Multi-sede',
    ],
    popular: true,
  },
];

export class PricingCalculator {

  calculateMonthly(
    tierId: PlanType,
    dailyMessages: number, 
    locations: number = 1,
    departments: number = 1
  ): PricingCalculation {
    const tier = PRICING_TIERS.find(t => t.id === tierId);
    if (!tier) {
      throw new Error(`Invalid tier ID: ${tierId}`);
    }

    const validLocations = Math.max(1, Math.min(locations, tier.maxLocations));
    const validDepartments = Math.max(1, Math.min(departments, tier.maxDepartments));

    const basePrice = tier.basePrice;

    const extraLocationsCount = Math.max(0, validLocations - tier.includedLocations);
    const locationsCost = extraLocationsCount * tier.extraLocationPrice;

    const extraDepartmentsCount = Math.max(0, validDepartments - tier.includedDepartments);
    const departmentsCost = extraDepartmentsCount * tier.extraDepartmentPrice;

    const totalMonthly = basePrice + locationsCost + departmentsCost;
    const totalYearly = totalMonthly * 12 * 0.90; 

    return {
      tier,
      dailyMessages: tier.includedMessages,
      locations: validLocations,
      departments: validDepartments,
      basePrice,
      locationsCost,
      departmentsCost,
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      totalYearly: Math.round(totalYearly * 100) / 100,
    };
  }

  calculatePrice(tierId: PlanType, dailyMessages: number, locations: number, departments: number = 1) {
    return this.calculateMonthly(tierId, dailyMessages, locations, departments);
  }

  /**
   * Recomienda un plan basado en las necesidades del usuario
   */
  recommendTier(locations: number, departments: number): PricingTier {
    if (locations > 1 || departments > 1) {
      return PRICING_TIERS[1]; // Pro
    }
    return PRICING_TIERS[0]; // Small
  }

  compareAllTiers(locations: number, departments: number): PricingCalculation[] {
    return PRICING_TIERS.map(tier => 
      this.calculateMonthly(tier.id, tier.includedMessages, locations, departments)
    );
  }
}

export const pricingService = new PricingCalculator();