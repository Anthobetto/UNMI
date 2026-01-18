/**
 * PricingService - Frontend wrapper for dynamic pricing
 * Mirrors backend PricingCalculator for client-side previews
 */

export interface PricingTier {
  id: 'templetes' | 'chatbots';
  name: string;
  basePrice: number;
  messageRate: number;
  dailyMessageCap: number;
  minMessages: number;
  features: string[];
  locationMultiplier: number;
  popular?: boolean;
}

export interface PricingCalculation {
  tier: PricingTier;
  dailyMessages: number;
  locations: number;
  basePrice: number;
  messagesCost: number;
  locationDiscount: number;
  totalMonthly: number;
  totalYearly: number;
  savingsVsHigherTier?: number;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'templetes',
    name: 'templetes',
    basePrice: 60,
    messageRate: 0.15,
    dailyMessageCap: 10,
    minMessages: 1,
    features: [
      'Up to 10 daily WhatsApp messages',
      '1 location included',
      'Basic call routing',
      'Email support',
      'Basic analytics',
    ],
    locationMultiplier: 1.0,
  },
  {
    id: 'chatbots',
    name: 'chatbots',
    basePrice: 120,
    messageRate: 0.10,
    dailyMessageCap: 30,
    minMessages: 1,
    features: [
      'Up to 30 daily WhatsApp messages',
      'Up to 5 locations',
      'Advanced call routing',
      'Priority support',
      'Advanced analytics',
      'Multi-location dashboard',
    ],
    locationMultiplier: 0.85,
    popular: true,
  }
];

export class PricingService {
  calculateMonthly(
    tierId: 'templetes' | 'chatbots',
    dailyMessages: number,
    locations: number = 1
  ): PricingCalculation {
    const tier = PRICING_TIERS.find(t => t.id === tierId);
    if (!tier) throw new Error(`Invalid tier ID: ${tierId}`);

    dailyMessages = Math.max(tier.minMessages, Math.min(dailyMessages, tier.dailyMessageCap));
    locations = Math.max(1, locations);

    const basePrice = tier.basePrice;
    const monthlyMessages = dailyMessages * 30;
    const messagesCost = monthlyMessages * tier.messageRate;

    let locationMultiplier = 1.0;
    if (locations > 1) locationMultiplier = 1 + ((locations - 1) * tier.locationMultiplier);

    const subtotal = (basePrice + messagesCost) * locationMultiplier;
    const locationDiscount = (basePrice + messagesCost) * locations - subtotal;
    const totalMonthly = subtotal;
    const totalYearly = totalMonthly * 12 * 0.9;

    return {
      tier,
      dailyMessages,
      locations,
      basePrice,
      messagesCost: Math.round(messagesCost * 100) / 100,
      locationDiscount: Math.round(locationDiscount * 100) / 100,
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      totalYearly: Math.round(totalYearly * 100) / 100,
    };
  }

  // Alias para que tu código siga usando "calculatePrice"
  calculatePrice(
    tierId: 'templetes' | 'chatbots',
    dailyMessages: number,
    locations: number = 1
  ) {
    return this.calculateMonthly(tierId, dailyMessages, locations);
  }

  recommendTier(dailyMessages: number, locations: number): PricingTier {
    if (dailyMessages <= 10 && locations <= 1) return PRICING_TIERS[0];
    if (dailyMessages <= 30 && locations <= 5) return PRICING_TIERS[1];
    return PRICING_TIERS[2];
  }

  compareAllTiers(dailyMessages: number, locations: number): PricingCalculation[] {
    return PRICING_TIERS.map(tier => this.calculateMonthly(tier.id, dailyMessages, locations));
  }

  calculateBundleDiscount(
    tierId: 'templetes' | 'chatbots',
    dailyMessages: number,
    currentLocations: number,
    additionalLocations: number
  ) {
    const current = this.calculateMonthly(tierId, dailyMessages, currentLocations);
    const withAdditional = this.calculateMonthly(tierId, dailyMessages, currentLocations + additionalLocations);

    const linearPrice = current.totalMonthly * (currentLocations + additionalLocations) / currentLocations;
    const discount = linearPrice - withAdditional.totalMonthly;
    const percentSaved = (discount / linearPrice) * 100;

    return {
      currentPrice: current.totalMonthly,
      newPrice: withAdditional.totalMonthly,
      discount: Math.round(discount * 100) / 100,
      percentSaved: Math.round(percentSaved * 10) / 10,
    };
  }
}

export const pricingService = new PricingService();
