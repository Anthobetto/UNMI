import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Check, Building2, Rocket, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Helmet } from 'react-helmet-async';
import { LanguageSelector } from "@/components/LanguageSelector";

// 1. Estructura de Precios (Sincronizada con Registro)
const PRICING_TIERS = {
  small: [{ messages: 50, price: 25 }, { messages: 100, price: 50 }, { messages: 150, price: 60 }, { messages: 200, price: 80 }],
  pro: [{ messages: 250, price: 100 }, { messages: 300, price: 110 }, { messages: 350, price: 135 }, { messages: 400, price: 150 }],
  premium: [{ messages: 500, price: 175 }, { messages: 600, price: 200 }, { messages: 800, price: 250 }, { messages: 1000, price: 300 }],
};

type PlanUI = 'small' | 'pro' | 'premium';

export default function Plan() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [selectedPlanUI, setSelectedPlanUI] = useState<PlanUI>('small');
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados de volumen por plan
  const [smallTier, setSmallTier] = useState(PRICING_TIERS.small[2]);
  const [proTier, setProTier] = useState(PRICING_TIERS.pro[1]);
  const [premiumTier, setPremiumTier] = useState(PRICING_TIERS.premium[1]);

  const [numLocations, setNumLocations] = useState(1);
  const [numDepartments, setNumDepartments] = useState(1);

  const calculateTotal = () => {
    let basePrice = 0;
    if (selectedPlanUI === 'small') basePrice = smallTier.price;
    else if (selectedPlanUI === 'pro') basePrice = proTier.price;
    else basePrice = premiumTier.price;

    const extraLocsCost = selectedPlanUI !== 'small' ? Math.max(0, numLocations - 1) * 30 : 0;
    const extraDeptsCost = selectedPlanUI !== 'small' ? Math.max(0, numDepartments - 1) * 15 : 0;

    return basePrice + extraLocsCost + extraDeptsCost;
  };

  const handleUpgrade = async () => {
    if (!user) return;
    setIsProcessing(true);

    const activeTier = selectedPlanUI === 'small' ? smallTier : selectedPlanUI === 'pro' ? proTier : premiumTier;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/payments/create-checkout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          planType: selectedPlanUI,
          messages: activeTier.messages,
          locations: numLocations,
          departments: numDepartments,
          price: calculateTotal()
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error redirecting to checkout');
      
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error(error);
      alert(t('plan.toast.errorDesc'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Helmet><title>{t('plan.header.title')} - UNMI</title></Helmet>

      <div className="space-y-6 mt-1 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">{t('plan.header.title')}</h1>
            <p className="text-gray-500">{t('plan.header.subtitle')}</p>
          </div>
          <LanguageSelector />
        </div>

        {/* Grid de Planes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(['small', 'pro', 'premium'] as const).map((planKey) => {
            const isSelected = selectedPlanUI === planKey;
            const currentTier = planKey === 'small' ? smallTier : planKey === 'pro' ? proTier : premiumTier;
            
            // Mapeo de setters para evitar condicionales complejos en el JSX
            const setters = { small: setSmallTier, pro: setProTier, premium: setPremiumTier };
            const setTier = setters[planKey];

            return (
              <div 
                key={planKey} 
                onClick={() => setSelectedPlanUI(planKey)} 
                className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex flex-col group ${
                  isSelected 
                    ? 'border-[#FF0000] bg-white dark:bg-white/5 shadow-xl scale-[1.02]' 
                    : 'border-gray-100 dark:border-white/5 bg-gray-50/50 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-xl transition-colors ${isSelected ? 'bg-red-100 text-[#FF0000]' : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'}`}>
                    {planKey === 'small' ? <Building2 /> : planKey === 'pro' ? <Rocket /> : <ShieldCheck />}
                  </div>
                  <h3 className="font-bold dark:text-white capitalize">{t(`plan.${planKey}.title`)}</h3>
                </div>

                <Select 
                  disabled={!isSelected} 
                  value={currentTier.messages.toString()} 
                  onValueChange={(val) => {
                    const matched = PRICING_TIERS[planKey].find(item => item.messages.toString() === val);
                    if (matched) setTier(matched);
                  }}
                >
                  <SelectTrigger className="mb-4 bg-transparent border-gray-200 dark:border-white/10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* ✅ CORRECCIÓN: 'tierItem' no choca con la 't' de traducción */}
                    {PRICING_TIERS[planKey].map((tierItem) => (
                      <SelectItem key={tierItem.messages} value={tierItem.messages.toString()}>
                        {tierItem.messages} {t('plan.message')}s - €{tierItem.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-3xl font-black mb-6 dark:text-white">
                  €{currentTier.price}
                  <span className="text-xs font-medium text-gray-400 ml-1">/{t('plan.perMonth')}</span>
                </p>

                <ul className="space-y-3 text-sm flex-grow dark:text-gray-300">
                  <li className="flex gap-2"><Check size={16} className="text-green-500"/> {t(`plan.${planKey}.feature1`)}</li>
                  <li className="flex gap-2"><Check size={16} className="text-green-500"/> {t(`plan.${planKey}.feature2`)}</li>
                </ul>
              </div>
            );
          })}
        </div>

        {/* Configuración de Escalabilidad */}
        {selectedPlanUI !== 'small' && (
          <Card className="bg-gray-50 dark:bg-white/5 border-0 rounded-[1.5rem] overflow-hidden">
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{t('plan.config.locationsLabel')}</label>
                <Select value={numLocations.toString()} onValueChange={(v) => setNumLocations(Number(v))}>
                  <SelectTrigger className="bg-white dark:bg-white/10 rounded-xl h-12 dark:text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{[1, 2, 3, 4, 5, 10, 20].map(n => <SelectItem key={n} value={n.toString()}>{n} {t('plan.config.sedes')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{t('plan.config.departmentsLabel')}</label>
                <Select value={numDepartments.toString()} onValueChange={(v) => setNumDepartments(Number(v))}>
                  <SelectTrigger className="bg-white dark:bg-white/10 rounded-xl h-12 dark:text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={n.toString()}>{n} {t('plan.config.depts')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumen Final Adaptativo */}
        <div className="mt-8 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center transition-all duration-300 shadow-xl border bg-gray-50 text-gray-900 border-gray-100 dark:bg-[#0A0A0A] dark:text-white dark:border-white/5">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <p className="text-[#FF0000] text-[10px] font-black uppercase tracking-[0.3em] mb-2">{t('plan.summary.title')}</p>
            <h4 className="text-xl md:text-2xl font-bold tracking-tight">
              {user?.planType === selectedPlanUI ? t('plan.summary.keep') : t('plan.summary.change')} {selectedPlanUI.toUpperCase()}
              <span className="ml-3 font-medium text-lg italic text-gray-500 dark:text-gray-400">
                ({numLocations} {t('plan.config.sedes')} / {numDepartments} {t('plan.config.depts')})
              </span>
            </h4>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-center md:text-right">
              <div className="flex items-baseline justify-center md:justify-end gap-1">
                <span className="text-4xl font-black italic">€{calculateTotal()}</span>
                <span className="text-xs font-bold uppercase ml-1 text-gray-400 dark:text-gray-500">/{t('plan.perMonth')}</span>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 text-gray-400 dark:text-gray-500">{t('plan.summary.total')}</p>
            </div>

            <Button 
              onClick={handleUpgrade} 
              disabled={isProcessing} 
              className="bg-[#FF0000] hover:bg-[#D32F2F] text-white h-16 px-12 rounded-2xl text-xl font-black shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-95 border-none min-w-[200px]"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2"><Loader2 className="animate-spin size-5" /> {t('plan.summary.processing')}</span>
              ) : t('plan.summary.confirm')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}