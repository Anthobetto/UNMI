/**
 * PricingCalculator - Dynamic B2B SaaS Pricing Engine
 * Implements SOLID principles:
 * - SRP: Only calculates pricing
 * - OCP: Extensible for new plan types
 * - DIP: Depends on abstractions (interfaces)
 */
/**
 * B2B SaaS Pricing Tiers
 * Optimized for conversion and upselling
 */
export const PRICING_TIERS = [
    {
        id: 'starter',
        name: 'Starter',
        basePrice: 60,
        messageRate: 0.15, // €0.15 per message
        dailyMessageCap: 10,
        minMessages: 1,
        features: [
            'Up to 10 daily WhatsApp messages',
            '1 location included',
            'Basic call routing',
            'Email support',
            'Basic analytics',
        ],
        locationMultiplier: 1.0, // No discount
    },
    {
        id: 'professional',
        name: 'Professional',
        basePrice: 120,
        messageRate: 0.10, // €0.10 per message (33% cheaper)
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
        locationMultiplier: 0.85, // 15% discount per additional location
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        basePrice: 250,
        messageRate: 0.05, // €0.05 per message (67% cheaper)
        dailyMessageCap: 60,
        minMessages: 1,
        features: [
            'Up to 60 daily WhatsApp messages',
            'Unlimited locations',
            'Custom routing rules',
            '24/7 phone support',
            'Custom analytics dashboard',
            'Dedicated account manager',
            'API access',
        ],
        locationMultiplier: 0.70, // 30% discount per additional location
    },
];
export class PricingCalculator {
    /**
     * Calculate monthly price for a given configuration
     * @param tierId - Selected pricing tier
     * @param dailyMessages - Number of daily messages (within tier cap)
     * @param locations - Number of physical locations
     * @returns Complete pricing breakdown
     */
    calculateMonthly(tierId, dailyMessages, locations = 1) {
        const tier = PRICING_TIERS.find(t => t.id === tierId);
        if (!tier) {
            throw new Error(`Invalid tier ID: ${tierId}`);
        }
        // Validate inputs
        if (dailyMessages < tier.minMessages) {
            dailyMessages = tier.minMessages;
        }
        if (dailyMessages > tier.dailyMessageCap) {
            dailyMessages = tier.dailyMessageCap;
        }
        if (locations < 1) {
            locations = 1;
        }
        // Base calculations
        const basePrice = tier.basePrice;
        const monthlyMessages = dailyMessages * 30; // 30 days average
        const messagesCost = monthlyMessages * tier.messageRate;
        // Location-based pricing
        let locationMultiplier = 1.0;
        if (locations > 1) {
            // Apply discount for multiple locations
            const additionalLocations = locations - 1;
            locationMultiplier = 1 + (additionalLocations * tier.locationMultiplier);
        }
        const subtotal = (basePrice + messagesCost) * locationMultiplier;
        const locationDiscount = (basePrice + messagesCost) * locations - subtotal;
        const totalMonthly = subtotal;
        const totalYearly = totalMonthly * 12 * 0.90; // 10% annual discount
        return {
            tier,
            dailyMessages,
            locations,
            basePrice,
            messagesCost,
            locationDiscount,
            totalMonthly: Math.round(totalMonthly * 100) / 100,
            totalYearly: Math.round(totalYearly * 100) / 100,
        };
    }
    /**
     * Get recommended tier based on usage
     */
    recommendTier(dailyMessages, locations) {
        if (dailyMessages <= 10 && locations <= 1) {
            return PRICING_TIERS[0]; // Starter
        }
        if (dailyMessages <= 30 && locations <= 5) {
            return PRICING_TIERS[1]; // Professional
        }
        return PRICING_TIERS[2]; // Enterprise
    }
    /**
     * Calculate savings compared to higher tier
     */
    calculateSavings(currentTierId, dailyMessages, locations) {
        const currentTier = this.calculateMonthly(currentTierId, dailyMessages, locations);
        const higherTierId = currentTierId === 'starter' ? 'professional' : 'enterprise';
        const higherTier = this.calculateMonthly(higherTierId, dailyMessages, locations);
        return higherTier.totalMonthly - currentTier.totalMonthly;
    }
    /**
     * Get all tiers with calculations for comparison
     */
    compareAllTiers(dailyMessages, locations) {
        return PRICING_TIERS.map(tier => this.calculateMonthly(tier.id, dailyMessages, locations));
    }
    /**
     * Calculate bundle discount for adding locations
     */
    calculateBundleDiscount(tierId, dailyMessages, currentLocations, additionalLocations) {
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
// Singleton instance
export const pricingCalculator = new PricingCalculator();
