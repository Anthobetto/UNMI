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

  // Calculations
  const todayCalls = callStats?.todayCallsCount ?? 0;
  const yesterdayCalls = callStats?.yesterdayCallsCount ?? 0;
  const callDiff = yesterdayCalls === 0 ? 100 : ((todayCalls - yesterdayCalls) / yesterdayCalls) * 100;
  const isCallsPositive = callDiff >= 0;

  const totalMessages = messageStats?.sent ?? 0;
  const missedCalls = callStats?.missed ?? 0;
  const recoveredCalls = Math.floor(missedCalls * (Number(conversionRate) / 100));
  const expectedRevenue = recoveredCalls * Number(averageTicket);

  const pieData = [
    { name: t('dashboard.charts.answered'), value: callStats?.answered ?? 0 },
    { name: t('dashboard.charts.missed'), value: callStats?.missed ?? 0 },
  ];

  const missedCallRate = callStats?.total
    ? ((callStats.missed / callStats.total) * 100).toFixed(1)
    : '0';

  return (
    <>
      <Helmet>
        <title>{t('dashboard.title')} - UNMI</title>
        <meta name="description" content={t('dashboard.description')} />
      </Helmet>

      <div className="p-6 space-y-6 mt-12">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
            <p className="text-gray-600 mt-1">
              {t('dashboard.welcome', { username: user?.username || t('dashboard.welcome', { username: 'Usuario' }) })}
            </p>
          </div>

          <div>
            <LanguageSelector />
          </div>
        </div>

        {/* Plan Alert */}
        {user?.planType && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {t('dashboard.plan.active', { plan: user.planType === 'templates' ? t('dashboard.plan.templates') : t('dashboard.plan.chatbots') })}
            </AlertTitle>
            <AlertDescription>
              {t('dashboard.plan.access', { access: user.planType === 'templates' ? t('dashboard.plan.templates') : t('dashboard.plan.chatbots') })}{' '}
              <Link href="/plan">
                <a className="underline font-medium">{t('dashboard.plan.change')}</a>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Calls Today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.metrics.callsToday')}</CardTitle>
              <PhoneCall className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loadingCalls ? (
                <div className="h-8 bg-gray-200 animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{todayCalls}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    {isCallsPositive ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">+{Math.abs(callDiff).toFixed(0)}%</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3 text-red-600" />
                        <span className="text-red-600">-{Math.abs(callDiff).toFixed(0)}%</span>
                      </>
                    )}
                    {t('dashboard.metrics.vsYesterday')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Missed Calls */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.metrics.missedCalls')}</CardTitle>
              <Phone className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              {loadingCalls ? (
                <div className="h-8 bg-gray-200 animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-red-600">{missedCalls}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('dashboard.metrics.missedRate', { rate: missedCallRate })}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Messages Sent */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.metrics.messagesSent')}</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {loadingMessages ? (
                <div className="h-8 bg-gray-200 animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalMessages}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('dashboard.metrics.delivered', { count: messageStats?.delivered ?? 0 })}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Expected Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.metrics.expectedRevenue')}</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                €{expectedRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('dashboard.metrics.recoveredCalls', { count: recoveredCalls })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Calculator */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Call Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.charts.callDistribution')}</CardTitle>
              <CardDescription>
                {t('dashboard.charts.totalCalls', { count: callStats?.total ?? 0 })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCalls ? (
                <div className="h-[300px] bg-gray-200 animate-pulse rounded" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? COLORS.answered : COLORS.missed}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="flex justify-around mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">{t('dashboard.charts.answered', { count: callStats?.answered ?? 0 })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">{t('dashboard.charts.missed', { count: callStats?.missed ?? 0 })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {t('dashboard.calculator.title')}
              </CardTitle>
              <CardDescription>
                {t('dashboard.calculator.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="averageTicket">{t('dashboard.calculator.averageTicket')}</Label>
                <Input
                  id="averageTicket"
                  type="number"
                  value={averageTicket}
                  onChange={(e) => setAverageTicket(e.target.value)}
                  placeholder="50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conversionRate">{t('dashboard.calculator.conversionRate')}</Label>
                <Input
                  id="conversionRate"
                  type="number"
                  value={conversionRate}
                  onChange={(e) => setConversionRate(e.target.value)}
                  placeholder="30"
                  max="100"
                />
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('dashboard.calculator.missedCalls')}</span>
                    <span className="font-medium">{missedCalls}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('dashboard.calculator.recoveredCalls', { rate: conversionRate })}</span>
                    <span className="font-medium">{recoveredCalls}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>{t('dashboard.calculator.estimatedRevenue')}</span>
                    <span className="text-green-600">€{expectedRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-800">
                  {t('dashboard.calculator.tip')}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Recent Calls Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentCalls.title')}</CardTitle>
            <CardDescription>{t('dashboard.recentCalls.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentCalls.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{t('dashboard.recentCalls.noCalls')}</p>
                <p className="text-sm mt-1">{t('dashboard.recentCalls.info')}</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/locations">
                    <MapPin className="h-4 w-4 mr-2" />
                    {t('dashboard.recentCalls.configureLocations')}
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dashboard.recentCalls.table.number')}</TableHead>
                    <TableHead>{t('dashboard.recentCalls.table.status')}</TableHead>
                    <TableHead>{t('dashboard.recentCalls.table.duration')}</TableHead>
                    <TableHead>{t('dashboard.recentCalls.table.location')}</TableHead>
                    <TableHead>{t('dashboard.recentCalls.table.time')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCalls.map((call) => {
                    const location = locations.find(l => l.id === call.routedToLocation);
                    return (
                      <TableRow key={call.id}>
                        <TableCell className="font-medium">{call.callerNumber}</TableCell>
                        <TableCell>
                          <Badge variant={call.status === 'missed' ? 'destructive' : 'default'}>
                            {call.status === 'missed'
                              ? t('dashboard.recentCalls.table.missed')
                              : t('dashboard.recentCalls.table.answered')}
                          </Badge>
                        </TableCell>
                        <TableCell>{call.duration > 0 ? `${call.duration}s` : '-'}</TableCell>
                        <TableCell>{location?.name || 'N/A'}</TableCell>
                        <TableCell className="text-gray-500">
                          {new Date(call.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Locations */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/locations" className="block">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.quickActions.locations')}</CardTitle>
                <MapPin className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{locations.length}</div>
                <p className="text-xs text-muted-foreground">{t('dashboard.quickActions.manageLocations')}</p>
              </CardContent>
            </Link>
          </Card>

          {/* Templates */}
          {hasAccessToSection('templates') && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/templates" className="block">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.quickActions.templates')}</CardTitle>
                  <FileText className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.quickActions.manageTemplates')}</p>
                </CardContent>
              </Link>
            </Card>
          )}

          {/* Your Plan */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/plan" className="block">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.quickActions.yourPlan')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium capitalize">{user?.planType || 'Basic'}</div>
                <p className="text-xs text-muted-foreground">{t('dashboard.quickActions.upgradePlan')}</p>
              </CardContent>
            </Link>
          </Card>
        </div>

      </div>
    </>
  );
}
