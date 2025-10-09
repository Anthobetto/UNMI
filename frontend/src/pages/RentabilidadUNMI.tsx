/**
 * Rentabilidad UNMI - ROI Dashboard
 * Calculadora de rentabilidad + métricas de profitability B2B
 * Extrae y expande el Income Calculator del Dashboard
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Euro,
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
  BarChart,
  Bar
} from 'recharts';

interface CallStats {
  total: number;
  missed: number;
  answered: number;
}

interface MessageStats {
  total: number;
  sent: number;
}

export default function RentabilidadUNMI() {
  const { user } = useAuth();
  const [averageTicket, setAverageTicket] = useState('50');
  const [conversionRate, setConversionRate] = useState('30');
  const [monthlyGrowth, setMonthlyGrowth] = useState('10');

  // Queries para datos reales
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

  const { data: messageStats } = useQuery<MessageStats>({
    queryKey: ['/api/messages/stats'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/messages/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch message stats');
      return response.json();
    },
    enabled: !!user,
  });

  // Cálculos de rentabilidad
  const missedCalls = callStats?.missed ?? 0;
  const messagesSent = messageStats?.sent ?? 0;
  const recoveredCalls = Math.floor(missedCalls * (Number(conversionRate) / 100));
  const expectedRevenue = recoveredCalls * Number(averageTicket);
  
  // Costos
  const baseCost = 60; // Plan básico €60/mes
  const messageCost = messagesSent * 1; // €1 por mensaje
  const totalCost = baseCost + messageCost;
  
  // ROI
  const profit = expectedRevenue - totalCost;
  const roi = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(1) : '0';
  const isPositiveROI = Number(roi) > 0;

  // Datos para gráfico de tendencia mensual (simulados/proyectados)
  const monthlyData = [
    { month: 'Ene', revenue: expectedRevenue * 0.6, cost: totalCost * 0.8, profit: (expectedRevenue * 0.6) - (totalCost * 0.8) },
    { month: 'Feb', revenue: expectedRevenue * 0.75, cost: totalCost * 0.85, profit: (expectedRevenue * 0.75) - (totalCost * 0.85) },
    { month: 'Mar', revenue: expectedRevenue * 0.9, cost: totalCost * 0.9, profit: (expectedRevenue * 0.9) - (totalCost * 0.9) },
    { month: 'Abr', revenue: expectedRevenue, cost: totalCost, profit: profit },
    { 
      month: 'May (Proyección)', 
      revenue: expectedRevenue * (1 + Number(monthlyGrowth) / 100), 
      cost: totalCost * 1.05, 
      profit: (expectedRevenue * (1 + Number(monthlyGrowth) / 100)) - (totalCost * 1.05) 
    },
  ];

  // Datos comparativa antes/después UNMI
  const comparisonData = [
    {
      metric: 'Llamadas Recuperadas',
      beforeUNMI: Math.floor(missedCalls * 0.05), // 5% manual
      withUNMI: recoveredCalls, // 30% con UNMI
    },
    {
      metric: 'Tiempo de Respuesta',
      beforeUNMI: 120, // 2 horas
      withUNMI: 2, // 2 minutos
    },
    {
      metric: 'Ingresos Mensuales',
      beforeUNMI: Math.floor(missedCalls * 0.05 * Number(averageTicket)),
      withUNMI: expectedRevenue,
    },
  ];

  const handleExportPDF = () => {
    alert('🚧 Funcionalidad de exportación PDF estará disponible próximamente.\n\nIncluirá:\n- Reporte completo de ROI\n- Gráficos de tendencia\n- Comparativa antes/después\n- Proyecciones futuras');
  };

  return (
    <>
      <Helmet>
        <title>Rentabilidad UNMI - Dashboard ROI - UNMI</title>
        <meta name="description" content="Analiza el retorno de inversión y rentabilidad de tu plataforma UNMI" />
      </Helmet>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rentabilidad UNMI</h1>
            <p className="text-gray-600 mt-1">
              Análisis de ROI y proyección de ingresos generados
            </p>
          </div>
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Reporte PDF
          </Button>
        </div>

        {/* KPIs Principales */}
        <div className="grid gap-6 md:grid-cols-4">
          {/* ROI */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">ROI</CardTitle>
                <Percent className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${isPositiveROI ? 'text-green-600' : 'text-red-600'}`}>
                {isPositiveROI && '+'}{roi}%
              </div>
              <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                {isPositiveROI ? (
                  <>
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">Rentable</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                    <span className="text-red-600">Ajustar estrategia</span>
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Ingresos Generados */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Ingresos Generados</CardTitle>
                <Euro className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                €{expectedRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {recoveredCalls} conversiones este mes
              </p>
            </CardContent>
          </Card>

          {/* Costos Totales */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Costos Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                €{totalCost.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Plan + {messagesSent} mensajes
              </p>
            </CardContent>
          </Card>

          {/* Beneficio Neto */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${profit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {profit >= 0 && '+'} €{profit.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Margen: {totalCost > 0 ? ((profit / expectedRevenue) * 100).toFixed(1) : '0'}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Calculadora + Gráfico Tendencia */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Calculadora Avanzada */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <CardTitle>Calculadora de Rentabilidad</CardTitle>
              </div>
              <CardDescription>
                Ajusta los parámetros para proyectar tu ROI
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
                <p className="text-xs text-muted-foreground">Valor promedio de cada venta/reserva</p>
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
                <p className="text-xs text-muted-foreground">
                  % de llamadas perdidas que se convierten en ventas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyGrowth">Crecimiento Mensual Esperado (%)</Label>
                <Input
                  id="monthlyGrowth"
                  type="number"
                  value={monthlyGrowth}
                  onChange={(e) => setMonthlyGrowth(e.target.value)}
                  placeholder="10"
                />
                <p className="text-xs text-muted-foreground">Proyección de crecimiento para próximo mes</p>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Llamadas perdidas:</span>
                  <span className="font-semibold">{missedCalls}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Llamadas recuperadas ({conversionRate}%):</span>
                  <span className="font-semibold text-green-600">{recoveredCalls}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Costo mensual UNMI:</span>
                  <span className="font-semibold text-orange-600">€{totalCost}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Beneficio esperado:</span>
                  <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    €{profit.toLocaleString()}
                  </span>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-800">
                  💡 <strong>Recomendación:</strong> Con UNMI, las empresas recuperan en promedio 30-40% de llamadas perdidas, generando un ROI positivo desde el primer mes.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Gráfico de Tendencia Mensual */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Rentabilidad</CardTitle>
              <CardDescription>Evolución mensual de ingresos vs. costos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => `€${value.toFixed(0)}`}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    name="Ingresos" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    name="Costos" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#8b5cf6" 
                    strokeWidth={2} 
                    name="Beneficio" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Comparativa Antes/Después UNMI */}
        <Card>
          <CardHeader>
            <CardTitle>Impacto de UNMI en tu Negocio</CardTitle>
            <CardDescription>Comparativa antes y después de implementar UNMI</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                />
                <Legend />
                <Bar dataKey="beforeUNMI" fill="#ef4444" name="Antes de UNMI" />
                <Bar dataKey="withUNMI" fill="#10b981" name="Con UNMI" />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-3 gap-4 mt-6">
              {comparisonData.map((item, index) => {
                const improvement = item.beforeUNMI > 0 
                  ? (((item.withUNMI - item.beforeUNMI) / item.beforeUNMI) * 100).toFixed(0) 
                  : '∞';
                
                return (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{item.metric}</h4>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      +{improvement}% mejora
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* CTA Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              ¿Quieres mejorar aún más tu rentabilidad?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-700">
              Optimiza tus conversiones con estrategias avanzadas:
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Personaliza templates según el horario de la llamada perdida</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Implementa chatbots con IA para respuestas 24/7</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Configura seguimientos automáticos para leads no convertidos</span>
              </li>
            </ul>
            <div className="flex gap-3 pt-2">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Mejorar mi Plan
              </Button>
              <Button variant="outline">
                Agendar Consultoría Gratuita
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

