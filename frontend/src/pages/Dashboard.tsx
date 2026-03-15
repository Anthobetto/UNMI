import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PhoneCall,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  MapPin,
  FileText,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from 'wouter';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { LanguageSelector } from '@/components/LanguageSelector';
import { usePlanStats } from '@/hooks/usePlans';

const COLORS = {
  answered: '#10b981',
  missed: '#ef4444',
};

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
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
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
  const { user, hasAccessToSection } = useAuth();
  const [averageTicket, setAverageTicket] = useState('50');
  const [conversionRate, setConversionRate] = useState('30');

  // Queries
  const { data: callStats, isLoading: loadingCalls } = useQuery<CallStats>({
    queryKey: ['/api/calls/stats'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/calls/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch call stats');
      return response.json();
    },
    enabled: !!user,
  });

  const { data: messageStats, isLoading: loadingMessages } = useQuery<MessageStats>({
    queryKey: ['/api/messages/stats'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/messages/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch message stats');
      return response.json();
    },
    enabled: !!user,
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/locations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      return data.locations || [];
    },
    enabled: !!user,
  });

  const { data: recentCalls = [] } = useQuery<Call[]>({
    queryKey: ['/api/calls'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/calls', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch calls');
      const data = await response.json();
      return data.calls?.slice(0, 5) || [];
    },
    enabled: !!user,
  });

  // Consumo del Plan
  const phoneCount = locations.length;
  const messagesUsedToday = callStats?.todayCallsCount ?? 0;
  const { data: stats } = usePlanStats(
    user?.planType || 'small',
    messagesUsedToday,
    phoneCount
  );

  // Cálculos de métricas
  const todayCalls = callStats?.todayCallsCount ?? 0;
  const yesterdayCalls = callStats?.yesterdayCallsCount ?? 0;
  const callDiff = yesterdayCalls === 0 ? 100 : ((todayCalls - yesterdayCalls) / yesterdayCalls) * 100;
  const isCallsPositive = callDiff >= 0;

  const missedCalls = callStats?.missed ?? 0;
  const recoveredCalls = Math.floor(missedCalls * (Number(conversionRate) / 100));
  const expectedRevenue = recoveredCalls * Number(averageTicket);

  const pieData = [
    { name: t('telephony.metrics.answered'), value: callStats?.answered ?? 0 },
    { name: t('telephony.metrics.missed'), value: callStats?.missed ?? 0 },
  ];

  const missedCallRate = callStats?.total
    ? ((callStats.missed / callStats.total) * 100).toFixed(1)
    : '0';

  const displayPlanName = user?.planType ? t(`plan.${user.planType}.title`) : 'Pequeña Empresa';

  return (
    <>
      <Helmet>
        <title>{t('dashboard.title')} - UNMI</title>
        <meta name="description" content={t('dashboard.description')} />
      </Helmet>

      <div className="space-y-4 mt-1">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
            <p className="text-gray-600 mt-1">
              {t('dashboard.welcome', { username: user?.username || 'Usuario' })}
            </p>
          </div>
          <LanguageSelector />
        </div>

        {/* Plan Alert */}
        {user?.planType && (
          <Alert className="bg-white/50 border-gray-200">
            <AlertCircle className="h-4 w-4 text-[#FF0000]" />
            <AlertTitle className="font-bold">
              {t('dashboard.plan.active', { plan: displayPlanName })}
            </AlertTitle>
          </Alert>
        )}

        {/* Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Calls Today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.metrics.callsToday')}</CardTitle>
              <PhoneCall className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayCalls}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {isCallsPositive ? <TrendingUp className="h-3 w-3 text-green-600" /> : <TrendingDown className="h-3 w-3 text-red-600" />}
                <span className={isCallsPositive ? "text-green-600" : "text-red-600"}>
                  {isCallsPositive ? '+' : ''}{callDiff.toFixed(0)}%
                </span>
                {t('dashboard.metrics.vsYesterday')}
              </p>
            </CardContent>
          </Card>

          {/* Missed Calls */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.metrics.missedCalls')}</CardTitle>
              <Phone className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{missedCalls}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('dashboard.metrics.missedRate', { rate: missedCallRate })}
              </p>
            </CardContent>
          </Card>

          {/* Plan Consumption Bar */}
          <Card className="border-blue-100 bg-blue-50/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Consumo Diario</CardTitle>
              <TrendingUp className={`h-4 w-4 ${(stats?.usagePercentage || 0) > 80 ? 'text-red-500' : 'text-blue-600'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messagesUsedToday} / {stats?.messagesPerDay || 5}</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${(stats?.usagePercentage || 0) > 90 ? 'bg-red-500' : (stats?.usagePercentage || 0) > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(stats?.usagePercentage || 0, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-2 uppercase font-bold tracking-widest flex justify-between">
                <span>Límite de mensajes</span>
                {(stats?.usagePercentage || 0) > 80 && <span className="text-red-500 animate-pulse font-black">Upgrade!</span>}
              </p>
            </CardContent>
          </Card>

          {/* Locations Active */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Líneas Activas</CardTitle>
              <MapPin className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{phoneCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Gestionando {phoneCount} sede{phoneCount !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Calculator */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.charts.callDistribution')}</CardTitle>
              <CardDescription>{t('dashboard.charts.totalCalls', { count: callStats?.total ?? 0 })}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.answered : COLORS.missed} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-around mt-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-sm">{t('telephony.metrics.answered')}</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-sm">{t('telephony.metrics.missed')}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />{t('dashboard.calculator.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-gray-400">Ticket Medio (€)</Label>
                  <Input type="number" value={averageTicket} onChange={(e) => setAverageTicket(e.target.value)} className="h-10 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-gray-400">Conv. (%)</Label>
                  <Input type="number" value={conversionRate} onChange={(e) => setConversionRate(e.target.value)} className="h-10 rounded-xl" />
                </div>
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm"><span>Llamadas perdidas</span><span className="font-bold">{missedCalls}</span></div>
                <div className="flex justify-between text-lg font-black text-green-600">
                  <span>Revenue Recuperable</span>
                  <span>€{expectedRevenue.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader><CardTitle>{t('dashboard.recentCalls.title')}</CardTitle></CardHeader>
          <CardContent>
            {recentCalls.length === 0 ? (
              <div className="text-center py-10 text-gray-400"><p>{t('dashboard.recentCalls.noCalls')}</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Localización</TableHead>
                    <TableHead>Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCalls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">{call.callerNumber}</TableCell>
                      <TableCell><Badge variant={call.status === 'missed' ? 'destructive' : 'default'}>{call.status}</Badge></TableCell>
                      <TableCell>{locations.find(l => l.id === call.routedToLocation)?.name || 'General'}</TableCell>
                      <TableCell className="text-gray-400">{new Date(call.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}