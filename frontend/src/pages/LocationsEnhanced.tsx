import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter'; 
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  Phone,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Building2,
  Zap,
  Info,
  Loader2,
  Calculator,
  Lock,
  ArrowUpCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pricingService, PRICING_TIERS, type PlanType } from '@/services/PricingService';
import { motion } from 'framer-motion';

// Validation schemas
const locationSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'La ciudad es requerida'),
  country: z.string().min(2, 'El país es requerido'),
  phone: z.string().optional(),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface LocationData { 
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  virtualNumber?: string;
  isActive: boolean;
}

export default function LocationsEnhanced() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationData | null>(null);
  const [deleteLocation, setDeleteLocation] = useState<LocationData | null>(null);
  const [numberDialogOpen, setNumberDialogOpen] = useState(false);
  const [assigningNumberLocation, setAssigningNumberLocation] = useState<LocationData | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState('34');

  // Fetch locations
  const { data: locations = [], isLoading } = useQuery<LocationData[]>({
    queryKey: ['/api/locations'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/locations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      return data.locations || [];
    },
    enabled: !!user,
  });

  const planType = (user?.planType as PlanType) || 'small';
  const currentTier = PRICING_TIERS.find(t => t.id === planType) || PRICING_TIERS[0];
  const isSmallPlan = planType === 'small';
  
  const locationCount = locations.length;
  const maxLocations = currentTier.maxLocations;
  const canAddMore = locationCount < maxLocations;

  const currentCalculation = pricingService.calculateMonthly(
    planType,
    currentTier.includedMessages,
    locationCount,
    1 
  );

  const nextLocationCalculation = pricingService.calculateMonthly(
    planType,
    currentTier.includedMessages,
    locationCount + 1,
    1
  );

  const additionalCost = nextLocationCalculation.totalMonthly - currentCalculation.totalMonthly;

  // Form
  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      country: 'España',
      phone: '',
    },
  });

  const createMutation = useMutation({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      toast({ title: 'Ubicación creada', description: 'La nueva ubicación se ha añadido correctamente' });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo crear la ubicación', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: LocationFormData }) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/locations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update location');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      toast({ title: 'Ubicación actualizada', description: 'Los cambios se han guardado correctamente' });
      setDialogOpen(false);
      setEditingLocation(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete location');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      toast({ title: 'Ubicación eliminada', description: 'La ubicación se ha eliminado correctamente' });
      setDeleteLocation(null);
    },
  });

  const generateNumberMutation = useMutation({
    mutationFn: async ({ locationId, countryCode }: { locationId: number; countryCode: string }) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/providers/generate-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ countryCode, locationId }),
      });
      if (!response.ok) throw new Error('Failed to generate number');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      toast({ title: 'Número generado', description: 'El número virtual se ha asignado correctamente' });
      setNumberDialogOpen(false);
      setAssigningNumberLocation(null);
    },
  });

  // Handlers
  const handleEdit = (location: LocationData) => {
    setEditingLocation(location);
    form.reset({
      name: location.name,
      address: location.address,
      city: location.city,
      country: location.country,
      phone: location.phone || '',
    });
    setDialogOpen(true);
  };

  const handleAssignNumber = (location: LocationData) => {
    setAssigningNumberLocation(location);
    setNumberDialogOpen(true);
  };

  const onSubmit = (data: LocationFormData) => {
    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleGenerateNumber = () => {
    if (!assigningNumberLocation) return;
    generateNumberMutation.mutate({
      locationId: assigningNumberLocation.id,
      countryCode: selectedCountryCode,
    });
  };

  return (
    <>
      <Helmet>
        <title>Establecimientos - UNMI</title>
      </Helmet>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-8 w-8 text-[#FF0000]" />
              Ubicaciones
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona tus establecimientos ({locationCount} de {isSmallPlan ? '1' : maxLocations})
            </p>
          </div>

          {/* ADD BUTTON LOGIC: Create or Upgrade */}
          {canAddMore ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingLocation(null); form.reset(); }} className="bg-[#FF0000] hover:bg-[#D32F2F]">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Ubicación
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingLocation ? 'Editar Ubicación' : 'Añadir Nueva Ubicación'}</DialogTitle>
                  <DialogDescription>
                    {isSmallPlan 
                      ? 'Tu plan actual incluye 1 ubicación.' 
                      : `Añadir una ubicación extra sumará +${currentTier.extraLocationPrice}€/mes a tu factura.`}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Ej: Tienda Centro" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input placeholder="Madrid" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="country" render={({ field }) => (
                        <FormItem><FormLabel>País</FormLabel><FormControl><Input placeholder="España" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input placeholder="Calle Principal 123" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Teléfono Físico (Opcional)</FormLabel><FormControl><Input placeholder="+34..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <DialogFooter>
                      <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#FF0000]">
                        {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Guardar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          ) : (
            // UPSELL BUTTON si alcanzó el límite
            <Button onClick={() => navigate('/plan')} className="bg-gray-900 text-white hover:bg-black">
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Mejorar Plan para añadir más
            </Button>
          )}
        </div>

        {/* --- CALCULADORA DE COSTES & UPSELL --- */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className={`border-2 ${isSmallPlan ? 'border-gray-100 bg-gray-50' : 'border-blue-100 bg-blue-50/30'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calculator className={`h-5 w-5 ${isSmallPlan ? 'text-gray-400' : 'text-blue-600'}`} />
                <CardTitle className="text-lg">Infraestructura y Costes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isSmallPlan ? (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Estás en el plan <span className="font-bold">Pequeña Empresa</span> (Limitado a 1 Ubicación).
                  </div>
                  <Button variant="link" onClick={() => navigate('/plan')} className="text-[#FF0000]">
                    Ver ventajas de UNMI Pro →
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Ubicaciones Activas</p>
                    <p className="text-2xl font-bold text-gray-900">{locationCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Coste Mensual Total</p>
                    <p className="text-2xl font-bold text-gray-900">€{currentCalculation.totalMonthly.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400">Incluye base + extras</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 uppercase font-bold">Coste por Nueva Sede</p>
                    <p className="text-2xl font-bold text-green-600">+€{currentTier.extraLocationPrice}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* --- GRID DE UBICACIONES --- */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl" />)}
          </div>
        ) : locations.length === 0 ? (
          <Card className="text-center py-16 border-dashed border-2">
            <CardContent>
              <div className="bg-red-50 p-4 rounded-full w-fit mx-auto mb-4">
                <Building2 className="h-8 w-8 text-[#FF0000]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Comienza tu configuración</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">Añade tu primera ubicación para asignarle un número virtual y empezar a recibir llamadas.</p>
              <Button onClick={() => setDialogOpen(true)} className="bg-[#FF0000]">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Ubicación
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((location, index) => (
              <motion.div key={location.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.1 }}>
                <Card className="hover:shadow-lg transition-all duration-300 border-gray-100 group">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="mt-1"><MapPin className="h-5 w-5 text-gray-400 group-hover:text-[#FF0000] transition-colors" /></div>
                        <div>
                          <CardTitle className="text-lg">{location.name}</CardTitle>
                          <CardDescription>{location.city}, {location.country}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={location.isActive ? 'default' : 'secondary'} className={location.isActive ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                        {location.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm">
                      <p className="text-gray-500 text-xs uppercase font-bold mb-1">Dirección</p>
                      <p className="text-gray-700 font-medium">{location.address}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase font-bold mb-1">Número Virtual (WhatsApp/Voz)</p>
                      {location.virtualNumber ? (
                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <Phone className="h-4 w-4 text-green-600" />
                          <span className="font-mono font-bold text-gray-800">{location.virtualNumber}</span>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleAssignNumber(location)} className="w-full border-dashed border-gray-300 text-gray-500 hover:text-[#FF0000] hover:border-[#FF0000]">
                          <Zap className="h-3 w-3 mr-2" /> Generar Número
                        </Button>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 border-t pt-4 bg-gray-50/50 rounded-b-xl">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(location)} className="flex-1 hover:text-blue-600"><Edit2 className="h-3 w-3 mr-2" /> Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteLocation(location)} className="flex-1 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-3 w-3 mr-2" /> Eliminar</Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}

            {/* TARJETA DE "AÑADIR MÁS" (Condicional) */}
            {canAddMore ? (
              <Card 
                className="border-2 border-dashed border-gray-200 hover:border-[#FF0000] hover:bg-red-50/10 cursor-pointer flex flex-col items-center justify-center min-h-[320px] transition-all group"
                onClick={() => setDialogOpen(true)}
              >
                <div className="p-4 bg-gray-100 rounded-full group-hover:bg-[#FF0000] transition-colors mb-4">
                  <Plus className="h-8 w-8 text-gray-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-gray-600 group-hover:text-[#FF0000]">Añadir Sede</h3>
                {!isSmallPlan && <p className="text-xs text-gray-400 mt-1">+30€/mes</p>}
              </Card>
            ) : (
               <Card 
                className="border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center min-h-[320px] opacity-75"
              >
                <div className="p-4 bg-gray-200 rounded-full mb-4">
                  <Lock className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-bold text-gray-500">Límite Alcanzado</h3>
                <p className="text-xs text-gray-400 mt-2 px-6 text-center">Tu plan actual no permite más ubicaciones.</p>
                <Button variant="link" onClick={() => navigate('/plan')} className="text-[#FF0000] mt-2">Mejorar Plan</Button>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* MODALES AUXILIARES (Sin cambios en lógica, solo visuales) */}
      <Dialog open={numberDialogOpen} onOpenChange={setNumberDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Asignar Número Virtual</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedCountryCode} onValueChange={setSelectedCountryCode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="34">🇪🇸 España (+34)</SelectItem>
                <SelectItem value="1">🇺🇸 Estados Unidos (+1)</SelectItem>
              </SelectContent>
            </Select>
            <Alert className="bg-blue-50 border-blue-100 text-blue-800"><Info className="h-4 w-4" /><AlertDescription>Este número servirá para WhatsApp y desvío de llamadas.</AlertDescription></Alert>
          </div>
          <DialogFooter>
            <Button onClick={handleGenerateNumber} disabled={generateNumberMutation.isPending} className="bg-[#FF0000]">
              {generateNumberMutation.isPending ? 'Generando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteLocation} onOpenChange={() => setDeleteLocation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Eliminar ubicación?</AlertDialogTitle><AlertDialogDescription>Esta acción es irreversible.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteLocation && deleteMutation.mutate(deleteLocation.id)} className="bg-red-600">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}