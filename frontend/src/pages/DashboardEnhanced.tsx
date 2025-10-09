/**
 * Dashboard Enhanced - Aggregated Metrics with Location Filtering
 * 
 * Features:
 * - Total sum across all locations
 * - Per-location breakdowns with Recharts
 * - Location filter dropdown
 * - Time range selector
 * - Revenue calculator
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/use-auth';
import { useLocationMetrics } from '@/hooks/useLocationMetrics';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Phone,
  MessageSquare,
  TrendingUp,
  DollarSign,
  MapPin,
  Clock,
  BarChart3,
  Filter,
  Download,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Link } from 'wouter';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardEnhanced() {
  const { user } = useAuth();
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const { metrics, locations, isLoading } = useLocationMetrics({
    userId: user?.id,
    locationId: selectedLocationId,
    timeRange,
  });

  const { total, byLocation } = metrics;

  // Prepare chart data
  const callsChartData = byLocation.map(loc => ({
    name: loc.locationName,
    Contestadas: loc.answeredCalls,
    Perdidas: loc.missedCalls,
  }));

  const messagesChartData = byLocation.map(loc => ({
    name: loc.locationName,
    WhatsApp: loc.messagesSentWhatsApp,
    SMS: loc.messagesSentSMS,
  }));

  const recoveryRateData = byLocation.map(loc => ({
    name: loc.locationName,
    rate: loc.recoveryRate,
  }));

  const revenueData = byLocation.map(loc => ({
    name: loc.locationName,
    value: loc.revenueRecovered,
  }));

  const pieData = [
    { name: 'Contestadas', value: total.answeredCalls, color: COLORS[1] },
    { name: 'Perdidas', value: total.missedCalls, color: COLORS[3] },
  ];

  const timeRangeLabels = {
    '7d': 'Últimos 7 días',
    '30d': 'Últimos 30 días',
    '90d': 'Últimos 90 días',
    'all': 'Todo el tiempo',
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - UNMI</title>
        <meta name="description" content="Vista general de métricas y análisis" />
      </Helmet>

      <div className="p-6 space-y-6">
        {/* Header with Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              {selectedLocationId 
                ? `Mostrando datos de ${locations.find((l: any) => l.id === selectedLocationId)?.name}` 
                : 'Vista agregada de todas las ubicaciones'}
            </p>
          </div>

          <div className="flex gap-3">
            {/* Location Filter */}
            <Select
              value={selectedLocationId?.toString() || 'all'}
              onValueChange={(value) => setSelectedLocationId(value === 'all' ? null : parseInt(value))}
            >
              <SelectTrigger className="w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ubicaciones</SelectItem>
                {locations.map((location: any) => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Time Range Filter */}
            <Select
              value={timeRange}
              onValueChange={(value: any) => setTimeRange(value)}
            >
              <SelectTrigger className="w-48">
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">{timeRangeLabels['7d']}</SelectItem>
                <SelectItem value="30d">{timeRangeLabels['30d']}</SelectItem>
                <SelectItem value="90d">{timeRangeLabels['90d']}</SelectItem>
                <SelectItem value="all">{timeRangeLabels['all']}</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Button */}
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Llamadas</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total.totalCalls}</div>
              <p className="text-xs text-muted-foreground">
                {total.answeredCalls} contestadas, {total.missedCalls} perdidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensajes Enviados</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total.messagesSent}</div>
              <p className="text-xs text-muted-foreground">
                {total.messagesWhatsApp} WhatsApp, {total.messagesSMS} SMS
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Recuperación</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total.avgRecoveryRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Promedio entre {byLocation.length} ubicación(es)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Recuperados</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{total.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Estimado: €20 por llamada recuperada
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="calls" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calls">Llamadas</TabsTrigger>
            <TabsTrigger value="messages">Mensajes</TabsTrigger>
            <TabsTrigger value="recovery">Recuperación</TabsTrigger>
            <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          </TabsList>

          {/* Calls Chart */}
          <TabsContent value="calls" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Llamadas por Ubicación</CardTitle>
                  <CardDescription>Contestadas vs Perdidas</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={callsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Contestadas" fill={COLORS[1]} />
                      <Bar dataKey="Perdidas" fill={COLORS[3]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución Total</CardTitle>
                  <CardDescription>Proporción de llamadas</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Messages Chart */}
          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mensajes por Ubicación</CardTitle>
                <CardDescription>WhatsApp vs SMS</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={messagesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="WhatsApp" fill={COLORS[1]} />
                    <Bar dataKey="SMS" fill={COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recovery Chart */}
          <TabsContent value="recovery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tasa de Recuperación</CardTitle>
                <CardDescription>Porcentaje de llamadas perdidas recuperadas</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recoveryRateData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke={COLORS[1]}
                      strokeWidth={2}
                      name="Tasa (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Chart */}
          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ingresos Recuperados por Ubicación</CardTitle>
                <CardDescription>Estimación basada en €20 por recuperación</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `€${value}`} />
                    <Bar dataKey="value" fill={COLORS[1]} name="Ingresos (€)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Per-Location Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Desglose por Ubicación
            </CardTitle>
            <CardDescription>
              Métricas detalladas de cada establecimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Número Virtual</TableHead>
                  <TableHead className="text-right">Llamadas</TableHead>
                  <TableHead className="text-right">Perdidas</TableHead>
                  <TableHead className="text-right">Mensajes</TableHead>
                  <TableHead className="text-right">Recuperación</TableHead>
                  <TableHead className="text-right">Tiempo Resp.</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byLocation.map((loc) => (
                  <TableRow key={loc.locationId}>
                    <TableCell className="font-medium">{loc.locationName}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {loc.virtualNumber || '-'}
                    </TableCell>
                    <TableCell className="text-right">{loc.totalCalls}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={loc.missedCalls > loc.answeredCalls ? 'destructive' : 'secondary'}>
                        {loc.missedCalls}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{loc.messagesSent}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={loc.recoveryRate > 50 ? 'default' : 'secondary'}>
                        {loc.recoveryRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{loc.avgResponseTime} min</TableCell>
                    <TableCell className="text-right font-semibold">
                      €{loc.revenueRecovered.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/locations">
                <MapPin className="mr-2 h-4 w-4" />
                Gestionar Ubicaciones
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/templates">
                <MessageSquare className="mr-2 h-4 w-4" />
                Ver Templates
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/telefonia">
                <Phone className="mr-2 h-4 w-4" />
                Historial de Llamadas
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

