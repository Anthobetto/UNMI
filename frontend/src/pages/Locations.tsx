/**
 * Locations Page - Gestión de ubicaciones
 * Multi-location support para empresas
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Plus,
  Building2,
  Clock,
  Phone,
  Edit2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Schema de validación
const locationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres').max(255),
  timezone: z.string().default('Europe/Madrid'),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface Location {
  id: number;
  userId: string;
  name: string;
  address?: string;
  timezone?: string;
  businessHours?: any;
  isFirstLocation?: boolean;
}

export default function Locations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // Queries
  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/locations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      return data.locations || [];
    },
    enabled: !!user,
  });

  // Form
  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      address: '',
      timezone: 'Europe/Madrid',
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
        description: 'La ubicación se ha creado correctamente',
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

  const onSubmit = (data: LocationFormData) => {
    createMutation.mutate(data);
  };

  return (
    <>
      <Helmet>
        <title>Ubicaciones - UNMI</title>
        <meta name="description" content="Gestiona las ubicaciones de tu negocio" />
      </Helmet>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ubicaciones</h1>
            <p className="text-gray-600 mt-1">
              Gestiona las ubicaciones de tu negocio
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingLocation(null); form.reset(); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Ubicación
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Ubicación</DialogTitle>
                <DialogDescription>
                  Agrega una nueva ubicación para gestionar llamadas y mensajes
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Ubicación</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Tienda Centro" {...field} />
                        </FormControl>
                        <FormDescription>
                          Un nombre descriptivo para identificar la ubicación
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input placeholder="Calle Principal 123, Madrid" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zona Horaria</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly />
                        </FormControl>
                        <FormDescription>
                          Se usa para programar mensajes y horarios
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createMutation.isPending}
                    >
                      Crear Ubicación
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Locations Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : locations.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No hay ubicaciones aún</h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                Crea tu primera ubicación para comenzar a recibir y gestionar llamadas
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Ubicación
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => (
              <Card key={location.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{location.name}</CardTitle>
                    </div>
                    {location.isFirstLocation && (
                      <Badge variant="secondary">Principal</Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-start gap-2 mt-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{location.address || 'Sin dirección'}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{location.timezone || 'Europe/Madrid'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>0 números configurados</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        {locations.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium">💡 Siguiente Paso</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                Ahora puedes configurar números de teléfono para cada ubicación y comenzar a recibir llamadas.
                Los templates y reglas de enrutamiento se pueden asignar por ubicación.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}



