import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { cn } from "@/utils/cn";
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Phone,
  PhoneMissed,
  PhoneIncoming,
  TrendingUp,
  TrendingDown,
  MapPin,
  Clock,
  BarChart3,
  Download,
  Filter,
  ChevronRight,
  Activity,
  History
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'wouter';

const COLORS = {
  answered: '#003366',
  missed: '#FF0000',
};

interface CallStats {
  total: number;
  missed: number;
  answered: number;
  averageDuration: number;
  todayCallsCount: number;
  yesterdayCallsCount: number;
}

interface Call {
  id: number;
  callerNumber: string;
  status: string;
  duration: number;
  createdAt: string;
  routedToLocation?: number;
}

interface Location {
  id: number;
  name: string;
  address?: string;
}

export default function Telefonia() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('30');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  // Queries
  const { data: callStats } = useQuery<CallStats>({
    queryKey: ['/api/calls/stats'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/calls/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch call stats');
      return response.json();
    },
    enabled: !!user,
  });

  const { data: calls = [] } = useQuery<Call[]>({
    queryKey: ['/api/calls'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/calls', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch calls');
      const data = await response.json();
      return data.calls || [];
    },
    enabled: !!user,
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/locations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      return data.locations || [];
    },
    enabled: !!user,
  });

  // Cálculos
  const todayCalls = callStats?.todayCallsCount ?? 0;
  const yesterdayCalls = callStats?.yesterdayCallsCount ?? 0;
  const callDiff =
    yesterdayCalls === 0 ? 100 : ((todayCalls - yesterdayCalls) / yesterdayCalls) * 100;
  const isCallsPositive = callDiff >= 0;

  const totalCalls = callStats?.total ?? 0;
  const answeredCalls = callStats?.answered ?? 0;
  const missedCalls = callStats?.missed ?? 0;
  const answerRate = totalCalls > 0 ? ((answeredCalls / totalCalls) * 100).toFixed(1) : '0';
  const missedRate = totalCalls > 0 ? ((missedCalls / totalCalls) * 100).toFixed(1) : '0';

  // Datos para gráfico de tendencia diaria
  const dailyData = Array.from({ length: parseInt(dateRange) }, (_, i) => {
    const date = startOfDay(subDays(new Date(), parseInt(dateRange) - i - 1));
    return {
      date: format(date, 'dd/MM', { locale: es }),
      total: 15 + Math.floor(Math.random() * 10) + (i * 0.5),
      answered: 10 + Math.floor(Math.random() * 5),
      missed: 5 + Math.floor(Math.random() * 5),
    };
  });

  const locationStats = locations.map((location) => {
    const locCalls = calls.filter((call) => call.routedToLocation === location.id);
    const locMissed = locCalls.filter((call) => call.status === 'missed').length;
    return {
      location: location.name,
      missed: locMissed,
      total: locCalls.length,
      missedPercentage: locCalls.length > 0 ? (locMissed / locCalls.length) * 100 : 0,
    };
  }).sort((a, b) => b.missed - a.missed);

  const filteredCalls = selectedLocation === 'all'
    ? calls
    : calls.filter((call) => call.routedToLocation?.toString() === selectedLocation);

  return (
    <>
      <Helmet>
        <title>{t('telephony.title')} - UNMI</title>
      </Helmet>

      <div className="flex flex-col gap-y-8 pb-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
              <Phone className="h-6 w-6 text-[#003366]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {t('telephony.title')}
              </h2>
              <p className="text-sm font-medium text-slate-400">Analítica detallada de llamadas</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px] rounded-2xl bg-white border-none shadow-sm h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t('telephony.filters.last7days')}</SelectItem>
                <SelectItem value="30">{t('telephony.filters.last30days')}</SelectItem>
                <SelectItem value="90">{t('telephony.filters.last90days')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="rounded-2xl border-none bg-white shadow-sm h-12 px-6 font-bold text-[#003366]">
              <Download className="h-4 w-4 mr-2" /> {t('telephony.actions.export')}
            </Button>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-[2.5rem] border-none bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Activity className="h-6 w-6 text-[#003366]" />
              </div>
              <span className={cn("text-xs font-bold px-2 py-1 rounded-full", isCallsPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-red-600")}>
                {callDiff.toFixed(0)}%
              </span>
            </div>
            <h4 className="text-4xl font-black text-slate-900 mb-1">{todayCalls}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('telephony.metrics.callsToday')}</p>
          </Card>

          <Card className="rounded-[2.5rem] border-none bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <PhoneIncoming className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">{answerRate}%</span>
            </div>
            <h4 className="text-4xl font-black text-slate-900 mb-1">{answeredCalls}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('telephony.metrics.answered')}</p>
          </Card>

          <Card className="rounded-[2.5rem] border-none bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                <PhoneMissed className="h-6 w-6 text-red-600" />
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-rose-50 text-red-600">{missedRate}%</span>
            </div>
            <h4 className="text-4xl font-black text-slate-900 mb-1">{missedCalls}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('telephony.metrics.missed')}</p>
          </Card>

          <Card className="rounded-[2.5rem] border-none bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <h4 className="text-4xl font-black text-slate-900 mb-1">
              {callStats?.averageDuration ? Math.floor(callStats.averageDuration / 60) : 0}m
            </h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('telephony.metrics.avgDuration')}</p>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-12 lg:col-span-8 rounded-[2.5rem] border-none bg-white p-10 shadow-sm">
            <h4 className="text-lg font-bold text-slate-900 mb-8">{t('telephony.charts.trend')}</h4>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" />
                  <Line type="monotone" dataKey="total" stroke="#003366" strokeWidth={4} dot={{ r: 4, fill: '#003366' }} name={t('telephony.metrics.total')} />
                  <Line type="monotone" dataKey="answered" stroke="#10B981" strokeWidth={4} dot={{ r: 4, fill: '#10B981' }} name={t('telephony.metrics.answered')} />
                  <Line type="monotone" dataKey="missed" stroke="#EF4444" strokeWidth={4} dot={{ r: 4, fill: '#EF4444' }} name={t('telephony.metrics.missed')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="col-span-12 lg:col-span-4 rounded-[2.5rem] border-none bg-white p-10 shadow-sm">
            <h4 className="text-lg font-bold text-slate-900 mb-8">{t('telephony.performance.title')}</h4>
            <div className="space-y-6">
              {locationStats.slice(0, 5).map((stat, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">{stat.location}</span>
                    <span className="font-black text-[#003366]">{stat.missed} perdidas</span>
                  </div>
                  <div className="w-full bg-slate-50 rounded-full h-3 overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-1000", stat.missedPercentage > 30 ? 'bg-rose-500' : 'bg-[#003366]')}
                      style={{ width: `${Math.min(stat.missedPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* History Table */}
        <Card className="rounded-[2.5rem] border-none bg-white p-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <History className="h-5 w-5 text-[#003366]" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">{t('telephony.history.title')}</h4>
            </div>
            
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[220px] rounded-2xl bg-slate-50 border-none h-12 px-6 font-bold">
                <SelectValue placeholder={t('telephony.filters.allLocations')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('telephony.filters.allLocations')}</SelectItem>
                {locations.map((loc) => <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('telephony.history.number')}</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('telephony.history.status')}</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('telephony.history.duration')}</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('telephony.history.location')}</th>
                  <th className="pb-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('telephony.history.datetime')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCalls.slice(0, 20).map((call) => (
                  <tr key={call.id} className="group">
                    <td className="py-4 font-bold text-slate-900">{call.callerNumber}</td>
                    <td className="py-4">
                      <span className={cn("inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase", call.status === 'missed' ? "bg-rose-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
                        {call.status === 'missed' ? t('telephony.metrics.missed') : t('telephony.metrics.answered')}
                      </span>
                    </td>
                    <td className="py-4 text-sm font-medium text-slate-500">
                      {call.duration > 0 ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '-'}
                    </td>
                    <td className="py-4 text-sm font-bold text-slate-700">
                      {locations.find(l => l.id === call.routedToLocation)?.name || '-'}
                    </td>
                    <td className="py-4 text-right text-sm font-medium text-slate-400">
                      {format(new Date(call.createdAt), 'dd MMM, HH:mm', { locale: es })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
