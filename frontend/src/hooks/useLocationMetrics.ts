/**
 * useLocationMetrics - Aggregated Metrics Hook
 * 
 * Provides metrics with:
 * - Total sum across all locations
 * - Per-location breakdowns
 * - Virtual number-specific metrics
 * - Time-based filtering
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export interface LocationMetric {
  locationId: number;
  locationName: string;
  virtualNumber?: string;
  totalCalls: number;
  missedCalls: number;
  answeredCalls: number;
  messagesS sent: number;
  messagesSentWhatsApp: number;
  messagesSentSMS: number;
  recoveryRate: number; // Percentage of missed calls recovered
  avgResponseTime: number; // Minutes
  revenueRecovered: number; // Estimated revenue
}

export interface AggregatedMetrics {
  total: {
    totalCalls: number;
    missedCalls: number;
    answeredCalls: number;
    messagesSent: number;
    messagesWhatsApp: number;
    messagesSMS: number;
    avgRecoveryRate: number;
    avgResponseTime: number;
    totalRevenue: number;
  };
  byLocation: LocationMetric[];
  byVirtualNumber: Map<string, LocationMetric>;
}

interface UseLocationMetricsOptions {
  userId?: string;
  locationId?: number | null; // null = all locations
  timeRange?: '7d' | '30d' | '90d' | 'all';
  enabled?: boolean;
}

export const useLocationMetrics = (options: UseLocationMetricsOptions = {}) => {
  const { userId, locationId = null, timeRange = '30d', enabled = true } = options;

  // Fetch locations
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['/api/locations', userId],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/locations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      return data.locations || [];
    },
    enabled: enabled && !!userId,
  });

  // Fetch calls
  const { data: calls = [], isLoading: callsLoading } = useQuery({
    queryKey: ['/api/calls', userId, timeRange],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const url = new URL('/api/calls', window.location.origin);
      if (timeRange !== 'all') {
        url.searchParams.set('range', timeRange);
      }
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch calls');
      const data = await response.json();
      return data.calls || [];
    },
    enabled: enabled && !!userId,
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/messages', userId, timeRange],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const url = new URL('/api/messages', window.location.origin);
      if (timeRange !== 'all') {
        url.searchParams.set('range', timeRange);
      }
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      return data.messages || [];
    },
    enabled: enabled && !!userId,
  });

  // Calculate aggregated metrics
  const metrics: AggregatedMetrics = useMemo(() => {
    if (!locations.length) {
      return {
        total: {
          totalCalls: 0,
          missedCalls: 0,
          answeredCalls: 0,
          messagesSent: 0,
          messagesWhatsApp: 0,
          messagesSMS: 0,
          avgRecoveryRate: 0,
          avgResponseTime: 0,
          totalRevenue: 0,
        },
        byLocation: [],
        byVirtualNumber: new Map(),
      };
    }

    // Filter calls by location if specified
    const filteredCalls = locationId 
      ? calls.filter((call: any) => call.locationId === locationId)
      : calls;

    const filteredMessages = locationId
      ? messages.filter((msg: any) => msg.locationId === locationId)
      : messages;

    // Calculate per-location metrics
    const byLocation: LocationMetric[] = locations.map((location: any) => {
      const locationCalls = filteredCalls.filter((call: any) => call.locationId === location.id);
      const locationMessages = filteredMessages.filter((msg: any) => msg.locationId === location.id);

      const totalCalls = locationCalls.length;
      const missedCalls = locationCalls.filter((call: any) => call.status === 'missed').length;
      const answeredCalls = locationCalls.filter((call: any) => call.status === 'answered').length;

      const messagesSent = locationMessages.length;
      const messagesWhatsApp = locationMessages.filter((msg: any) => msg.type === 'WhatsApp').length;
      const messagesSMS = locationMessages.filter((msg: any) => msg.type === 'SMS').length;

      // Calculate recovery rate (messages sent / missed calls)
      const recoveryRate = missedCalls > 0 ? (messagesSent / missedCalls) * 100 : 0;

      // Calculate average response time (mock: random between 2-10 minutes)
      const avgResponseTime = locationMessages.length > 0 
        ? locationMessages.reduce((acc: number, msg: any) => {
            const callTime = locationCalls.find((c: any) => c.id === msg.callId)?.timestamp;
            if (!callTime) return acc + 5; // Default 5 min
            const diff = new Date(msg.sentAt).getTime() - new Date(callTime).getTime();
            return acc + (diff / 60000); // Convert to minutes
          }, 0) / locationMessages.length
        : 0;

      // Estimate revenue recovered (€20 per recovered call)
      const revenueRecovered = messagesSent * 20;

      return {
        locationId: location.id,
        locationName: location.name,
        virtualNumber: location.virtualNumber || undefined,
        totalCalls,
        missedCalls,
        answeredCalls,
        messagesSent,
        messagesSentWhatsApp: messagesWhatsApp,
        messagesSentSMS: messagesSMS,
        recoveryRate: parseFloat(recoveryRate.toFixed(2)),
        avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
        revenueRecovered,
      };
    });

    // Calculate totals
    const total = byLocation.reduce((acc, loc) => ({
      totalCalls: acc.totalCalls + loc.totalCalls,
      missedCalls: acc.missedCalls + loc.missedCalls,
      answeredCalls: acc.answeredCalls + loc.answeredCalls,
      messagesSent: acc.messagesSent + loc.messagesSent,
      messagesWhatsApp: acc.messagesWhatsApp + loc.messagesSentWhatsApp,
      messagesSMS: acc.messagesSMS + loc.messagesSentSMS,
      avgRecoveryRate: acc.avgRecoveryRate + loc.recoveryRate,
      avgResponseTime: acc.avgResponseTime + loc.avgResponseTime,
      totalRevenue: acc.totalRevenue + loc.revenueRecovered,
    }), {
      totalCalls: 0,
      missedCalls: 0,
      answeredCalls: 0,
      messagesSent: 0,
      messagesWhatsApp: 0,
      messagesSMS: 0,
      avgRecoveryRate: 0,
      avgResponseTime: 0,
      totalRevenue: 0,
    });

    // Average the rates and times
    if (byLocation.length > 0) {
      total.avgRecoveryRate = parseFloat((total.avgRecoveryRate / byLocation.length).toFixed(2));
      total.avgResponseTime = parseFloat((total.avgResponseTime / byLocation.length).toFixed(2));
    }

    // Create virtual number map
    const byVirtualNumber = new Map<string, LocationMetric>();
    byLocation.forEach(loc => {
      if (loc.virtualNumber) {
        byVirtualNumber.set(loc.virtualNumber, loc);
      }
    });

    return {
      total,
      byLocation,
      byVirtualNumber,
    };
  }, [locations, calls, messages, locationId]);

  return {
    metrics,
    locations,
    isLoading: locationsLoading || callsLoading || messagesLoading,
    error: null, // Add error handling if needed
  };
};

/**
 * Mock data generator for development/testing
 */
export const generateMockLocationMetrics = (locationCount: number = 3): AggregatedMetrics => {
  const byLocation: LocationMetric[] = Array.from({ length: locationCount }, (_, i) => {
    const totalCalls = Math.floor(Math.random() * 200) + 50;
    const missedCalls = Math.floor(totalCalls * (Math.random() * 0.4 + 0.1)); // 10-50% missed
    const answeredCalls = totalCalls - missedCalls;
    const messagesSent = Math.floor(missedCalls * (Math.random() * 0.8 + 0.2)); // 20-100% recovered
    const messagesWhatsApp = Math.floor(messagesSent * 0.7);
    const messagesSMS = messagesSent - messagesWhatsApp;
    const recoveryRate = (messagesSent / missedCalls) * 100;

    return {
      locationId: i + 1,
      locationName: `Tienda ${['Centro', 'Norte', 'Sur', 'Este', 'Oeste'][i]}`,
      virtualNumber: `+3461${String(i + 1).padStart(7, '0')}`,
      totalCalls,
      missedCalls,
      answeredCalls,
      messagesSent,
      messagesSentWhatsApp: messagesWhatsApp,
      messagesSentSMS: messagesSMS,
      recoveryRate: parseFloat(recoveryRate.toFixed(2)),
      avgResponseTime: parseFloat((Math.random() * 8 + 2).toFixed(2)),
      revenueRecovered: messagesSent * 20,
    };
  });

  const total = byLocation.reduce((acc, loc) => ({
    totalCalls: acc.totalCalls + loc.totalCalls,
    missedCalls: acc.missedCalls + loc.missedCalls,
    answeredCalls: acc.answeredCalls + loc.answeredCalls,
    messagesSent: acc.messagesSent + loc.messagesSent,
    messagesWhatsApp: acc.messagesWhatsApp + loc.messagesSentWhatsApp,
    messagesSMS: acc.messagesSMS + loc.messagesSentSMS,
    avgRecoveryRate: acc.avgRecoveryRate + loc.recoveryRate,
    avgResponseTime: acc.avgResponseTime + loc.avgResponseTime,
    totalRevenue: acc.totalRevenue + loc.revenueRecovered,
  }), {
    totalCalls: 0,
    missedCalls: 0,
    answeredCalls: 0,
    messagesSent: 0,
    messagesWhatsApp: 0,
    messagesSMS: 0,
    avgRecoveryRate: 0,
    avgResponseTime: 0,
    totalRevenue: 0,
  });

  total.avgRecoveryRate = parseFloat((total.avgRecoveryRate / byLocation.length).toFixed(2));
  total.avgResponseTime = parseFloat((total.avgResponseTime / byLocation.length).toFixed(2));

  const byVirtualNumber = new Map<string, LocationMetric>();
  byLocation.forEach(loc => {
    if (loc.virtualNumber) {
      byVirtualNumber.set(loc.virtualNumber, loc);
    }
  });

  return {
    total,
    byLocation,
    byVirtualNumber,
  };
};

