/**
 * LocationOnboarding - Post-Registration Wizard
 * 
 * Multi-step wizard for new users to:
 * 1. Add their first location (physical store)
 * 2. Generate/assign virtual phone number
 * 3. Select plan with dynamic pricing
 * 4. Complete setup and go to dashboard
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  Phone,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Building2,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pricingService, PRICING_TIERS, type PricingTier, type PricingCalculation } from '@/services/PricingService';
import { DynamicPricingBar } from './DynamicPricingBar';

// Validation schemas
const locationSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  phone: z.string().optional(),
  city: z.string().min(2, 'La ciudad es requerida'),
  country: z.string().min(2, 'El país es requerido'),
});

type LocationFormData = z.infer<typeof locationSchema>;

const virtualNumberSchema = z.object({
  countryCode: z.string().default('34'),
  generateNew: z.boolean().default(true),
  customNumber: z.string().optional(),
});

type VirtualNumberFormData = z.infer<typeof virtualNumberSchema>;

interface LocationOnboardingProps {
  onComplete: () => void;
  userId: string;
}

export const LocationOnboarding: React.FC<LocationOnboardingProps> = ({ onComplete, userId }) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [locationData, setLocationData] = useState<LocationFormData | null>(null);
  const [virtualNumber, setVirtualNumber] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<PricingTier>(PRICING_TIERS[1]); // Default Professional
  const [pricingCalculation, setPricingCalculation] = useState<PricingCalculation | null>(null);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  // Forms
  const locationForm = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      city: '',
      country: 'España',
    },
  });

  const numberForm = useForm<VirtualNumberFormData>({
    resolver: zodResolver(virtualNumberSchema),
    defaultValues: {
      countryCode: '34',
      generateNew: true,
    },
  });

  // Mutations
  const createLocationMutation = useMutation({
    mutationFn: async (data: LocationFormData) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create location');
      return response.json();
    },
  });

  const generateNumberMutation = useMutation({
    mutationFn: async (countryCode: string) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/providers/generate-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ countryCode }),
      });
      if (!response.ok) throw new Error('Failed to generate number');
      return response.json();
    },
  });

  const completePlanMutation = useMutation({
    mutationFn: async () => {
      // Mock Stripe checkout session creation
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tier: selectedTier.id,
          locations: 1,
          dailyMessages: pricingCalculation?.dailyMessages || 0,
          totalMonthly: pricingCalculation?.totalMonthly || 0,
        }),
      });
      if (!response.ok) throw new Error('Failed to create checkout session');
      return response.json();
    },
  });

  // Step 1: Location Details
  const handleLocationSubmit = (data: LocationFormData) => {
    setLocationData(data);
    setCurrentStep(2);
    toast({
      title: 'Ubicación guardada',
      description: 'Ahora vamos a asignar un número virtual',
    });
  };

  // Step 2: Virtual Number
  const handleNumberSubmit = async (data: VirtualNumberFormData) => {
    if (data.generateNew) {
      try {
        const result = await generateNumberMutation.mutateAsync(data.countryCode);
        if (result.success && result.number) {
          setVirtualNumber(result.number);
          setCurrentStep(3);
          toast({
            title: 'Número generado',
            description: `Tu número virtual: ${result.number}`,
          });
        } else {
          throw new Error(result.error || 'Failed to generate number');
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      setVirtualNumber(data.customNumber || null);
      setCurrentStep(3);
    }
  };

  // Step 3: Plan Selection (handled by DynamicPricingBar)
  const handlePlanNext = () => {
    if (!pricingCalculation) {
      toast({
        title: 'Configura tu plan',
        description: 'Ajusta los mensajes diarios para continuar',
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep(4);
  };

  // Step 4: Complete Setup
  const handleComplete = async () => {
    try {
      // 1. Create location
      const locationResult = await createLocationMutation.mutateAsync(locationData!);

      // 2. Complete plan setup (mock Stripe)
      await completePlanMutation.mutateAsync();

      // 3. Mark onboarding as complete
      toast({
        title: '¡Configuración completada!',
        description: 'Tu cuenta está lista. Redirigiendo al dashboard...',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });

      setTimeout(() => {
        onComplete();
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="text-sm">
              Paso {currentStep} de {totalSteps}
            </Badge>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% completado</span>
          </div>
          <Progress value={progress} className="mb-4" />
          <CardTitle className="text-3xl flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            Configuración Inicial
          </CardTitle>
          <CardDescription>
            Vamos a configurar tu primera ubicación y número virtual
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {/* Step 1: Location Details */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Tu Primera Ubicación</h3>
                    <p className="text-sm text-muted-foreground">
                      Añade los datos de tu tienda o establecimiento principal
                    </p>
                  </div>
                </div>

                <Form {...locationForm}>
                  <form onSubmit={locationForm.handleSubmit(handleLocationSubmit)} className="space-y-4">
                    <FormField
                      control={locationForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Establecimiento</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Tienda Centro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={locationForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ciudad</FormLabel>
                            <FormControl>
                              <Input placeholder="Madrid" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={locationForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>País</FormLabel>
                            <FormControl>
                              <Input placeholder="España" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={locationForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección</FormLabel>
                          <FormControl>
                            <Input placeholder="Calle Principal 123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={locationForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono (Opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="+34 612 34 56 78" {...field} />
                          </FormControl>
                          <FormDescription>
                            Tu número de teléfono principal (no virtual)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" size="lg">
                      Continuar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              </motion.div>
            )}

            {/* Step 2: Virtual Number */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Número Virtual</h3>
                    <p className="text-sm text-muted-foreground">
                      Genera un número para recibir llamadas y mensajes
                    </p>
                  </div>
                </div>

                <Alert className="mb-6">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Este número virtual se usará para las llamadas perdidas y mensajes de WhatsApp de <strong>{locationData?.name}</strong>
                  </AlertDescription>
                </Alert>

                <Form {...numberForm}>
                  <form onSubmit={numberForm.handleSubmit(handleNumberSubmit)} className="space-y-4">
                    <FormField
                      control={numberForm.control}
                      name="countryCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código de País</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="34">🇪🇸 España (+34)</SelectItem>
                              <SelectItem value="1">🇺🇸 Estados Unidos (+1)</SelectItem>
                              <SelectItem value="44">🇬🇧 Reino Unido (+44)</SelectItem>
                              <SelectItem value="33">🇫🇷 Francia (+33)</SelectItem>
                              <SelectItem value="49">🇩🇪 Alemania (+49)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={numberForm.control}
                      name="generateNew"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Método de Asignación</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value === 'true')}
                            value={field.value ? 'true' : 'false'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="true">Generar número nuevo</SelectItem>
                              <SelectItem value="false">Usar número existente</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Recomendamos generar un número nuevo para mejor control
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {!numberForm.watch('generateNew') && (
                      <FormField
                        control={numberForm.control}
                        name="customNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número Personalizado</FormLabel>
                            <FormControl>
                              <Input placeholder="+34612345678" {...field} />
                            </FormControl>
                            <FormDescription>
                              Introduce tu número existente
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Atrás
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1"
                        disabled={generateNumberMutation.isPending}
                      >
                        {generateNumberMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generando...
                          </>
                        ) : (
                          <>
                            Continuar
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </motion.div>
            )}

            {/* Step 3: Plan Selection */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Selecciona tu Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      Configura los mensajes diarios según tus necesidades
                    </p>
                  </div>
                </div>

                {/* Tier Selector */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {PRICING_TIERS.map((tier) => (
                    <Button
                      key={tier.id}
                      variant={selectedTier.id === tier.id ? 'default' : 'outline'}
                      onClick={() => setSelectedTier(tier)}
                      className="h-auto py-3 flex flex-col gap-1"
                    >
                      <span className="font-semibold">{tier.name}</span>
                      <span className="text-xs opacity-80">€{tier.basePrice}/mes</span>
                    </Button>
                  ))}
                </div>

                <DynamicPricingBar
                  tier={selectedTier}
                  locations={1}
                  onPriceChange={setPricingCalculation}
                  showLocationInput={false}
                />

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Atrás
                  </Button>
                  <Button onClick={handlePlanNext} className="flex-1">
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Review & Complete */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">¡Casi listo!</h3>
                    <p className="text-sm text-muted-foreground">
                      Revisa tu configuración antes de comenzar
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Location Summary */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Ubicación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <div><strong>Nombre:</strong> {locationData?.name}</div>
                      <div><strong>Dirección:</strong> {locationData?.address}</div>
                      <div><strong>Ciudad:</strong> {locationData?.city}, {locationData?.country}</div>
                      {locationData?.phone && <div><strong>Teléfono:</strong> {locationData.phone}</div>}
                    </CardContent>
                  </Card>

                  {/* Virtual Number Summary */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Número Virtual
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div className="font-mono text-lg">{virtualNumber}</div>
                    </CardContent>
                  </Card>

                  {/* Plan Summary */}
                  <Card className="border-2 border-primary">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Plan Seleccionado
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Plan:</span>
                        <strong>{selectedTier.name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Mensajes diarios:</span>
                        <strong>{pricingCalculation?.dailyMessages}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Ubicaciones:</span>
                        <strong>1</strong>
                      </div>
                      <div className="pt-2 border-t flex justify-between text-lg font-bold text-primary">
                        <span>Total mensual:</span>
                        <span>€{pricingCalculation?.totalMonthly.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Alert className="mb-6">
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    <strong>14 días de prueba gratis</strong> - No se te cobrará hasta que finalice el periodo de prueba
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Atrás
                  </Button>
                  <Button 
                    onClick={handleComplete}
                    className="flex-1"
                    size="lg"
                    disabled={createLocationMutation.isPending || completePlanMutation.isPending}
                  >
                    {(createLocationMutation.isPending || completePlanMutation.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Completando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Completar Configuración
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

