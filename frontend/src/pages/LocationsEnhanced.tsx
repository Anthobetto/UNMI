/**
 * Locations Enhanced - Full CRUD + Virtual Number Manager + Upsells
 * 
 * Features:
 * - Complete CRUD for locations
 * - Virtual number assignment per location
 * - Inline pricing calculator for additional locations
 * - Upsell CTAs throughout
 * - Bundle discount incentives
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  TrendingUp,
  Building2,
  Zap,
  CheckCircle2,
  Info,
  Loader2,
  Calculator,
  Gift,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pricingService, PRICING_TIERS, type PricingTier } from '@/services/PricingService';
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

interface Location {
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deleteLocation, setDeleteLocation] = useState<Location | null>(null);
  const [numberDialogOpen, setNumberDialogOpen] = useState(false);
  const [assigningNumberLocation, setAssigningNumberLocation] = useState<Location | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState('34');

  // Fetch locations
  const { data: locations = [], isLoading } = useQuery<Location[]>({
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

  // Get user's current plan
  const currentTier = user?.planType === 'chatbots'
    ? PRICING_TIERS[1]
    : PRICING_TIERS[0];

  // Calculate pricing for additional locations
  const locationCount = locations.length;
  const calculation = pricingService.calculatePrice(currentTier.id, 15, locationCount);
  const nextLocationCalculation = pricingService.calculatePrice(currentTier.id, 15, locationCount + 1);
  const additionalCost = nextLocationCalculation.totalMonthly - calculation.totalMonthly;

  // Bundle discount check
  const hasBundleDiscount = locationCount >= 2; // 3+ locations get discount
  const willGetDiscount = locationCount === 2; // Adding 3rd location triggers discount

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

  // Mutations
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
      toast({
        title: 'Ubicación creada',
        description: 'La nueva ubicación se ha añadido correctamente',
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo crear la ubicación',
        variant: 'destructive',
      });
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
      toast({
        title: 'Ubicación actualizada',
        description: 'Los cambios se han guardado correctamente',
      });
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
      toast({
        title: 'Ubicación eliminada',
        description: 'La ubicación se ha eliminado correctamente',
      });
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
      toast({
        title: 'Número generado',
        description: 'El número virtual se ha asignado correctamente',
      });
      setNumberDialogOpen(false);
      setAssigningNumberLocation(null);
    },
  });

  // Handlers
  const handleEdit = (location: Location) => {
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

  const handleAssignNumber = (location: Location) => {
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
        <meta name="description" content="Gestiona tus establecimientos y números virtuales" />
      </Helmet>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              Ubicaciones
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona tus establecimientos y números virtuales
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingLocation(null); form.reset(); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Ubicación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingLocation ? 'Editar Ubicación' : 'Añadir Nueva Ubicación'}
                </DialogTitle>
                <DialogDescription>
                  {editingLocation
                    ? 'Modifica los detalles de la ubicación'
                    : 'Añade un nuevo establecimiento a tu cuenta'}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setDialogOpen(false); setEditingLocation(null); }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {(createMutation.isPending || updateMutation.isPending) ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        editingLocation ? 'Guardar Cambios' : 'Crear Ubicación'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pricing Calculator Card (Upsell) */}
        {locationCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-full">
                      <Calculator className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Calculadora de Costes</CardTitle>
                      <CardDescription>
                        Costo actual y previsión de nuevas ubicaciones
                      </CardDescription>
                    </div>
                  </div>
                  {willGetDiscount && (
                    <Badge className="bg-green-600">
                      <Gift className="mr-1 h-3 w-3" />
                      ¡Próximo descuento!
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-1">Ubicaciones Actuales</div>
                    <div className="text-2xl font-bold text-primary">{locationCount}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Plan: {currentTier.name}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-1">Coste Mensual Actual</div>
                    <div className="text-2xl font-bold">€{calculation.totalMonthly.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Base + ubicaciones
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-1">Coste por Nueva Ubicación</div>
                    <div className="text-2xl font-bold text-green-600">
                      +€{additionalCost.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Por mes
                    </div>
                  </div>
                </div>

                {/* Upsell CTA */}
                {currentTier.id === 'templetes' && locationCount >= 1 && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <AlertDescription>
                      <strong>💡 Tip:</strong> Con el plan Professional puedes añadir hasta 3 ubicaciones sin coste adicional.
                      <Button variant="link" className="ml-2 p-0 h-auto" asChild>
                        <a href="/plan">Ver planes →</a>
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {willGetDiscount && (
                  <Alert className="bg-green-50 border-green-200">
                    <Gift className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <strong>🎉 ¡Próximo descuento!</strong> Al añadir tu 3ª ubicación, obtendrás un 20% de descuento en ubicaciones adicionales.
                    </AlertDescription>
                  </Alert>
                )}

                {hasBundleDiscount && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <strong>✅ Descuento activo:</strong> Tienes un 20% de descuento en ubicaciones adicionales por tener {locationCount} ubicaciones.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Locations Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : locations.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No hay ubicaciones aún</h3>
              <p className="text-gray-600 mb-4">
                Añade tu primera ubicación para comenzar a gestionar llamadas
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Primera Ubicación
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((location, index) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                        <div>
                          <CardTitle className="text-lg">{location.name}</CardTitle>
                          <CardDescription>{location.city}, {location.country}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={location.isActive ? 'default' : 'secondary'}>
                        {location.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-3">
                    <div className="text-sm">
                      <div className="text-muted-foreground mb-1">Dirección</div>
                      <div>{location.address}</div>
                    </div>

                    {location.phone && (
                      <div className="text-sm">
                        <div className="text-muted-foreground mb-1">Teléfono</div>
                        <div>{location.phone}</div>
                      </div>
                    )}

                    <div className="text-sm">
                      <div className="text-muted-foreground mb-1">Número Virtual</div>
                      {location.virtualNumber ? (
                        <div className="font-mono flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-600" />
                          {location.virtualNumber}
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignNumber(location)}
                          className="mt-1"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Asignar Número
                        </Button>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-2 border-t pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(location)}
                      className="flex-1"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteLocation(location)}
                      className="flex-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Eliminar
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}

            {/* Add Location CTA Card */}
            <Card className="border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer h-full flex items-center justify-center min-h-[300px]" onClick={() => setDialogOpen(true)}>
              <CardContent className="text-center py-8">
                <div className="p-4 bg-primary/10 rounded-full mx-auto w-fit mb-4">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Añadir Ubicación</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Gestiona más establecimientos
                </p>
                <div className="text-xs text-muted-foreground">
                  +€{additionalCost.toFixed(2)}/mes
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upsell Banner (Bottom) */}
        {locations.length > 0 && locations.length < 5 && (
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-white border-0">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Escala tu Negocio</h3>
                    <p className="text-sm opacity-90">
                      Añade más ubicaciones y alcanza a más clientes. Con cada ubicación, aumenta tu potencial de recuperación.
                    </p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Ubicación
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Virtual Number Assignment Dialog */}
      <Dialog open={numberDialogOpen} onOpenChange={setNumberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Número Virtual</DialogTitle>
            <DialogDescription>
              Genera un número virtual para <strong>{assigningNumberLocation?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <FormLabel>Código de País</FormLabel>
              <Select value={selectedCountryCode} onValueChange={setSelectedCountryCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="34">🇪🇸 España (+34)</SelectItem>
                  <SelectItem value="1">🇺🇸 Estados Unidos (+1)</SelectItem>
                  <SelectItem value="44">🇬🇧 Reino Unido (+44)</SelectItem>
                  <SelectItem value="33">🇫🇷 Francia (+33)</SelectItem>
                  <SelectItem value="49">🇩🇪 Alemania (+49)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Se generará un número virtual aleatorio para esta ubicación.
                Este número se usará para las llamadas perdidas y mensajes de WhatsApp.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNumberDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleGenerateNumber}
              disabled={generateNumberMutation.isPending}
            >
              {generateNumberMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Generar Número
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteLocation} onOpenChange={() => setDeleteLocation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La ubicación "{deleteLocation?.name}" será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLocation && deleteMutation.mutate(deleteLocation.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

