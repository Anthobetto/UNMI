import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
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
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';

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
  const { t } = useTranslation();
  const { user } = useAuth();
  const [averageTicket, setAverageTicket] = useState('50');
  const [conversionRate, setConversionRate] = useState('30');
  const [monthlyGrowth, setMonthlyGrowth] = useState('10');

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

  const missedCalls = callStats?.missed ?? 0;
  const messagesSent = messageStats?.sent ?? 0;
  const recoveredCalls = Math.floor(missedCalls * (Number(conversionRate) / 100));
  const expectedRevenue = recoveredCalls * Number(averageTicket);

  const baseCost = 60;
  const messageCost = messagesSent * 1;
  const totalCost = baseCost + messageCost;

  const profit = expectedRevenue - totalCost;
  const roi = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(1) : '0';
  const isPositiveROI = Number(roi) > 0;

  const monthlyData = [
    { month: 'Ene', revenue: expectedRevenue * 0.6, cost: totalCost * 0.8, profit: (expectedRevenue * 0.6) - (totalCost * 0.8) },
    { month: 'Feb', revenue: expectedRevenue * 0.75, cost: totalCost * 0.85, profit: (expectedRevenue * 0.75) - (totalCost * 0.85) },
    { month: 'Mar', revenue: expectedRevenue * 0.9, cost: totalCost * 0.9, profit: (expectedRevenue * 0.9) - (totalCost * 0.9) },
    { month: 'Abr', revenue: expectedRevenue, cost: totalCost, profit: profit },
    { month: 'May (Proyección)', revenue: expectedRevenue * (1 + Number(monthlyGrowth) / 100), cost: totalCost * 1.05, profit: (expectedRevenue * (1 + Number(monthlyGrowth) / 100)) - (totalCost * 1.05) },
  ];

  const comparisonData = [
    {
      metric: t('profitability.comparison.recoveredCalls'),
      beforeUNMI: Math.floor(missedCalls * 0.05),
      withUNMI: recoveredCalls,
    },
    {
      metric: t('profitability.comparison.responseTime'),
      beforeUNMI: 120,
      withUNMI: 2,
    },
    {
      metric: t('profitability.comparison.monthlyRevenue'),
      beforeUNMI: Math.floor(missedCalls * 0.05 * Number(averageTicket)),
      withUNMI: expectedRevenue,
    },
  ];

  const handleExportPDF = () => {
    alert(t('profitability.calculator.exportPDF'));
  };

  return (
    <>
      <Helmet>
        <title>{t('profitability.title')} - UNMI</title>
        <meta name="description" content={t('profitability.subtitle')} />
      </Helmet>

      <div className="space-y-2 mt-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="break-words">
            <h1 className="text-3xl font-bold text-gray-900 break-words">{t('profitability.title')}</h1>
            <p className="text-gray-600 mt-1 break-words">{t('profitability.subtitle')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
            <Button onClick={handleExportPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <LanguageSelector />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <Card className="min-w-0">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-sm font-medium break-words">{t('profitability.kpis.roi')}</CardTitle>
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
                    <span className="text-green-600 break-words">{t('profitability.kpis.profitable')}</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                    <span className="text-red-600 break-words">{t('profitability.kpis.adjust')}</span>
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-sm font-medium">{t('profitability.kpis.revenue')}</CardTitle>
                <Euro className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">€{expectedRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1 break-words">{recoveredCalls} {t('profitability.calculator.recovered')}</p>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-sm font-medium break-words">{t('profitability.kpis.costs')}</CardTitle>
                <DollarSign className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mt-1 break-words">{t('profitability.calculator.monthlyCost')} + {messagesSent} {t('profitability.calculator.messages')}</p>
              <div className="text-3xl font-bold text-orange-600">€{totalCost.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-sm font-medium break-words">{t('profitability.kpis.profit')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${profit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {profit >= 0 && '+'} €{profit.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1 break-words">{t('profitability.kpis.margin')}: {totalCost > 0 ? ((profit / expectedRevenue) * 100).toFixed(1) : '0'}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Calculadora y Gráfico Tendencia */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="min-w-0">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <CardTitle className="break-words">{t('profitability.calculator.title')}</CardTitle>
              </div>
              <CardDescription className="break-words">{t('profitability.calculator.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="averageTicket">{t('profitability.calculator.avgTicket')}</Label>
                <Input
                  id="averageTicket"
                  type="number"
                  value={averageTicket}
                  onChange={(e) => setAverageTicket(e.target.value)}
                  placeholder="50"
                />
                <p className="text-xs text-muted-foreground break-words">{t('profitability.calculator.avgValue')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conversionRate">{t('profitability.calculator.conversionRate')}</Label>
                <Input
                  id="conversionRate"
                  type="number"
                  value={conversionRate}
                  onChange={(e) => setConversionRate(e.target.value)}
                  placeholder="30"
                  max="100"
                />
                <p className="text-xs text-muted-foreground break-words">{t('profitability.calculator.conversionDesc')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyGrowth">{t('profitability.calculator.monthlyGrowth')}</Label>
                <Input
                  id="monthlyGrowth"
                  type="number"
                  value={monthlyGrowth}
                  onChange={(e) => setMonthlyGrowth(e.target.value)}
                  placeholder="10"
                />
                <p className="text-xs text-muted-foreground break-words">{t('profitability.calculator.growthDesc')}</p>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between text-sm break-words">
                  <span className="text-gray-600">{t('profitability.calculator.missedCalls')}:</span>
                  <span className="font-semibold">{missedCalls}</span>
                </div>
                <div className="flex justify-between text-sm break-words">
                  <span className="text-gray-600">{t('profitability.calculator.recovered')} ({conversionRate}%):</span>
                  <span className="font-semibold text-green-600">{recoveredCalls}</span>
                </div>
                <div className="flex justify-between text-sm break-words">
                  <span className="text-gray-600">{t('profitability.calculator.monthlyCost')}:</span>
                  <span className="font-semibold text-orange-600">€{totalCost}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t break-words">
                  <span>{t('profitability.calculator.expectedProfit')}:</span>
                  <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    €{profit.toLocaleString()}
                  </span>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-800 break-words">
                  💡 {t('profitability.calculator.recommendation')}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="w-full min-w-0 overflow-x-auto">
            <CardHeader>
              <CardTitle className="break-words">{t('profitability.trends.title')}</CardTitle>
              <CardDescription className="break-words">{t('profitability.trends.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `€${value.toFixed(0)}`} contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name={t('profitability.trends.revenue')} />
                  <Line type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} name={t('profitability.trends.costs')} />
                  <Line type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={2} name={t('profitability.trends.profit')} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Comparativa Antes/Después UNMI */}
        <Card className="w-full min-w-0 overflow-x-auto">
          <CardHeader>
            <CardTitle className="break-words">{t('profitability.comparison.title')}</CardTitle>
            <CardDescription className="break-words">{t('profitability.comparison.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }} />
                <Legend />
                <Bar dataKey="beforeUNMI" fill="#ef4444" name={t('profitability.comparison.beforeUNMI')} />
                <Bar dataKey="withUNMI" fill="#10b981" name={t('profitability.comparison.withUNMI')} />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              {comparisonData.map((item, index) => {
                const improvement = item.beforeUNMI > 0
                  ? (((item.withUNMI - item.beforeUNMI) / item.beforeUNMI) * 100).toFixed(0)
                  : '∞';
                return (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg min-w-0">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 break-words">{item.metric}</h4>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      +{improvement}% {t('profitability.comparison.improvement')}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* CTA Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 min-w-0">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 break-words">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              {t('profitability.cta.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-700 break-words">{t('profitability.cta.subtitle')}</p>
            <ul className="space-y-2 text-sm text-gray-600">
              {(t('profitability.cta.benefits', { returnObjects: true }) as string[]).map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2 break-words">
                  <span className="text-green-600">✓</span>
                  <span className="break-words">{benefit}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button className="bg-blue-600 hover:bg-blue-700">{t('profitability.cta.upgrade')}</Button>
              <Button variant="outline">{t('profitability.cta.consult')}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
