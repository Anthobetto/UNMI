export type PlanType = 'small' | 'pro';

export interface PricingTier {
  id: PlanType;
  name: string;
  basePrice: number;     
  includedMessages: number; 
  maxMessages: number;  
  messageOverageRate: number; 
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
  messagesCost: number;
  totalMonthly: number;
  totalYearly: number; 
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'small',
    name: 'Pequeña Empresa',
    basePrice: 60,
    includedMessages: 5,   
    maxMessages: 5,       
    messageOverageRate: 0, 
    includedLocations: 1,
    extraLocationPrice: 0,
    maxLocations: 1,
    includedDepartments: 1,
    extraDepartmentPrice: 0,
    maxDepartments: 1,
    features: ['150 mensajes/mes (5 diarios)', '1 Localización', '1 Departamento', 'Soporte por Email', 'Analítica Básica'],
  },
  {
    id: 'pro',
    name: 'UNMI Pro',
    basePrice: 120,
    includedMessages: 12, 
    maxMessages: 100,      
    messageOverageRate: 0.15, 
    includedLocations: 1,
    extraLocationPrice: 30,
    maxLocations: 20,
    includedDepartments: 1,
    extraDepartmentPrice: 15,
    maxDepartments: 10,
    features: ['360 mensajes/mes base (12 diarios)', 'Multi-localización', 'Multi-departamento', 'Enrutamiento Inteligente', 'Soporte Prioritario', 'Dashboard Avanzado'],
    popular: true,
  }
];

export class PricingService {

  public calculatePlan(tierId: PlanType, dailyMessages: number, phoneCount: number) {
    const basePriceMsg = 12;
    const discountFactor = 1 - Math.log10(dailyMessages || 1) / 10;
    const messagePrice = Math.round((dailyMessages || 5) * basePriceMsg * discountFactor);

    const pricePerPhone = 5;
    const phonePrice = (phoneCount || 1) * pricePerPhone;

    const totalMonthly = messagePrice + phonePrice;

    return {
      messagesPerDay: dailyMessages,
      messagePrice,
      phonePrice,
      totalMonthly,
      totalYearly: Math.round(totalMonthly * 12 * 0.8) // 20% ahorro anual
    };
  }
  
  calculateMonthly(
    tierId: PlanType,
    dailyMessages: number,
    locations: number = 1,
    departments: number = 1
  ): PricingCalculation {
    const tier = PRICING_TIERS.find(t => t.id === tierId);
    if (!tier) throw new Error(`Invalid tier ID: ${tierId}`);

    const validLocations = Math.max(1, Math.min(locations, tier.maxLocations));
    const validDepartments = Math.max(1, Math.min(departments, tier.maxDepartments));
    const validMessages = Math.max(tier.includedMessages, Math.min(dailyMessages, tier.maxMessages));

    const basePrice = tier.basePrice;
    const extraLocs = Math.max(0, validLocations - tier.includedLocations);
    const locationsCost = extraLocs * tier.extraLocationPrice;
    const extraDepts = Math.max(0, validDepartments - tier.includedDepartments);
    const departmentsCost = extraDepts * tier.extraDepartmentPrice;
    const extraMsgs = Math.max(0, validMessages - tier.includedMessages);
    const messagesCost = extraMsgs * 30 * tier.messageOverageRate;

    const totalMonthly = basePrice + locationsCost + departmentsCost + messagesCost;
    const totalYearly = totalMonthly * 12 * 0.9;

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

  calculatePrice(tierId: PlanType, dailyMessages: number, locations: number, departments: number) {
    return this.calculateMonthly(tierId, dailyMessages, locations, departments);
  }

  getStripePriceId(plan: PlanType): string {
    const map = {
      'small': process.env.VITE_STRIPE_PRICE_SMALL || 'price_small_dummy',
      'pro': process.env.VITE_STRIPE_PRICE_PRO || 'price_pro_dummy'
    };
    return map[plan] || '';
  }
}

export const pricingService = new PricingService();