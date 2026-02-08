import { useState, useEffect } from 'react';
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, Building2 } from 'lucide-react';
import { pricingService, type PricingTier, type PricingCalculation } from '@/services/PricingService';

export interface DynamicPricingBarProps {
  tier: PricingTier;
  locations: number;
  onPriceChange: (calculation: PricingCalculation) => void;
  showLocationInput?: boolean;
}

export function DynamicPricingBar({ 
  tier, 
  locations: initialLocations = 1, 
  onPriceChange, 
  showLocationInput = false 
}: DynamicPricingBarProps) {
  
  // Estado local para los deslizadores
  const [dailyMessages, setDailyMessages] = useState(tier.includedMessages);
  const [departments, setDepartments] = useState(tier.includedDepartments);
  const [locations, setLocations] = useState(initialLocations);

  // Resetear valores cuando cambia el plan (tier)
  useEffect(() => {
    setDailyMessages(tier.includedMessages);
    setDepartments(tier.includedDepartments);
    if (!showLocationInput) {
      setLocations(initialLocations);
    }
  }, [tier, initialLocations, showLocationInput]);

  // Cálculo en tiempo real
  const calculation = pricingService.calculateMonthly(
    tier.id, 
    dailyMessages, 
    locations, 
    departments
  );

  // Notificar al padre
  useEffect(() => {
    onPriceChange(calculation);
  }, [calculation.totalMonthly, calculation.dailyMessages, calculation.locations, calculation.departments]);

  return (
    <Card className="w-full bg-slate-50 border-slate-200 mt-4">
      <CardContent className="pt-6 space-y-6">
        
        {/* Selector de Mensajes */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-slate-500" />
              <label className="text-sm font-medium">Mensajes Diarios</label>
            </div>
            <span className="font-bold text-lg">{dailyMessages}</span>
          </div>
          
          <Slider 
            value={[dailyMessages]} 
            min={tier.includedMessages} 
            max={tier.maxMessages} 
            step={1} 
            disabled={tier.maxMessages <= tier.includedMessages} 
            onValueChange={(val) => setDailyMessages(val[0])}
            className="cursor-pointer"
          />
          
          <div className="flex justify-between text-xs text-slate-400">
            <span>{tier.includedMessages} incluidos</span>
            {tier.id === 'pro' && <span>Máx: {tier.maxMessages}</span>}
          </div>
        </div>

        {/* Selector de Departamentos */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />
              <label className="text-sm font-medium">Departamentos</label>
            </div>
            <span className="font-bold text-lg">{departments}</span>
          </div>
          
          <Slider 
            value={[departments]} 
            min={1} 
            max={tier.maxDepartments} 
            step={1} 
            disabled={tier.maxDepartments <= 1} 
            onValueChange={(val) => setDepartments(val[0])}
            className="cursor-pointer"
          />
          
          <div className="flex justify-between text-xs text-slate-400">
            <span>1 incluido</span>
            {tier.extraDepartmentPrice > 0 ? (
              <span>+{tier.extraDepartmentPrice}€/extra</span>
            ) : (
              <span>Incluido</span>
            )}
          </div>
        </div>

        {/* Selector de Ubicaciones (si showLocationInput es true) */}
        {showLocationInput && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-500" />
                <label className="text-sm font-medium">Sedes / Locales</label>
              </div>
              <span className="font-bold text-lg">{locations}</span>
            </div>
            
            <Slider 
              value={[locations]} 
              min={1} 
              max={tier.maxLocations} 
              step={1} 
              disabled={tier.maxLocations <= 1}
              onValueChange={(val) => setLocations(val[0])}
              className="cursor-pointer"
            />
            
            <div className="flex justify-between text-xs text-slate-400">
              <span>1 incluida</span>
              {tier.extraLocationPrice > 0 && <span>+{tier.extraLocationPrice}€/extra</span>}
            </div>
          </div>
        )}

        {/* Resumen de Extras */}
        {(calculation.locationsCost > 0 || calculation.departmentsCost > 0 || calculation.messagesCost > 0) && (
          <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
            <div className="text-sm font-medium text-slate-600 mb-1">Extras aplicados:</div>
            
            {calculation.locationsCost > 0 && (
               <div className="flex justify-between text-sm">
                 <span>+ {locations - tier.includedLocations} Sedes extra</span>
                 <Badge variant="secondary">+€{calculation.locationsCost}</Badge>
               </div>
            )}
            
            {calculation.departmentsCost > 0 && (
               <div className="flex justify-between text-sm">
                 <span>+ {departments - tier.includedDepartments} Depts. extra</span>
                 <Badge variant="secondary">+€{calculation.departmentsCost}</Badge>
               </div>
            )}

            {calculation.messagesCost > 0 && (
               <div className="flex justify-between text-sm">
                 <span>+ {dailyMessages - tier.includedMessages} Mensajes extra</span>
                 <Badge variant="secondary">+€{calculation.messagesCost.toFixed(2)}</Badge>
               </div>
            )}
          </div>
        )}
        
        {/* Total Final */}
        <div className="flex justify-between items-center pt-4 mt-2 border-t border-dashed border-slate-300">
           <span className="font-bold text-slate-700">Total Mensual Estimado:</span>
           <span className="text-2xl font-bold text-primary">€{calculation.totalMonthly.toFixed(2)}</span>
        </div>

      </CardContent>
    </Card>
  );
}

// ✅ ESTO ES LO QUE ARREGLA TU ERROR:
// Exportación por defecto añadida para evitar errores de importación
export default DynamicPricingBar;