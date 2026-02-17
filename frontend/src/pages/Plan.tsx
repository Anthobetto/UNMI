import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Check, Building2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Helmet } from 'react-helmet-async';
import { LanguageSelector } from "@/components/LanguageSelector";

export default function Plan() {
  const { user, updateUserPlan } = useAuth();
  const { t } = useTranslation();
  
  const [selectedPlan, setSelectedPlan] = useState<'small' | 'pro'>('small');
  const [isProcessing, setIsProcessing] = useState(false);

  const [numLocations, setNumLocations] = useState(1);
  const [numDepartments, setNumDepartments] = useState(1);

  const PRICE_SMALL = 60;
  const PRICE_PRO_BASE = 120;

  const calculateTotal = () => {
    if (selectedPlan === 'small') return PRICE_SMALL;
    const extraLocs = Math.max(0, numLocations - 1) * 30;
    const extraDepts = Math.max(0, numDepartments - 1) * 15;
    return PRICE_PRO_BASE + extraLocs + extraDepts;
  };

const handleUpgrade = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    try {
      // 1. Llamamos a nuestro backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/payments/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,       
          email: user.email,
          planType: selectedPlan,   
          locations: numLocations, 
          departments: numDepartments 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar el pago');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No se recibió la URL de pago");
      }

    } catch (error) {
      console.error(error);
      alert(t('plan.toast.error') || "Error al procesar la solicitud");
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('plan.header.title')} - UNMI</title>
      </Helmet>
      
      <div className="space-y-2 mt-1">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{t('plan.header.title')}</h1>
            <p className="text-gray-500">{t('plan.header.subtitle')}</p>
          </div>

          <div>
            <LanguageSelector />
          </div>
        </div>

        {/* GRID DE PLANES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* PLAN SMALL */}
          <div 
            onClick={() => setSelectedPlan('small')}
            className={`relative p-8 rounded-2xl border-2 cursor-pointer transition-all ${
              selectedPlan === 'small' ? 'border-red-500 bg-red-50/10 shadow-xl' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl"><Building2 /></div>
              <h3 className="text-xl font-bold">{t('plan.small.title')}</h3>
            </div>
            <p className="text-3xl font-bold mb-6">€{PRICE_SMALL}<span className="text-sm font-normal text-gray-500">{t('plan.perMonth')}</span></p>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-2"><Check size={18} className="text-green-500"/> {t('plan.small.features.locations')}</li>
              <li className="flex gap-2"><Check size={18} className="text-green-500"/> {t('plan.small.features.departments')}</li>
              <li className="flex gap-2"><Check size={18} className="text-green-500"/> {t('plan.small.features.messages')}</li>
            </ul>
          </div>

          {/* PLAN PRO */}
          <div 
            onClick={() => setSelectedPlan('pro')}
            className={`relative p-8 rounded-2xl border-2 cursor-pointer transition-all ${
              selectedPlan === 'pro' ? 'border-red-500 bg-red-50/10 shadow-xl' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
              {t('plan.pro.badge')}
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl"><Rocket /></div>
              <h3 className="text-xl font-bold">{t('plan.pro.title')}</h3>
            </div>
            <p className="text-3xl font-bold mb-6">
              €{PRICE_PRO_BASE}
              <span className="text-sm font-normal text-gray-500">{t('plan.perMonth')} ({t('plan.base')})</span>
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-2"><Check size={18} className="text-green-500"/> {t('plan.pro.features.locations')}</li>
              <li className="flex gap-2"><Check size={18} className="text-green-500"/> {t('plan.pro.features.departments')}</li>
              <li className="flex gap-2"><Check size={18} className="text-green-500"/> {t('plan.pro.features.messages')}</li>
            </ul>
          </div>
        </div>

        {/* CONFIGURADOR PRO */}
        {selectedPlan === 'pro' && (
           <Card className="mb-8 bg-gray-50 border-0">
             <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label className="block text-sm font-medium mb-2">{t('plan.config.locationsLabel')}</label>
                 <Select value={numLocations.toString()} onValueChange={(v) => setNumLocations(Number(v))}>
                   <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                   <SelectContent>
                     {[1,2,3,4,5,10].map(n => (
                       <SelectItem key={n} value={n.toString()}>
                         {n} {t('plan.config.sedes')}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <label className="block text-sm font-medium mb-2">{t('plan.config.departmentsLabel')}</label>
                 <Select value={numDepartments.toString()} onValueChange={(v) => setNumDepartments(Number(v))}>
                   <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                   <SelectContent>
                     {[1,2,3,4,5].map(n => (
                       <SelectItem key={n} value={n.toString()}>
                         {n} {t('plan.config.depts')}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </CardContent>
           </Card>
        )}

        {/* RESUMEN FINAL */}
        <div className="text-black p-6 rounded-xl flex flex-col md:flex-row justify-between items-center bg-gray-50">
          <div>
            <p className="text-gray-400 text-sm uppercase font-bold">{t('plan.summary.title')}</p>
            <p className="text-2xl font-bold">
              {t('plan.summary.current')}: {user?.planType ? (user.planType === 'small' ? t('plan.small.title') : t('plan.pro.title')) : t('plan.summary.none')} 
              {' '}{t('plan.summary.arrow')}{' '} 
              {selectedPlan === 'small' ? t('plan.small.title') : t('plan.pro.title')}
            </p>
          </div>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <div className="text-right">
               <p className="text-3xl font-bold">€{calculateTotal()}</p>
               <p className="text-gray-400 text-xs">{t('plan.summary.total')}</p>
            </div>
            <Button 
              onClick={handleUpgrade} 
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700 h-12 px-8 text-lg"
            >
              {isProcessing ? t('plan.summary.processing') : t('plan.summary.confirm')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}