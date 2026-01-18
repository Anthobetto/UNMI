/**
 * LocationService - Multi-location management for B2B SaaS
 * Handles CRUD operations for physical stores and virtual numbers
 * Implements SOLID principles for scalability
 */
export class LocationService {
    /**
     * Get all locations for a user
     */
    async getUserLocations(userId) {
        // In production: query Supabase
        // For now, return mock data structure
        return [];
    }
    /**
     * Get location by ID
     */
    async getLocationById(locationId) {
        // In production: query Supabase
        return null;
    }
    /**
     * Create new location
     */
    async createLocation(input) {
        // In production: insert to Supabase
        // Check if this is first location → set isPrimary = true
        // Generate default business hours if not provided
        const location = {
            id: Date.now(), // Mock ID
            userId: input.userId,
            name: input.name,
            address: input.address,
            phone: input.phone || null,
            virtualNumbers: [],
            timezone: input.timezone || 'Europe/Madrid',
            businessHours: input.businessHours || this.getDefaultBusinessHours(),
            isActive: true,
            isPrimary: input.isPrimary || false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return location;
    }
    /**
     * Update existing location
     */
    async updateLocation(locationId, input) {
        // In production: update in Supabase
        throw new Error('Not implemented');
    }
    /**
     * Delete location
     */
    async deleteLocation(locationId) {
        // In production: soft delete in Supabase
        // Cannot delete primary location
        // Reassign virtual numbers to another location
    }
    /**
     * Assign virtual number to location
     */
    async assignVirtualNumber(locationId, phoneNumber, provider) {
        // In production: insert to virtual_numbers table
        const virtualNumber = {
            id: Date.now(),
            locationId,
            number: phoneNumber,
            provider,
            isActive: true,
            createdAt: new Date(),
        };
        return virtualNumber;
    }
    /**
     * Get virtual numbers for location
     */
    async getLocationVirtualNumbers(locationId) {
        // In production: query from virtual_numbers table
        return [];
    }
    /**
     * Get metrics for a specific location
     */
    async getLocationMetrics(locationId, dateFrom, dateTo) {
        // In production: aggregate from calls/messages tables
        return {
            locationId,
            totalCalls: 0,
            missedCalls: 0,
            recoveredCalls: 0,
            messagesSent: 0,
            conversionRate: 0,
            revenue: 0,
        };
    }
    /**
     * Get aggregated metrics for all user locations
     */
    async getUserAggregatedMetrics(userId, dateFrom, dateTo) {
        // In production: aggregate across all locations
        return {
            total: {
                locationId: 0,
                totalCalls: 0,
                missedCalls: 0,
                recoveredCalls: 0,
                messagesSent: 0,
                conversionRate: 0,
                revenue: 0,
            },
            byLocation: new Map(),
        };
    }
    /**
     * Calculate bundle discount for adding locations
     */
    calculateBundleDiscount(currentLocations, additionalLocations) {
        // Volume discount tiers
        const totalLocations = currentLocations + additionalLocations;
        let discountPercent = 0;
        if (totalLocations >= 10)
            discountPercent = 30;
        else if (totalLocations >= 5)
            discountPercent = 20;
        else if (totalLocations >= 3)
            discountPercent = 15;
        else if (totalLocations >= 2)
            discountPercent = 10;
        return {
            discount: discountPercent,
            percentSaved: discountPercent,
        };
    }
    /**
     * Get recommended bundle size based on usage
     */
    recommendBundleSize(avgDailyCalls) {
        if (avgDailyCalls < 10) {
            return {
                recommendedLocations: 1,
                reasoning: 'Your current call volume fits a single location',
            };
        }
        else if (avgDailyCalls < 50) {
            return {
                recommendedLocations: 3,
                reasoning: 'Add 2 more locations for 15% discount',
            };
        }
        else {
            return {
                recommendedLocations: 5,
                reasoning: 'Add 4 more locations for 20% discount',
            };
        }
    }
    /**
     * Get default business hours (9 AM - 6 PM, Mon-Fri)
     */
    getDefaultBusinessHours() {
        return {
            monday: { open: '09:00', close: '18:00' },
            tuesday: { open: '09:00', close: '18:00' },
            wednesday: { open: '09:00', close: '18:00' },
            thursday: { open: '09:00', close: '18:00' },
            friday: { open: '09:00', close: '18:00' },
            saturday: { open: 'closed', close: 'closed' },
            sunday: { open: 'closed', close: 'closed' },
        };
    }
}
// Singleton instance
export const locationService = new LocationService();
