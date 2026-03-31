import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Check, Building2, Rocket, ShieldCheck, Loader2, CreditCard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Helmet } from 'react-helmet-async';
import { cn } from "@/utils/cn";
import { Link } from "wouter";

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
    // ... logic ...
    setTimeout(() => setIsProcessing(false), 2000);
  };

  return (
    <>
      <Helmet><title>{t('plan.header.title')} - UNMI</title></Helmet>

      <div className="flex flex-col gap-y-8 pb-10">
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
            <CreditCard className="h-6 w-6 text-[#003366]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {t('plan.header.title')}
            </h2>
            <p className="text-sm font-medium text-slate-400">{t('plan.header.subtitle')}</p>
          </div>
        </div>

        {/* Grid de Planes */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {(['small', 'pro', 'premium'] as const).map((planKey) => {
            const isSelected = selectedPlanUI === planKey;
            const currentTier = planKey === 'small' ? smallTier : planKey === 'pro' ? proTier : premiumTier;
            const setters = { small: setSmallTier, pro: setProTier, premium: setPremiumTier };
            const setTier = setters[planKey];

            return (
              <Card 
                key={planKey} 
                onClick={() => setSelectedPlanUI(planKey)} 
                className={cn(
                  "rounded-[2.5rem] border-4 p-10 shadow-sm transition-all cursor-pointer flex flex-col relative overflow-hidden group",
                  isSelected ? "border-[#003366] bg-white scale-[1.02] shadow-xl shadow-blue-900/10" : "border-transparent bg-white hover:border-slate-100"
                )}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-[#003366] text-white text-[10px] font-black px-6 py-2 rounded-bl-3xl uppercase tracking-widest">
                    Seleccionado
                  </div>
                )}

                <div className="mb-8">
                  <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center mb-6 transition-colors", isSelected ? "bg-blue-50 text-[#003366]" : "bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-[#003366]")}>
                    {planKey === 'small' ? <Building2 className="h-8 w-8" /> : planKey === 'pro' ? <Rocket className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 capitalize">{t(`plan.${planKey}.title`)}</h3>
                </div>

                <div className="mb-8">
                  <Select 
                    disabled={!isSelected} 
                    value={currentTier.messages.toString()} 
                    onValueChange={(val) => {
                      const matched = PRICING_TIERS[planKey].find(item => item.messages.toString() === val);
                      if (matched) setTier(matched);
                    }}
                  >
                    <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold px-6">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICING_TIERS[planKey].map((tierItem) => (
                        <SelectItem key={tierItem.messages} value={tierItem.messages.toString()}>
                          {tierItem.messages} mensajes - €{tierItem.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mb-10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-slate-900">€{currentTier.price}</span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">/mes</span>
                  </div>
                </div>

                <ul className="space-y-5 mb-10 flex-grow">
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <Check className="h-5 w-5 text-emerald-500 bg-emerald-50 p-1 rounded-lg" /> 
                    {t(`plan.${planKey}.feature1`)}
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <Check className="h-5 w-5 text-emerald-500 bg-emerald-50 p-1 rounded-lg" /> 
                    {t(`plan.${planKey}.feature2`)}
                  </li>
                </ul>
              </Card>
            );
          })}
        </div>

        {/* Configuración de Escalabilidad */}
        {selectedPlanUI !== 'small' && (
          <Card className="rounded-[2.5rem] border-none bg-white p-10 shadow-sm">
            <h4 className="text-xl font-bold text-slate-900 mb-8">Personaliza tu capacidad</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('plan.config.locationsLabel')}</label>
                <Select value={numLocations.toString()} onValueChange={(v) => setNumLocations(Number(v))}>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>{[1, 2, 3, 4, 5, 10, 20].map(n => <SelectItem key={n} value={n.toString()}>{n} sedes</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('plan.config.departmentsLabel')}</label>
                <Select value={numDepartments.toString()} onValueChange={(v) => setNumDepartments(Number(v))}>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>{[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={n.toString()}>{n} departamentos</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        )}

        {/* Resumen Final Adaptativo */}
        <Card className="rounded-[3rem] border-none bg-[#003366] p-12 shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="text-center md:text-left">
              <span className="text-blue-200 text-xs font-black uppercase tracking-[0.3em] mb-4 block italic">Resumen de suscripción</span>
              <h4 className="text-3xl font-black mb-2 italic">
                {user?.planType === selectedPlanUI ? 'Mantener' : 'Cambiar a'} {selectedPlanUI.toUpperCase()}
              </h4>
              <p className="text-blue-100 font-medium opacity-80">
                {numLocations} sedes / {numDepartments} departamentos activados
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="text-center md:text-right">
                <div className="flex items-baseline justify-center md:justify-end gap-2">
                  <span className="text-6xl font-black">€{calculateTotal()}</span>
                  <span className="text-lg font-bold text-blue-200 uppercase">/mes</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mt-2">Total (IVA incl.)</p>
              </div>

              <Button 
                onClick={handleUpgrade} 
                disabled={isProcessing} 
                className="bg-white text-[#003366] hover:bg-blue-50 h-20 px-12 rounded-[2rem] text-2xl font-black shadow-xl transition-all active:scale-95 min-w-[280px]"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-3"><Loader2 className="animate-spin size-8" /> Procesando...</span>
                ) : (
                  <span className="flex items-center gap-2">Confirmar Plan <ChevronRight className="h-6 w-6" /></span>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
