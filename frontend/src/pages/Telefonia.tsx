/**
 * Telefonía - Call Analytics Dashboard
 * Análisis detallado de llamadas, tasas de recuperación y distribución por ubicación
 */

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
import { LanguageSelector } from '@/components/LanguageSelector';

const COLORS = {
  answered: '#10b981',
  missed: '#ef4444',
  rejected: '#f59e0b',
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
  const { data: callStats, isLoading: loadingStats } = useQuery<CallStats>({
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

  const { data: calls = [], isLoading: loadingCalls } = useQuery<Call[]>({
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

  // Datos para gráfico de distribución
  const distributionData = [
    { name: t('telephony.metrics.answered'), value: answeredCalls },
    { name: t('telephony.metrics.missed'), value: missedCalls },
  ];

  // Datos para gráfico de tendencia diaria
  const dailyData = Array.from({ length: parseInt(dateRange) }, (_, i) => {
    const date = startOfDay(subDays(new Date(), parseInt(dateRange) - i - 1));
    const dayIndex = i;

    const baseCalls = 15 + Math.floor(Math.random() * 10);
    const trend = (dayIndex / parseInt(dateRange)) * 20;
    const totalDay = Math.floor(baseCalls + trend);
    const answeredDay = Math.floor(totalDay * 0.7);
    const missedDay = totalDay - answeredDay;

    return {
      date: format(date, 'dd/MM', { locale: es }),
      total: totalDay,
      answered: answeredDay,
      missed: missedDay,
    };
  });

  // Top establecimientos por llamadas perdidas
  const locationStats = locations
    .map((location) => {
      const locationCalls = calls.filter((call) => call.routedToLocation === location.id);
      const locationMissed = locationCalls.filter((call) => call.status === 'missed').length;
      const locationTotal = locationCalls.length;
      const missedPercentage =
        locationTotal > 0 ? ((locationMissed / locationTotal) * 100).toFixed(1) : '0';

      return {
        location: location.name,
        missed: locationMissed,
        total: locationTotal,
        missedPercentage: parseFloat(missedPercentage),
      };
    })
    .sort((a, b) => b.missed - a.missed);

  const filteredCalls =
    selectedLocation === 'all'
      ? calls
      : calls.filter((call) => call.routedToLocation?.toString() === selectedLocation);

  const handleExport = () => {
    alert(t('telephony.actions.exportAlert'));
  };

  return (
    <>
      <Helmet>
        <title>{t('telephony.title')} - UNMI</title>
        <meta name="description" content={t('telephony.subtitle')} />
      </Helmet>

      <div className="p-6 space-y-6 mt-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('telephony.title')}</h1>
            <p className="text-gray-600 mt-1">{t('telephony.subtitle')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t('telephony.filters.last7days')}</SelectItem>
                <SelectItem value="30">{t('telephony.filters.last30days')}</SelectItem>
                <SelectItem value="90">{t('telephony.filters.last90days')}</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExport} variant="outline" className="flex-shrink-0">
              <Download className="h-4 w-4 mr-2" />
              {t('telephony.actions.export')}
            </Button>

            <LanguageSelector />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          {/* Llamadas Hoy */}
          <Card className="min-w-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {t('telephony.metrics.callsToday')}
                </CardTitle>
                <Phone className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="h-8 bg-gray-200 animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{todayCalls}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    {isCallsPositive ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">
                          +{Math.abs(callDiff).toFixed(0)}% {t('telephony.metrics.vsYesterday')}
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3 text-red-600" />
                        <span className="text-red-600">
                          -{Math.abs(callDiff).toFixed(0)}% {t('telephony.metrics.vsYesterday')}
                        </span>
                      </>
                    )}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contestadas */}
          <Card className="min-w-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{t('telephony.metrics.answered')}</CardTitle>
                <PhoneIncoming className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{answeredCalls}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {answerRate}% {t('telephony.metrics.ofTotal')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {missedRate}% {t('telephony.metrics.ofTotal')}
              </p>
            </CardContent>
          </Card>

          {/* Perdidas */}
          <Card className="min-w-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{t('telephony.metrics.missed')}</CardTitle>
                <PhoneMissed className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{missedCalls}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {missedRate}% del total
              </p>
            </CardContent>
          </Card>

          {/* Duración Promedio */}
          <Card className="min-w-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{t('telephony.metrics.avgDuration')}</CardTitle>
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {callStats?.averageDuration ? Math.floor(callStats.averageDuration / 60) : 0}{t('telephony.metrics.minutes')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {callStats?.averageDuration ? callStats.averageDuration % 60 : 0}{t('telephony.metrics.seconds')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Gráficos */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Tendencia */}
          <Card className="lg:col-span-2 min-w-0 overflow-x-auto">
            <CardHeader>
              <CardTitle>{t('telephony.charts.trend')}</CardTitle>
              <CardDescription>
                {t('telephony.charts.evolution')} {dateRange} {t('telephony.charts.days')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }} />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name={t('telephony.metrics.total')} />
                  <Line
                    type="monotone"
                    dataKey="answered"
                    stroke="#10b981"
                    strokeWidth={2}
                    name={t('telephony.metrics.answered')}
                  />
                  <Line
                    type="monotone"
                    dataKey="missed"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name={t('telephony.metrics.missed')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribución */}
          <Card className="min-w-0 overflow-x-auto">
            <CardHeader>
              <CardTitle>{t('telephony.charts.distribution')}</CardTitle>
              <CardDescription>
                Total: {totalCalls} {t('telephony.metrics.callsToday').toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? COLORS.answered : COLORS.missed}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-around mt-4 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">
                    {t('telephony.metrics.answered')}: {answeredCalls}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">
                    {t('telephony.metrics.missed')}: {missedCalls}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rendimiento por Ubicación */}
        <Card className="min-w-0 overflow-x-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('telephony.performance.title')}</CardTitle>
                <CardDescription>{t('telephony.performance.subtitle')}</CardDescription>
              </div>
              <BarChart3 className="h-5 w-5 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            {locationStats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{t('telephony.performance.noLocations')}</p>
                <p className="text-sm mt-1">{t('telephony.performance.addLocations')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {locationStats.slice(0, 5).map((stat, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-600" />
                          <span className="font-medium truncate">{stat.location}</span>
                        </div>
                        <Badge
                          variant={stat.missedPercentage > 30 ? 'destructive' : 'secondary'}
                        >
                          {stat.missed} {t('telephony.metrics.missed')} ({stat.missedPercentage}%)
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${stat.missedPercentage > 30
                            ? 'bg-red-500'
                            : stat.missedPercentage > 15
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                            }`}
                          style={{ width: `${Math.min(stat.missedPercentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>
                          {t('telephony.metrics.total')}: {stat.total} {t('telephony.metrics.callsToday').toLowerCase()}
                        </span>
                        <span>
                          {t('telephony.metrics.answered')}: {stat.total - stat.missed}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial de Llamadas */}
        <Card className="min-w-0 overflow-x-auto">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
              <div>
                <CardTitle>{t('telephony.history.title')}</CardTitle>
                <CardDescription>
                  {t('telephony.history.subtitle')}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={t('telephony.filters.allLocations')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('telephony.filters.allLocations')}</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingCalls ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 animate-pulse rounded" />
                ))}
              </div>
            ) : filteredCalls.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{t('telephony.history.noCalls')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('telephony.history.number')}</TableHead>
                      <TableHead>{t('telephony.history.status')}</TableHead>
                      <TableHead>{t('telephony.history.duration')}</TableHead>
                      <TableHead>{t('telephony.history.location')}</TableHead>
                      <TableHead>{t('telephony.history.datetime')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCalls.slice(0, 20).map((call) => {
                      const location = locations.find((l) => l.id === call.routedToLocation);
                      return (
                        <TableRow key={call.id}>
                          <TableCell className="font-medium">{call.callerNumber}</TableCell>
                          <TableCell>
                            <Badge
                              variant={call.status === 'missed' ? 'destructive' : 'default'}
                            >
                              {call.status === 'missed'
                                ? t('telephony.metrics.missed')
                                : t('telephony.metrics.answered')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {call.duration > 0
                              ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-500" />
                              <span className="text-sm">{location?.name || t('telephony.history.noLocation')}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">
                            {format(new Date(call.createdAt), t('telephony.dateFormat'), { locale: es })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
