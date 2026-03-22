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
  const displayPlanName = user?.planType ? t(`plan.${user.planType}.title`) : t('plan.small.title');

  return (
    <>
      <Helmet>
        <title>{t('dashboard.title')} - UNMI</title>
        <meta name="description" content={t('dashboard.description')} />
      </Helmet>

      <div className="space-y-6 mt-1 pb-10">
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
          <Card className="rounded-2xl shadow-sm border-none bg-white">
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

          <Card className="rounded-2xl shadow-sm border-none bg-white">
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

          <Card className="rounded-2xl shadow-sm border-none bg-blue-50/20 border-blue-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.plan.dailyUsage')}</CardTitle>
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
                <span>{t('dashboard.plan.limit')}</span>
                {(stats?.usagePercentage || 0) > 80 && <span className="text-red-500 animate-pulse font-black">{t('dashboard.plan.upgradeNow')}</span>}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm border-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.metrics.activeLines')}</CardTitle>
              <MapPin className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{phoneCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {phoneCount === 1 
                  ? t('dashboard.metrics.managing', { count: phoneCount }) 
                  : t('dashboard.metrics.managing_plural', { count: phoneCount })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Calculator */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl shadow-sm border-none">
            <CardHeader>
              <CardTitle>{t('dashboard.charts.callDistribution')}</CardTitle>
              <CardDescription>{t('dashboard.charts.totalCalls', { count: callStats?.total ?? 0 })}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.answered : COLORS.missed} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />{t('dashboard.calculator.title')}</CardTitle>
              <CardDescription>{t('dashboard.calculator.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-gray-400">{t('dashboard.calculator.averageTicket')}</Label>
                  <Input type="number" value={averageTicket} onChange={(e) => setAverageTicket(e.target.value)} className="h-10 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-gray-400">{t('dashboard.calculator.conversionRate')}</Label>
                  <Input type="number" value={conversionRate} onChange={(e) => setConversionRate(e.target.value)} className="h-10 rounded-xl" />
                </div>
              </div>
              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between text-lg font-black text-green-600">
                  <span>{t('dashboard.metrics.recoverableRevenue')}</span>
                  <span>€{expectedRevenue.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Llamadas */}
        <Card className="rounded-2xl shadow-sm border-none overflow-hidden">
          <CardHeader>
            <CardTitle>{t('dashboard.recentCalls.title')}</CardTitle>
            <CardDescription>{t('dashboard.recentCalls.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentCalls.length === 0 ? (
              <div className="text-center py-10 text-gray-400"><p>{t('dashboard.recentCalls.noCalls')}</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dashboard.recentCalls.table.number')}</TableHead>
                    <TableHead>{t('dashboard.recentCalls.table.status')}</TableHead>
                    <TableHead>{t('dashboard.recentCalls.table.location')}</TableHead>
                    <TableHead className="text-right">{t('dashboard.recentCalls.table.time')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCalls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">{call.callerNumber}</TableCell>
                      <TableCell>
                        <Badge variant={call.status === 'missed' ? 'destructive' : 'default'}>
                          {call.status === 'missed' ? t('dashboard.recentCalls.table.missed') : t('dashboard.recentCalls.table.answered')}
                        </Badge>
                      </TableCell>
                      <TableCell>{locations.find(l => l.id === call.routedToLocation)?.name || t('dashboard.table.general')}</TableCell>
                      <TableCell className="text-right text-gray-400">
                        {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* ✅ QUICK ACTIONS GRID (RESTAURADO) */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Tarjeta Establecimientos */}
          <Link href="/locations">
            <Card className="hover:shadow-md transition-all cursor-pointer group rounded-2xl border-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold group-hover:text-[#FF0000] transition-colors">
                  {t('dashboard.quickActions.locations')}
                </CardTitle>
                <MapPin className="h-4 w-4 text-gray-400 group-hover:text-[#FF0000]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{locations.length}</div>
                <p className="text-xs text-muted-foreground">{t('dashboard.quickActions.manageLocations')}</p>
              </CardContent>
            </Card>
          </Link>

          {/* Tarjeta Templates */}
          {hasAccessToSection('templates') && (
            <Link href="/templates">
              <Card className="hover:shadow-md transition-all cursor-pointer group rounded-2xl border-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold group-hover:text-[#FF0000] transition-colors">
                    {t('dashboard.quickActions.templates')}
                  </CardTitle>
                  <FileText className="h-4 w-4 text-gray-400 group-hover:text-[#FF0000]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.quickActions.manageTemplates')}</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Tarjeta Plan */}
          <Link href="/plan">
            <Card className="hover:shadow-md transition-all cursor-pointer group rounded-2xl border-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold group-hover:text-[#FF0000] transition-colors">
                  {t('dashboard.quickActions.yourPlan')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-400 group-hover:text-[#FF0000]" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold capitalize text-gray-700">
                  {displayPlanName}
                </div>
                <p className="text-xs text-muted-foreground">{t('dashboard.quickActions.upgradePlan')}</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </>
  );
}