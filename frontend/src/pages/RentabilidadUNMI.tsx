import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Download,
  Percent,
  Euro,
  Target,
  BarChart3
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
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

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

  return (
    <>
      <Helmet>
        <title>{t('profitability.title')} - UNMI</title>
      </Helmet>

      <div className="flex flex-col gap-y-8 pb-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
              <TrendingUp className="h-6 w-6 text-[#003366]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {t('profitability.title')}
              </h2>
              <p className="text-sm font-medium text-slate-400">Análisis de ROI y crecimiento</p>
            </div>
          </div>

          <Button variant="outline" className="rounded-2xl border-none bg-white shadow-sm h-12 px-6 font-bold text-[#003366]">
            <Download className="h-4 w-4 mr-2" /> Exportar informe
          </Button>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-[2.5rem] border-none bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <Percent className="h-6 w-6 text-emerald-600" />
              </div>
              <span className={cn("text-xs font-bold px-2 py-1 rounded-full", isPositiveROI ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-red-600")}>
                {isPositiveROI ? 'Rentable' : 'Ajustar'}
              </span>
            </div>
            <h4 className={cn("text-4xl font-black mb-1", isPositiveROI ? "text-emerald-500" : "text-rose-500")}>
              {isPositiveROI && '+'}{roi}%
            </h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('profitability.kpis.roi')}</p>
          </Card>

          <Card className="rounded-[2.5rem] border-none bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Euro className="h-6 w-6 text-[#003366]" />
              </div>
            </div>
            <h4 className="text-4xl font-black text-slate-900 mb-1">€{expectedRevenue.toLocaleString()}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('profitability.kpis.revenue')}</p>
          </Card>

          <Card className="rounded-[2.5rem] border-none bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-rose-600" />
              </div>
            </div>
            <h4 className="text-4xl font-black text-slate-900 mb-1">€{totalCost.toLocaleString()}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('profitability.kpis.costs')}</p>
          </Card>

          <Card className="rounded-[2.5rem] border-none bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <Target className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <h4 className="text-4xl font-black text-slate-900 mb-1">€{profit.toLocaleString()}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('profitability.kpis.profit')}</p>
          </Card>
        </div>

        {/* Calculator and Trend */}
        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-12 lg:col-span-5 rounded-[2.5rem] border-none bg-white p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-[#003366]" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">{t('profitability.calculator.title')}</h4>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('profitability.calculator.avgTicket')}</Label>
                <Input type="number" value={averageTicket} onChange={(e) => setAverageTicket(e.target.value)} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('profitability.calculator.conversionRate')}</Label>
                <Input type="number" value={conversionRate} onChange={(e) => setConversionRate(e.target.value)} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('profitability.calculator.monthlyGrowth')}</Label>
                <Input type="number" value={monthlyGrowth} onChange={(e) => setMonthlyGrowth(e.target.value)} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
              </div>

              <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                <div className="flex justify-between items-center text-sm font-bold text-slate-500 uppercase tracking-widest">
                  <span>{t('profitability.calculator.recovered')}:</span>
                  <span className="text-[#003366] text-lg">{recoveredCalls}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('profitability.calculator.expectedProfit')}:</span>
                  <span className={cn("text-3xl font-black", profit >= 0 ? "text-emerald-500" : "text-rose-500")}>€{profit.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="col-span-12 lg:col-span-7 rounded-[2.5rem] border-none bg-white p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-[#003366]" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">{t('profitability.trends.title')}</h4>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={4} dot={{ r: 4, fill: '#10B981' }} name={t('profitability.trends.revenue')} />
                  <Line type="monotone" dataKey="cost" stroke="#F59E0B" strokeWidth={4} dot={{ r: 4, fill: '#F59E0B' }} name={t('profitability.trends.costs')} />
                  <Line type="monotone" dataKey="profit" stroke="#8B5CF6" strokeWidth={4} dot={{ r: 4, fill: '#8B5CF6' }} name={t('profitability.trends.profit')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* CTA Card */}
        <Card className="rounded-[2.5rem] border-none bg-[#003366] p-12 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110" />
          <div className="relative z-10 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h4 className="text-3xl font-black text-white mb-4 italic">
                {t('profitability.cta.title')}
              </h4>
              <p className="text-blue-100 text-lg font-medium opacity-80">{t('profitability.cta.subtitle')}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-white text-[#003366] hover:bg-blue-50 h-14 px-8 rounded-2xl text-lg font-black shadow-lg">
                {t('profitability.cta.upgrade')}
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 h-14 px-8 rounded-2xl text-lg font-bold">
                {t('profitability.cta.consult')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
