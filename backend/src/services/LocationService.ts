/**
 * LocationService - Multi-location management for B2B SaaS
 * Handles CRUD operations for physical stores and virtual numbers
 * Implements SOLID principles for scalability
 */

export interface Location {
  id: number;
  userId: string;
  name: string;
  address: string;
  phone: string | null;
  virtualNumbers: string[];
  timezone: string;
  businessHours: Record<string, { open: string; close: string }>;
  isActive: boolean;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLocationInput {
  userId: string;
  name: string;
  address: string;
  phone?: string;
  timezone?: string;
  businessHours?: Record<string, { open: string; close: string }>;
  isPrimary?: boolean;
}

export interface UpdateLocationInput {
  name?: string;
  address?: string;
  phone?: string;
  timezone?: string;
  businessHours?: Record<string, { open: string; close: string }>;
  isActive?: boolean;
}

export interface VirtualNumber {
  id: number;
  locationId: number;
  number: string;
  provider: string; // 'twilio' | 'vonage' | 'bandwidth' | 'custom'
  isActive: boolean;
  createdAt: Date;
}

export interface LocationMetrics {
  locationId: number;
  totalCalls: number;
  missedCalls: number;
  recoveredCalls: number;
  messagesSent: number;
  conversionRate: number;
  revenue: number;
}

export class LocationService {
  /**
   * Get all locations for a user
   */
  async getUserLocations(userId: string): Promise<Location[]> {
    // In production: query Supabase
    // For now, return mock data structure
    return [];
  }

  /**
   * Get location by ID
   */
  async getLocationById(locationId: number): Promise<Location | null> {
    // In production: query Supabase
    return null;
  }

  /**
   * Create new location
   */
  async createLocation(input: CreateLocationInput): Promise<Location> {
    // In production: insert to Supabase
    // Check if this is first location → set isPrimary = true
    // Generate default business hours if not provided
    
    const location: Location = {
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
  async updateLocation(locationId: number, input: UpdateLocationInput): Promise<Location> {
    // In production: update in Supabase
    throw new Error('Not implemented');
  }

  /**
   * Delete location
   */
  async deleteLocation(locationId: number): Promise<void> {
    // In production: soft delete in Supabase
    // Cannot delete primary location
    // Reassign virtual numbers to another location
  }

  /**
   * Assign virtual number to location
   */
  async assignVirtualNumber(locationId: number, phoneNumber: string, provider: string): Promise<VirtualNumber> {
    // In production: insert to virtual_numbers table
    const virtualNumber: VirtualNumber = {
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
  async getLocationVirtualNumbers(locationId: number): Promise<VirtualNumber[]> {
    // In production: query from virtual_numbers table
    return [];
  }

  /**
   * Get metrics for a specific location
   */
  async getLocationMetrics(locationId: number, dateFrom: Date, dateTo: Date): Promise<LocationMetrics> {
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
  async getUserAggregatedMetrics(userId: string, dateFrom: Date, dateTo: Date): Promise<{
    total: LocationMetrics;
    byLocation: Map<number, LocationMetrics>;
  }> {
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
  calculateBundleDiscount(currentLocations: number, additionalLocations: number): {
    discount: number;
    percentSaved: number;
  } {
    // Volume discount tiers
    const totalLocations = currentLocations + additionalLocations;
    let discountPercent = 0;

    if (totalLocations >= 10) discountPercent = 30;
    else if (totalLocations >= 5) discountPercent = 20;
    else if (totalLocations >= 3) discountPercent = 15;
    else if (totalLocations >= 2) discountPercent = 10;

    return {
      discount: discountPercent,
      percentSaved: discountPercent,
    };
  }

  /**
   * Get recommended bundle size based on usage
   */
  recommendBundleSize(avgDailyCalls: number): {
    recommendedLocations: number;
    reasoning: string;
  } {
    if (avgDailyCalls < 10) {
      return {
        recommendedLocations: 1,
        reasoning: 'Your current call volume fits a single location',
      };
    } else if (avgDailyCalls < 50) {
      return {
        recommendedLocations: 3,
        reasoning: 'Add 2 more locations for 15% discount',
      };
    } else {
      return {
        recommendedLocations: 5,
        reasoning: 'Add 4 more locations for 20% discount',
      };
    }
  }

  /**
   * Get default business hours (9 AM - 6 PM, Mon-Fri)
   */
  private getDefaultBusinessHours(): Record<string, { open: string; close: string }> {
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

