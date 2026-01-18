import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchJsonWithAuth } from '@/services/ApiService';
import type { CallMetrics, RevenueMetrics } from '@/types';

interface CallStats {
  total: number;
  missed: number;
  answered: number;
  averageDuration: number;
  todayCallsCount: number;
  yesterdayCallsCount: number;
}

interface MessageStats {
  total: number;
  revenue: number;
}

interface DateRange {
  start: Date;
  end: Date;
}

export function useCallMetrics(
  userId: string,
  dateRange?: DateRange
): UseQueryResult<CallMetrics> {
  return useQuery({
    queryKey: ['call-metrics', userId, dateRange],
    queryFn: async () => {
      const stats = await fetchJsonWithAuth<CallStats>('/api/calls/stats');

      const totalCalls = stats.todayCallsCount;
      const answeredCalls = stats.answered;
      const missedCalls = stats.missed;
      const recoveryRate =
        totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0;

      return {
        totalCalls,
        answeredCalls,
        missedCalls,
        recoveryRate,
        averageResponseTime: stats.averageDuration,
        peakHours: [],
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    enabled: !!userId,
  });
}

export function useRevenueMetrics(userId: string): UseQueryResult<RevenueMetrics> {
  return useQuery({
    queryKey: ['revenue-metrics', userId],
    queryFn: async () => {
      const messageStats =
        await fetchJsonWithAuth<MessageStats>('/api/messages/stats');

      const messagesSent = messageStats.total || 0;
      const conversionRate = 0.18;
      const averageOrderValue = 50;
      const potentialRevenue =
        messagesSent * averageOrderValue * conversionRate;

      return {
        totalRevenue: messageStats.revenue || 0,
        potentialRevenue,
        conversionRate,
        averageOrderValue,
        messagesSent,
        revenuePerMessage:
          messagesSent > 0 ? potentialRevenue / messagesSent : 0,
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    enabled: !!userId,
  });
}

export function useCombinedMetrics(userId: string, dateRange?: DateRange) {
  const callMetrics = useCallMetrics(userId, dateRange);
  const revenueMetrics = useRevenueMetrics(userId);

  return {
    callMetrics,
    revenueMetrics,
    isLoading: callMetrics.isLoading || revenueMetrics.isLoading,
    error: callMetrics.error || revenueMetrics.error,
    refetch: () => {
      callMetrics.refetch();
      revenueMetrics.refetch();
    },
  };
}

export function useRealtimeCallMetrics(userId: string) {
  return useQuery({
    queryKey: ['realtime-call-metrics', userId],
    queryFn: async () => {
      const stats = await fetchJsonWithAuth<CallStats>('/api/calls/stats');

      return {
        todayCalls: stats.todayCallsCount,
        missedCalls: stats.missed,
        answeredCalls: stats.answered,
        avgDuration: stats.averageDuration,
      };
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    enabled: !!userId,
  });
}

export function useComparativeMetrics(userId: string) {
  return useQuery({
    queryKey: ['comparative-metrics', userId],
    queryFn: async () => {
      const stats = await fetchJsonWithAuth<CallStats>('/api/calls/stats');

      const today = stats.todayCallsCount;
      const yesterday = stats.yesterdayCallsCount;
      const diff =
        yesterday === 0 ? 100 : ((today - yesterday) / yesterday) * 100;

      return {
        today,
        yesterday,
        percentageChange: diff,
        isPositive: diff >= 0,
        displayPercent: Math.abs(diff).toFixed(0),
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}
