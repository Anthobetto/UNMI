import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Check, Building2, Rocket, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Helmet } from 'react-helmet-async';
import { LanguageSelector } from "@/components/LanguageSelector";

// 1. Constante ÚNICA de Tiers (Copiada de AuthPage para coherencia total)
const PRICING_TIERS = {
  small: [
    { messages: 50, price: 25 },
    { messages: 100, price: 50 },
    { messages: 150, price: 60 },
    { messages: 200, price: 80 },
  ],
  pro: [
    { messages: 250, price: 100 },
    { messages: 300, price: 110 },
    { messages: 350, price: 135 },
    { messages: 400, price: 150 },
  ],
  premium: [
    { messages: 500, price: 175 },
    { messages: 600, price: 200 },
    { messages: 800, price: 250 },
    { messages: 1000, price: 300 },
  ],
};

export default function Plan() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [selectedPlanUI, setSelectedPlanUI] = useState<'small' | 'pro' | 'premium'>('small');
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados de Tiers (Igual que en AuthPage)
  const [smallTier, setSmallTier] = useState(PRICING_TIERS.small[2]); // 150 msgs / 60€
  const [proTier, setProTier] = useState(PRICING_TIERS.pro[1]);
  const [premiumTier, setPremiumTier] = useState(PRICING_TIERS.premium[1]);

  // Variables de escalabilidad (Para el Upsell de empresa)
  const [numLocations, setNumLocations] = useState(1);
  const [numDepartments, setNumDepartments] = useState(1);

  // 2. Cálculo dinámico alineado
  const calculateTotal = () => {
    let basePrice = 0;
    if (selectedPlanUI === 'small') basePrice = smallTier.price;
    else if (selectedPlanUI === 'pro') basePrice = proTier.price;
    else basePrice = premiumTier.price;

    // Lógica de extras (Solo para Pro y Premium según tu visión anterior)
    const extraLocsCost = selectedPlanUI !== 'small' ? Math.max(0, numLocations - 1) * 30 : 0;
    const extraDeptsCost = selectedPlanUI !== 'small' ? Math.max(0, numDepartments - 1) * 15 : 0;

    return basePrice + extraLocsCost + extraDeptsCost;
  };

  const handleUpgrade = async () => {
    if (!user) return;
    setIsProcessing(true);

    // El Tier actual seleccionado según el plan activo en la UI
    const activeTier = selectedPlanUI === 'small' ? smallTier : selectedPlanUI === 'pro' ? proTier : premiumTier;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/payments/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          planType: selectedPlanUI,
          messages: activeTier.messages, // Enviamos el volumen exacto elegido
          locations: numLocations,
          departments: numDepartments,
          price: calculateTotal()
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al iniciar el pago');
      if (data.url) window.location.href = data.url;

    } catch (error) {
      console.error(error);
      alert("Error al procesar la suscripción. Por favor, contacta con soporte.");
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Helmet><title>{t('plan.header.title')} - UNMI</title></Helmet>

      <div className="space-y-6 mt-1 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-gray-900">{t('plan.header.title')}</h1>
            <p className="text-gray-500">{t('plan.header.subtitle')}</p>
          </div>
          <LanguageSelector />
        </div>

        {/* GRID DE PLANES ALINEADO CON EL REGISTRO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* TARJETA SMALL */}
          <div
            onClick={() => setSelectedPlanUI('small')}
            className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex flex-col ${selectedPlanUI === 'small' ? 'border-[#FF0000] bg-white shadow-xl' : 'border-gray-100 bg-gray-50/50'
              }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${selectedPlanUI === 'small' ? 'bg-red-100 text-[#FF0000]' : 'bg-gray-200 text-gray-500'}`}><Building2 /></div>
              <h3 className="font-bold">Pequeña Empresa</h3>
            </div>
            <Select
              disabled={selectedPlanUI !== 'small'}
              value={smallTier.messages.toString()}
              onValueChange={(val) => setSmallTier(PRICING_TIERS.small.find(t => t.messages.toString() === val)!)}
            >
              <SelectTrigger className="mb-4"><SelectValue /></SelectTrigger>
              <SelectContent>{PRICING_TIERS.small.map(t => <SelectItem key={t.messages} value={t.messages.toString()}>{t.messages} mensajes - €{t.price}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-3xl font-black mb-6">€{smallTier.price}<span className="text-xs font-medium text-gray-400 ml-1">/mes</span></p>
            <ul className="space-y-3 text-sm flex-grow">
              <li className="flex gap-2"><Check size={16} className="text-green-500" /> 1 Localización</li>
              <li className="flex gap-2"><Check size={16} className="text-green-500" /> Webhooks de voz</li>
            </ul>
          </div>

          {/* TARJETA PRO */}
          <div
            onClick={() => setSelectedPlanUI('pro')}
            className={`relative p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex flex-col ${selectedPlanUI === 'pro' ? 'border-[#FF0000] bg-white shadow-xl' : 'border-gray-100 bg-gray-50/50'
              }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${selectedPlanUI === 'pro' ? 'bg-red-100 text-[#FF0000]' : 'bg-gray-200 text-gray-500'}`}><Rocket /></div>
              <h3 className="font-bold">UNMI Pro</h3>
            </div>
            <Select
              disabled={selectedPlanUI !== 'pro'}
              value={proTier.messages.toString()}
              onValueChange={(val) => setProTier(PRICING_TIERS.pro.find(t => t.messages.toString() === val)!)}
            >
              <SelectTrigger className="mb-4"><SelectValue /></SelectTrigger>
              <SelectContent>{PRICING_TIERS.pro.map(t => <SelectItem key={t.messages} value={t.messages.toString()}>{t.messages} mensajes - €{t.price}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-3xl font-black mb-6">€{proTier.price}<span className="text-xs font-medium text-gray-400 ml-1">/mes base</span></p>
            <ul className="space-y-3 text-sm flex-grow">
              <li className="flex gap-2"><Check size={16} className="text-green-500" /> Multi-sede escalable</li>
              <li className="flex gap-2"><Check size={16} className="text-green-500" /> Chatbots IA</li>
            </ul>
          </div>

          {/* TARJETA PREMIUM */}
          <div
            onClick={() => setSelectedPlanUI('premium')}
            className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex flex-col ${selectedPlanUI === 'premium' ? 'border-[#FF0000] bg-white shadow-xl' : 'border-gray-100 bg-gray-50/50'
              }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${selectedPlanUI === 'premium' ? 'bg-red-100 text-[#FF0000]' : 'bg-gray-200 text-gray-500'}`}><ShieldCheck /></div>
              <h3 className="font-bold">UNMI Premium</h3>
            </div>
            <Select
              disabled={selectedPlanUI !== 'premium'}
              value={premiumTier.messages.toString()}
              onValueChange={(val) => setPremiumTier(PRICING_TIERS.premium.find(t => t.messages.toString() === val)!)}
            >
              <SelectTrigger className="mb-4"><SelectValue /></SelectTrigger>
              <SelectContent>{PRICING_TIERS.premium.map(t => <SelectItem key={t.messages} value={t.messages.toString()}>{t.messages} mensajes - €{t.price}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-3xl font-black mb-6">€{premiumTier.price}<span className="text-xs font-medium text-gray-400 ml-1">/mes base</span></p>
            <ul className="space-y-3 text-sm flex-grow">
              <li className="flex gap-2"><Check size={16} className="text-green-500" /> Soporte 24/7</li>
              <li className="flex gap-2"><Check size={16} className="text-green-500" /> API de alta velocidad</li>
            </ul>
          </div>
        </div>

        {/* CONFIGURADOR DE SEDES (Solo si no es Small) */}
        {selectedPlanUI !== 'small' && (
          <Card className="bg-gray-50 border-0 rounded-[1.5rem] overflow-hidden">
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Sedes / Localizaciones (+30€/ud)</label>
                <Select value={numLocations.toString()} onValueChange={(v) => setNumLocations(Number(v))}>
                  <SelectTrigger className="bg-white rounded-xl h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>{[1, 2, 3, 4, 5, 10, 20].map(n => <SelectItem key={n} value={n.toString()}>{n} sede{n > 1 ? 's' : ''}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Departamentos (+15€/ud)</label>
                <Select value={numDepartments.toString()} onValueChange={(v) => setNumDepartments(Number(v))}>
                  <SelectTrigger className="bg-white rounded-xl h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>{[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={n.toString()}>{n} departamento{n > 1 ? 's' : ''}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* RESUMEN FINAL Y PAGO  */}
        <div className="bg-gray-50 text-gray-900 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center shadow-xl border border-gray-100">

          <div className="mb-6 md:mb-0 text-center md:text-left">
            <p className="text-[#FF0000] text-xs font-black uppercase tracking-[0.2em] mb-2">
              Resumen de actualización
            </p>
            <h4 className="text-xl font-bold text-gray-900">
              {user?.planType === selectedPlanUI ? 'Mantener' : 'Cambiar a'} {selectedPlanUI.toUpperCase()}
              <span className="text-gray-500 ml-2">
                ({numLocations} sedes / {numDepartments} depts)
              </span>
            </h4>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-4xl font-black text-gray-900">
                €{calculateTotal()}
              </p>
              <p className="text-gray-500 text-xs uppercase font-bold tracking-tighter">
                Total mensual (IVA incl.)
              </p>
            </div>

            <Button
              onClick={handleUpgrade}
              disabled={isProcessing}
              className="bg-[#FF0000] hover:bg-[#cc0000] text-white h-16 px-10 rounded-2xl text-xl font-black shadow-xl shadow-red-500/20 transition-all active:scale-95"
            >
              {isProcessing ? "Procesando..." : "Confirmar Cambio"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}