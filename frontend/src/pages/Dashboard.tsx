/**
 * Dashboard Page - Overview de métricas y llamadas
 * Conectado con useCallMetrics y backend real
 * Conditional rendering según plan del usuario
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
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
  const { user, hasAccessToSection } = useAuth();
  const [averageTicket, setAverageTicket] = useState('50');
  const [conversionRate, setConversionRate] = useState('30');

  // Queries
  const { data: callStats, isLoading: loadingCalls } = useQuery<CallStats>({
    queryKey: ['/api/calls/stats'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/calls/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
    { name: 'Contestadas', value: callStats?.answered ?? 0 },
    { name: 'Perdidas', value: callStats?.missed ?? 0 },
  ];

  const missedCallRate = callStats?.total 
    ? ((callStats.missed / callStats.total) * 100).toFixed(1)
    : '0';

  return (
    <>
      <Helmet>
        <title>Dashboard - UNMI</title>
        <meta name="description" content="Panel de control de métricas y llamadas" />
      </Helmet>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Bienvenido, {user?.username || 'Usuario'}
          </p>
        </div>

        {/* Plan Info Alert */}
        {user?.planType && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Plan Activo: {user.planType === 'templates' ? 'Templates' : 'Chatbots'}</AlertTitle>
            <AlertDescription>
              Tienes acceso a {user.planType === 'templates' ? 'plantillas personalizadas' : 'chatbots con IA'}.
              {' '}
              <Link href="/plan">
                <a className="underline font-medium">Cambiar plan</a>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Métricas Principales */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Calls Today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Llamadas Hoy
              </CardTitle>
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
                    vs ayer
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Missed Calls */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Llamadas Perdidas
              </CardTitle>
              <Phone className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              {loadingCalls ? (
                <div className="h-8 bg-gray-200 animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-red-600">{missedCalls}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {missedCallRate}% del total
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Messages Sent */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Mensajes Enviados
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {loadingMessages ? (
                <div className="h-8 bg-gray-200 animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalMessages}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {messageStats?.delivered ?? 0} entregados
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Expected Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Ingresos Estimados
              </CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                €{expectedRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {recoveredCalls} llamadas recuperadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Distribution Chart + Revenue Calculator */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Call Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Llamadas</CardTitle>
              <CardDescription>
                Total: {callStats?.total ?? 0} llamadas
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
                  <span className="text-sm">Contestadas: {callStats?.answered ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">Perdidas: {callStats?.missed ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculadora de Rentabilidad
              </CardTitle>
              <CardDescription>
                Estima los ingresos generados por la recuperación de llamadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="averageTicket">Ticket Promedio (€)</Label>
                <Input
                  id="averageTicket"
                  type="number"
                  value={averageTicket}
                  onChange={(e) => setAverageTicket(e.target.value)}
                  placeholder="50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conversionRate">Tasa de Conversión (%)</Label>
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
                    <span className="text-gray-600">Llamadas perdidas:</span>
                    <span className="font-medium">{missedCalls}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Llamadas recuperadas ({conversionRate}%):</span>
                    <span className="font-medium">{recoveredCalls}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Ingresos estimados:</span>
                    <span className="text-green-600">€{expectedRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-800">
                  💡 Con UNMI recuperas automáticamente un promedio del 30% de llamadas perdidas
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Recent Calls Table */}
        <Card>
          <CardHeader>
            <CardTitle>Llamadas Recientes</CardTitle>
            <CardDescription>Últimas 5 llamadas recibidas</CardDescription>
          </CardHeader>
          <CardContent>
            {recentCalls.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay llamadas registradas aún</p>
                <p className="text-sm mt-1">
                  Las llamadas aparecerán aquí cuando configures tus números
                </p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/locations">
                    <MapPin className="h-4 w-4 mr-2" />
                    Configurar Ubicaciones
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCalls.map((call) => {
                    const location = locations.find(l => l.id === call.routedToLocation);
                    return (
                      <TableRow key={call.id}>
                        <TableCell className="font-medium">{call.callerNumber}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={call.status === 'missed' ? 'destructive' : 'default'}
                          >
                            {call.status === 'missed' ? 'Perdida' : 'Contestada'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {call.duration > 0 ? `${call.duration}s` : '-'}
                        </TableCell>
                        <TableCell>
                          {location?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {new Date(call.createdAt).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
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
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
            <Link href="/locations">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ubicaciones</CardTitle>
                <MapPin className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{locations.length}</div>
                <p className="text-xs text-muted-foreground">Gestionar ubicaciones</p>
              </CardContent>
            </Link>
          </Card>

          {hasAccessToSection('templates') && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
              <Link href="/templates">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Templates</CardTitle>
                  <FileText className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">Gestionar plantillas</p>
                </CardContent>
              </Link>
            </Card>
          )}

          <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
            <Link href="/plan">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tu Plan</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium capitalize">{user?.planType || 'Basic'}</div>
                <p className="text-xs text-muted-foreground">Mejorar plan</p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}



