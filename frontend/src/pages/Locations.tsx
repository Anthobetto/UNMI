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
import { PhoneNumber } from '../../../backend/shared/schema';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';

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

  // ====================
  // Queries
  // ====================

  const { data: credits } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/user', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();

      console.log('👤 User data:', data.user); // Para debugging
      console.log('💳 Credits:', data.user.credits); // Para debugging

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

  // ====================
  // LOCATIONS & PHONE NUMBERS
  // ====================
  const locationsWithPhones = locations.map((loc) => {
    const phone = phoneNumbers.find((p) => p.locationId === loc.id);
    return {
      ...loc,
      timezone: loc.timezone === 'UTC' ? 'Europe/Madrid' : loc.timezone,
      phoneNumber: phone?.number || '',
      phoneNumberId: phone?.id || undefined,
    };
  });

  // ==============================
  // MUTATIONS
  // ==============================

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
      toast({
        title: t('locations.toast.created.title'),
        description: t('locations.toast.created.description'),
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: t('locations.toast.error.title'),
        description: t('locations.toast.error.description'),
        variant: 'destructive',
      });
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
      toast({
        title: t('locations.toast.updated.title'),
        description: t('locations.toast.updated.description'),
      });
      setDialogOpen(false);
      setEditingLocation(null);
    },
    onError: () => {
      toast({
        title: t('locations.toast.error.title'),
        description: t('locations.toast.error.description'),
        variant: 'destructive',
      });
    },
  });

  const createPhoneMutation = useMutation({
    mutationFn: async (data: Partial<PhoneNumber>) => {
      const response = await fetch('/api/phone-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create phone number');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/phone-numbers'] });
      toast({
        title: t('locations.toast.phoneCreated.title'),
        description: t('locations.toast.phoneCreated.description'),
      });
    },
    onError: () => {
      toast({
        title: t('locations.toast.error.title'),
        description: t('locations.toast.error.description'),
        variant: 'destructive',
      });
    },
  });

  const editPhoneMutation = useMutation({
    mutationFn: (data: Partial<PhoneNumber> & { id: number }) =>
      fetch(`/api/phone-numbers/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/phone-numbers'] }),
  });

  const onSubmit = (data: LocationFormData) => {
    const payload: any = {
      name: data.name,
      address: data.address,
      planType: data.planType,
    };

    if (data.phoneNumber && /^\+?[1-9]\d{1,14}$/.test(data.phoneNumber)) {
      payload.phoneNumber = data.phoneNumber;
      payload.phoneType = 'both';
    }

    if (editingLocation) {
      editMutation.mutate(payload, {
        onSuccess: () => {
          if (data.phoneNumber) {
            if (editingPhoneNumberId) {
              editPhoneMutation.mutate({
                id: editingPhoneNumberId,
                number: data.phoneNumber,
                type: 'mobile',
                channel: 'both',
                active: true,
                forwardingEnabled: true,
              });
            } else {
              createPhoneMutation.mutate({
                userId: user!.id,
                locationId: editingLocation.id,
                number: data.phoneNumber,
                type: 'mobile',
                channel: 'both',
                active: true,
                forwardingEnabled: true,
              });
            }
          }
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: (res: { location: Location }) => {
          if (data.phoneNumber) {
            createPhoneMutation.mutate({
              userId: user!.id,
              locationId: res.location.id,
              number: data.phoneNumber,
              type: 'mobile',
              channel: 'both',
              active: true,
              forwardingEnabled: true,
            });
          }
        },
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('locations.title')} - UNMI</title>
        <meta name="description" content={t('locations.subtitle')} />
      </Helmet>

      <div className="p-6 space-y-6 mt-12">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('locations.title')}</h1>
            <p className="text-gray-600 mt-1">{t('locations.subtitle')}</p>
          </div>

          <div className="flex items-center space-x-2">
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);

                if (open && !editingLocation) {
                  setEditingPhoneNumberId(null);
                  form.reset({
                    name: '',
                    address: '',
                    phoneNumber: '',
                    planType: 'templates',
                    timezone: 'Europe/Madrid',
                  });
                }

                if (!open) {
                  setEditingLocation(null);
                  setEditingPhoneNumberId(null);
                  form.reset({
                    name: '',
                    address: '',
                    phoneNumber: '',
                    planType: 'templates',
                    timezone: 'Europe/Madrid',
                  });
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('locations.new')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingLocation ? t('locations.edit') : t('locations.create')}
                  </DialogTitle>
                  <DialogDescription>
                    {editingLocation
                      ? t('locations.dialog.editDesc')
                      : t('locations.dialog.createDesc')}
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('locations.form.name')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('locations.form.namePlaceholder')} {...field} />
                          </FormControl>
                          <FormDescription>{t('locations.form.nameHelp')}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('locations.form.address')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('locations.form.addressPlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('locations.form.phone')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('locations.form.phonePlaceholder')} {...field} />
                          </FormControl>
                          <FormDescription>{t('locations.form.phoneHelp')}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="planType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('locations.form.planType')}</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="templates">
                                Templates {credits?.templates > 0 ? `(${credits.templates} ${t('locations.form.creditsAvailable')})` : `(0 ${t('locations.form.creditsAvailable')})`}
                              </option>
                              <option value="chatbots">
                                Chatbots {credits?.chatbots > 0 ? `(${credits.chatbots} ${t('locations.form.creditsAvailable')})` : `(0 ${t('locations.form.creditsAvailable')})`}
                              </option>
                            </select>
                          </FormControl>
                          <FormDescription>{t('locations.form.planTypeHelp')}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('locations.form.timezone')}</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly />
                          </FormControl>
                          <FormDescription>{t('locations.form.timezoneHelp')}</FormDescription>
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
                        {t('locations.cancel')}
                      </Button>
                      <Button type="submit" disabled={createMutation.isPending || editMutation.isPending}>
                        {editingLocation ? t('locations.saveChanges') : t('locations.createLocation')}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <LanguageSelector />
          </div>
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
              <h3 className="text-lg font-semibold mb-2">{t('locations.noLocations')}</h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                {t('locations.firstLocation')}
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('locations.createFirstLocation')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locationsWithPhones.map((location) => (
              <Card key={location.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{location.name}</CardTitle>
                    </div>
                    {location.isFirstLocation && (
                      <Badge variant="secondary">{t('locations.details.main')}</Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-start gap-2 mt-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{location.address || t('locations.details.noAddress')}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{location.timezone === 'UTC' ? 'Europe/Madrid' : location.timezone}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{location.phoneNumber || t('locations.details.noNumber')} </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setEditingLocation({
                        ...location,
                        phoneNumberId: location.phoneNumberId ?? undefined,
                      });
                      setEditingPhoneNumberId(location.phoneNumberId || null);
                      form.reset({
                        name: location.name,
                        address: location.address || '',
                        phoneNumber: location.phoneNumber || '',
                        planType: 'templates',
                        timezone: location.timezone || 'Europe/Madrid',
                      });
                      setDialogOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    {t('locations.details.configure')}
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
              <CardTitle className="text-sm font-medium">💡 {t('locations.nextStep.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                {t('locations.nextStep.desc')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}