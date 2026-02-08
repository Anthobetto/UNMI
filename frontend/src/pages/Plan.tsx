import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Check, Building2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Helmet } from 'react-helmet-async';

export default function Plan() {
  const { user, updateUserPlan } = useAuth();
  const { t } = useTranslation();
  
  // Estado visual ('small' por defecto)
  const [selectedPlan, setSelectedPlan] = useState<'small' | 'pro'>('small');
  const [isProcessing, setIsProcessing] = useState(false);

  // Configuración Pro
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
    try {
      setIsProcessing(true);
      // Aquí iría la lógica de redirección a Stripe o actualización directa
      // Por ahora simulamos actualización de plan en contexto
      await updateUserPlan(selectedPlan);
      alert("Plan actualizado correctamente (Simulación)");
    } catch (error) {
      console.error(error);
      alert("Error al actualizar el plan");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Mi Plan - UNMI</title>
      </Helmet>
      
      <div className="p-8 max-w-6xl mx-auto mt-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Gestiona tu Suscripción</h1>
          <p className="text-gray-500">Elige el plan que mejor se adapte a tu negocio actual.</p>
        </div>

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
              <h3 className="text-xl font-bold">Pequeña Empresa</h3>
            </div>
            <p className="text-3xl font-bold mb-6">€{PRICE_SMALL}<span className="text-sm font-normal text-gray-500">/mes</span></p>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-2"><Check size={18} className="text-green-500"/> 1 Sede</li>
              <li className="flex gap-2"><Check size={18} className="text-green-500"/> 1 Departamento</li>
              <li className="flex gap-2"><Check size={18} className="text-green-500"/> 150 Mensajes incluidos</li>
            </ul>
          </div>

          {/* PLAN PRO */}
          <div 
            onClick={() => setSelectedPlan('pro')}
            className={`relative p-8 rounded-2xl border-2 cursor-pointer transition-all ${
              selectedPlan === 'pro' ? 'border-red-500 bg-red-50/10 shadow-xl' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">RECOMENDADO</div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl"><Rocket /></div>
              <h3 className="text-xl font-bold">UNMI Pro</h3>
            </div>
            <p className="text-3xl font-bold mb-6">€{PRICE_PRO_BASE}<span className="text-sm font-normal text-gray-500">/mes (base)</span></p>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-2"><Check size={18} className="text-green-500"/> Multi-Sede</li>
              <li className="flex gap-2"><Check size={18} className="text-green-500"/> Multi-Departamento</li>
              <li className="flex gap-2"><Check size={18} className="text-green-500"/> 360 Mensajes incluidos</li>
            </ul>
          </div>
        </div>

        {/* CONFIGURADOR PRO */}
        {selectedPlan === 'pro' && (
           <Card className="mb-8 bg-gray-50 border-0">
             <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label className="block text-sm font-medium mb-2">Número de Sedes (+30€/u)</label>
                 <Select value={numLocations.toString()} onValueChange={(v) => setNumLocations(Number(v))}>
                   <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                   <SelectContent>
                     {[1,2,3,4,5,10].map(n => <SelectItem key={n} value={n.toString()}>{n} Sedes</SelectItem>)}
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <label className="block text-sm font-medium mb-2">Número de Depts (+15€/u)</label>
                 <Select value={numDepartments.toString()} onValueChange={(v) => setNumDepartments(Number(v))}>
                   <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                   <SelectContent>
                     {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n} Depts</SelectItem>)}
                   </SelectContent>
                 </Select>
               </div>
             </CardContent>
           </Card>
        )}

        {/* RESUMEN FINAL */}
        <div className="bg-black text-white p-6 rounded-xl flex flex-col md:flex-row justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm uppercase font-bold">Resumen de cambio</p>
            <p className="text-2xl font-bold">
              Plan actual: {user?.planType || 'Ninguno'} {'->'} {selectedPlan === 'small' ? 'Pequeña Empresa' : 'UNMI Pro'}
            </p>
          </div>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <div className="text-right">
               <p className="text-3xl font-bold">€{calculateTotal()}</p>
               <p className="text-gray-400 text-xs">Total mensual estimado</p>
            </div>
            <Button 
              onClick={handleUpgrade} 
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700 h-12 px-8 text-lg"
            >
              {isProcessing ? 'Procesando...' : 'Confirmar Cambio'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}