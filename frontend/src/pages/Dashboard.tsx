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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PhoneCall,
  TrendingUp,
  TrendingDown,
  MapPin,
  FileText,
  Phone,
  Activity,
  ChevronRight,
  PieChart as PieIcon,
  Calculator as CalcIcon
} from 'lucide-react';
import { Link } from 'wouter';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { usePlanStats } from '@/hooks/usePlans';

const COLORS = {
  answered: '#003366', // UNMI Blue
  missed: '#FF0000',   // UNMI Red
};

interface CallStats {
  total: number;
  missed: number;
  answered: number;
  averageDuration: number;
  todayCallsCount: number;
  yesterdayCallsCount: number;
}

interface Location {
  id: number;
  name: string;
  address?: string;
}

interface Call {
  id: number;
  callerNumber: string;
  status: string;
  duration: number;
  createdAt: string;
  routedToLocation?: number;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [averageTicket, setAverageTicket] = useState('50');
  const [conversionRate, setConversionRate] = useState('30');

  // Queries
  const fetchHeaders = { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };

  const { data: callStats } = useQuery<CallStats>({
    queryKey: ['/api/calls/stats'],
    queryFn: () => fetch('/api/calls/stats', { headers: fetchHeaders }).then(r => r.json()),
    enabled: !!user,
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
    queryFn: () => fetch('/api/locations', { headers: fetchHeaders }).then(r => r.json().then(d => d.locations || [])),
    enabled: !!user,
  });

  const { data: recentCalls = [] } = useQuery<Call[]>({
    queryKey: ['/api/calls'],
    queryFn: () => fetch('/api/calls', { headers: fetchHeaders }).then(r => r.json().then(d => d.calls?.slice(0, 5) || [])),
    enabled: !!user,
  });

  // Consumo del Plan
  const phoneCount = locations.length;
  const messagesUsedToday = callStats?.todayCallsCount ?? 0;
  const { data: stats } = usePlanStats(user?.planType || 'small', messagesUsedToday, phoneCount);

  // Cálculos de métricas
  const todayCalls = callStats?.todayCallsCount ?? 0;
  const yesterdayCalls = callStats?.yesterdayCallsCount ?? 0;
  const callDiff = yesterdayCalls === 0 ? 100 : ((todayCalls - yesterdayCalls) / yesterdayCalls) * 100;
  const isCallsPositive = callDiff >= 0;

  const missedCalls = callStats?.missed ?? 0;
  const recoveredCalls = Math.floor(missedCalls * (Number(conversionRate) / 100));
  const expectedRevenue = recoveredCalls * Number(averageTicket);

  const pieData = [
    { name: t('dashboard.charts.answered', { count: callStats?.answered ?? 0 }), value: callStats?.answered ?? 0 },
    { name: t('dashboard.charts.missed', { count: callStats?.missed ?? 0 }), value: callStats?.missed ?? 0 },
  ];

  const missedCallRate = callStats?.total ? ((missedCalls / callStats.total) * 100).toFixed(1) : '0';

  return (
    <>
      <Helmet>
        <title>{t('dashboard.title')} - UNMI</title>
      </Helmet>

      <div className="flex flex-col gap-y-8">
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
            <Activity className="h-6 w-6 text-[#003366]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {t('dashboard.title')}
            </h2>
            <p className="text-sm font-medium text-slate-400">
              {t('dashboard.welcome', { username: user?.username || 'Usuario' })}
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-[2.5rem] border-none bg-white p-8 shadow-sm transition-hover hover:shadow-md">
            <div className="flex items-start justify-between mb-6">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <PhoneCall className="h-6 w-6 text-[#003366]" />
              </div>
              <span className={cn("text-xs font-bold px-2 py-1 rounded-full", isCallsPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-red-600")}>
                {isCallsPositive ? '+' : ''}{callDiff.toFixed(0)}%
              </span>
            </div>
            <h4 className="text-4xl font-black text-slate-900 mb-1">{todayCalls}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('dashboard.metrics.callsToday')}</p>
          </Card>

          <Card className="rounded-[2.5rem] border-none bg-white p-8 shadow-sm transition-hover hover:shadow-md">
            <div className="flex items-start justify-between mb-6">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                <Phone className="h-6 w-6 text-red-600" />
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-rose-50 text-red-600">
                {missedCallRate}%
              </span>
            </div>
            <h4 className="text-4xl font-black text-slate-900 mb-1">{missedCalls}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('dashboard.metrics.missedCalls')}</p>
          </Card>

          <Card className="rounded-[2.5rem] border-none bg-white p-8 shadow-sm transition-hover hover:shadow-md">
            <div className="flex items-start justify-between mb-6">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600">
                {Math.min(stats?.usagePercentage || 0, 100)}%
              </span>
            </div>
            <h4 className="text-4xl font-black text-slate-900 mb-1">{messagesUsedToday}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('dashboard.plan.dailyUsage')}</p>
          </Card>

          <Card className="rounded-[2.5rem] border-none bg-white p-8 shadow-sm transition-hover hover:shadow-md">
            <div className="flex items-start justify-between mb-6">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <h4 className="text-4xl font-black text-slate-900 mb-1">{phoneCount}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('dashboard.metrics.activeLines')}</p>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-12 lg:col-span-8 rounded-[2.5rem] border-none bg-white p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <PieIcon className="h-5 w-5 text-[#003366]" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 leading-tight">
                  {t('dashboard.charts.callDistribution')}
                </h4>
                <p className="text-xs font-medium text-slate-400">Distribución de asistencia</p>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={80} 
                    outerRadius={110} 
                    paddingAngle={5} 
                    cornerRadius={10}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.answered : COLORS.missed} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Recent Calls List */}
        <Card className="rounded-[2.5rem] border-none bg-white p-10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <Phone className="h-5 w-5 text-[#003366]" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 leading-tight">
                  {t('dashboard.recentCalls.title')}
                </h4>
                <p className="text-xs font-medium text-slate-400">Últimas interacciones</p>
              </div>
            </div>
            <Link href="/telefonia" className="text-sm font-bold text-[#003366] hover:underline flex items-center gap-1">
              Ver todo <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentCalls.map((call) => (
              <div key={call.id} className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 transition-hover hover:bg-slate-100">
                <div className="flex items-center gap-4">
                  <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center", call.status === 'missed' ? "bg-rose-100 text-red-600" : "bg-emerald-100 text-emerald-600")}>
                    {call.status === 'missed' ? <PhoneMissed className="h-5 w-5" /> : <PhoneIncoming className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{call.callerNumber}</p>
                    <p className="text-xs font-medium text-slate-400">
                      {locations.find(l => l.id === call.routedToLocation)?.name || t('dashboard.table.general')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {call.status === 'missed' ? t('dashboard.recentCalls.table.missed') : t('dashboard.recentCalls.table.answered')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 pb-10">
          <Link href="/locations">
            <Card className="rounded-[2rem] border-none bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer flex items-center gap-4 group">
              <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-colors group-hover:bg-[#003366] group-hover:text-white">
                <MapPin className="h-7 w-7" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{t('dashboard.quickActions.locations')}</h4>
                <p className="text-xs font-medium text-slate-400">{t('dashboard.quickActions.manageLocations')}</p>
              </div>
            </Card>
          </Link>

          <Link href="/templates">
            <Card className="rounded-[2rem] border-none bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer flex items-center gap-4 group">
              <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 transition-colors group-hover:bg-[#003366] group-hover:text-white">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{t('dashboard.quickActions.templates')}</h4>
                <p className="text-xs font-medium text-slate-400">{t('dashboard.quickActions.manageTemplates')}</p>
              </div>
            </Card>
          </Link>

          <Link href="/plan">
            <Card className="rounded-[2rem] border-none bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer flex items-center gap-4 group">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-[#003366] group-hover:text-white">
                <TrendingUp className="h-7 w-7" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{t('dashboard.quickActions.yourPlan')}</h4>
                <p className="text-xs font-medium text-slate-400">{t('dashboard.quickActions.upgradePlan')}</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </>
  );
}

function PhoneIncoming(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 2 22 8 16 14" />
      <line x1="2" y1="22" x2="22" y2="2" />
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.7 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function PhoneMissed(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="23" y1="1" x2="17" y2="7" />
      <line x1="17" y1="1" x2="23" y2="7" />
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.7 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
