import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
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
  Map,
  Search,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PhoneNumber } from '@/shared/schema';
import { useTranslation } from 'react-i18next';

// Schema de validación
const locationSchema = z.object({
  name: z.string().min(1, 'locations.validation.nameRequired'),
  phoneNumber: z.string().optional(),
  address: z.string().min(5, 'locations.validation.addressMin').max(255),
  timezone: z.string().default('Europe/Madrid'),
  planType: z.enum(['templates', 'chatbots'], {
    required_error: 'locations.validation.planRequired',
  }),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface Location {
  id: number;
  userId: string;
  name: string;
  address?: string;
  phoneNumber?: string;
  phoneNumberId?: number;
  timezone?: string;
  businessHours?: any;
  isFirstLocation?: boolean;
}

export default function Locations() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editingPhoneNumberId, setEditingPhoneNumberId] = useState<number | null>(null);

  // Form
  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      address: '',
      phoneNumber: '',
      planType: 'templates',
      timezone: 'Europe/Madrid',
    },
  });

  const { data: credits } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/user', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      return data.user.credits || {};
    },
    enabled: !!user,
  });

  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/locations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      return (data.locations || []).map((loc: any) => ({
        ...loc,
        phoneNumber: loc.phone?.number || '',
        phoneNumberId: loc.phone?.id || null,
      }));
    },
    enabled: !!user,
  });

  const { data: phoneNumbers = [] } = useQuery<PhoneNumber[]>({
    queryKey: ['/api/phone-numbers'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/phone-numbers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch phone numbers');
      const data = await res.json();
      return data.phoneNumbers || [];
    },
    enabled: !!user,
  });

  const locationsWithPhones = locations.map((loc) => {
    const phone = phoneNumbers.find((p) => p.locationId === loc.id);
    return {
      ...loc,
      timezone: loc.timezone === 'UTC' ? 'Europe/Madrid' : loc.timezone,
      phoneNumber: phone?.number || '',
      phoneNumberId: phone?.id || undefined,
    };
  });

  const token = localStorage.getItem('accessToken');

  const createMutation = useMutation({
    mutationFn: async (data: LocationFormData) => {
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
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({ title: t('locations.toast.created.title'), description: t('locations.toast.created.description') });
      setDialogOpen(false);
      form.reset();
    },
  });

  const editMutation = useMutation({
    mutationFn: async (data: LocationFormData) => {
      const response = await fetch(`/api/locations/${editingLocation?.id}`, {
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
      toast({ title: t('locations.toast.updated.title'), description: t('locations.toast.updated.description') });
      setDialogOpen(false);
      setEditingLocation(null);
    },
  });

  const onSubmit = (data: LocationFormData) => {
    const payload: any = { name: data.name, address: data.address, planType: data.planType };
    if (editingLocation) editMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  return (
    <>
      <Helmet>
        <title>{t('locations.title')} - UNMI</title>
      </Helmet>

      <div className="flex flex-col gap-y-8 pb-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
              <MapPin className="h-6 w-6 text-[#003366]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {t('locations.title')}
              </h2>
              <p className="text-sm font-medium text-slate-400">Gestiona tus sedes y puntos de venta</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar sede..." className="rounded-2xl border-none shadow-sm h-12 pl-11 bg-white w-64" />
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl bg-[#003366] hover:bg-blue-900 text-white h-12 px-6 font-bold shadow-lg shadow-blue-900/20">
                  <Plus className="h-4 w-4 mr-2" /> {t('locations.new')}
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] border-none p-10">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-[#003366]">{editingLocation ? t('locations.edit') : t('locations.create')}</DialogTitle>
                  <DialogDescription>{editingLocation ? t('locations.dialog.editDesc') : t('locations.dialog.createDesc')}</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('locations.form.name')}</FormLabel>
                        <FormControl><Input placeholder={t('locations.form.namePlaceholder')} {...field} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('locations.form.address')}</FormLabel>
                        <FormControl><Input placeholder={t('locations.form.addressPlaceholder')} {...field} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="planType" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('locations.form.planType')}</FormLabel>
                        <FormControl>
                          <select {...field} className="w-full h-12 rounded-2xl bg-slate-50 border-none font-bold px-4 text-sm outline-none">
                            <option value="templates">Templates {credits?.templates > 0 ? `(${credits.templates} disp.)` : '(0 disp.)'}</option>
                            <option value="chatbots">Chatbots {credits?.chatbots > 0 ? `(${credits.chatbots} disp.)` : '(0 disp.)'}</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 rounded-2xl h-12 font-bold">Cancelar</Button>
                      <Button type="submit" className="flex-1 rounded-2xl h-12 bg-[#003366] text-white font-bold">{editingLocation ? 'Guardar' : 'Crear Sede'}</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Locations Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-64 bg-white rounded-[2.5rem]" />
            ))}
          </div>
        ) : locations.length === 0 ? (
          <Card className="rounded-[2.5rem] border-none bg-white py-24 shadow-sm text-center">
            <Map className="h-20 w-20 mx-auto text-slate-100 mb-6" />
            <h3 className="text-2xl font-black text-slate-900 mb-2">{t('locations.noLocations')}</h3>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">{t('locations.firstLocation')}</p>
            <Button onClick={() => setDialogOpen(true)} className="rounded-2xl bg-[#003366] text-white h-14 px-10 font-bold text-lg shadow-xl shadow-blue-900/20">
              {t('locations.createFirstLocation')}
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {locationsWithPhones.map((location) => (
              <Card key={location.id} className="rounded-[2.5rem] border-none bg-white p-8 shadow-sm transition-hover hover:shadow-md group">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#003366] group-hover:bg-[#003366] group-hover:text-white transition-colors">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight">{location.name}</h3>
                      {location.isFirstLocation && (
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sede Principal</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                    <MapPin className="h-5 w-5 text-slate-300" />
                    <span className="line-clamp-1">{location.address || 'Sin dirección'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                    <Phone className="h-5 w-5 text-slate-300" />
                    <span className="text-slate-900 font-bold">{location.phoneNumber || 'Sin número'}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{location.timezone}</span>
                  <Button
                    variant="ghost"
                    className="rounded-xl h-10 px-4 font-bold text-[#003366] hover:bg-slate-50"
                    onClick={() => {
                      setEditingLocation({ ...location, phoneNumberId: location.phoneNumberId ?? undefined });
                      setEditingPhoneNumberId(location.phoneNumberId || null);
                      form.reset({ name: location.name, address: location.address || '', phoneNumber: location.phoneNumber || '', planType: 'templates', timezone: location.timezone || 'Europe/Madrid' });
                      setDialogOpen(true);
                    }}
                  >
                    Configurar <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        {locations.length > 0 && (
          <div className="bg-[#003366] rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-blue-900/20">
            <div className="text-center md:text-left">
              <h4 className="text-2xl font-black text-white mb-2 italic">¿Necesitas más sedes?</h4>
              <p className="text-blue-100 font-medium opacity-80">Amplía tu plan para gestionar múltiples establecimientos desde un solo panel.</p>
            </div>
            <Link href="/plan" className="bg-white text-[#003366] h-14 px-8 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg hover:bg-blue-50 transition-colors whitespace-nowrap">
              Mejorar Plan
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
