/**
 * Templates Page - CRUD de plantillas de mensajes
 * Conditional access según plan del usuario
 * Integración con backend y WhatsApp/SMS
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/use-auth';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  MessageSquare,
  Phone,
  Clock,
  Copy,
  Lock,
  Send,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

// Schema de validación
const templateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  content: z.string().min(10, 'El contenido debe tener al menos 10 caracteres').max(1000),
  type: z.enum(['missed_call', 'after_hours', 'welcome', 'follow_up', 'appointment']),
  channel: z.enum(['sms', 'whatsapp', 'both']),
  locationId: z.number().nullable().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface Template {
  id: number;
  userId: string;
  locationId?: number;
  name: string;
  content: string;
  type: string;
  channel: string;
  variables?: Record<string, string>;
}

interface Location {
  id: number;
  name: string;
}

export default function Templates() {
  const { user, hasAccessToSection } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<Template | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendingTemplate, setSendingTemplate] = useState<Template | null>(null);
  const [recipientNumber, setRecipientNumber] = useState('');

  // Check access
  const hasAccess = hasAccessToSection('templates');

  // Queries
  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      return data.templates || [];
    },
    enabled: !!user && hasAccess,
  });

  const { data: locations = [] } = useQuery<Location[]>({
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
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      content: '',
      type: 'missed_call',
      channel: 'both',
      locationId: null,
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: 'Template creado',
        description: 'El template se ha creado correctamente',
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo crear el template',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TemplateFormData }) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: 'Template actualizado',
        description: 'Los cambios se han guardado correctamente',
      });
      setDialogOpen(false);
      setEditingTemplate(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el template',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete template');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: 'Template eliminado',
        description: 'El template se ha eliminado correctamente',
      });
      setDeleteTemplate(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el template',
        variant: 'destructive',
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async ({ templateId, recipientNumber }: { templateId: string; recipientNumber: string }) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/flow/send-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          templateId,
          userId: user?.id,
          locationId: sendingTemplate?.locationId || 0,
          recipientNumber,
          sendImmediately: true,
        }),
      });
      if (!response.ok) throw new Error('Failed to send template');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Template enviado',
        description: `Mensaje enviado correctamente a ${recipientNumber}`,
      });
      setSendDialogOpen(false);
      setSendingTemplate(null);
      setRecipientNumber('');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el template',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TemplateFormData) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      content: template.content,
      type: template.type as any,
      channel: template.channel as any,
      locationId: template.locationId || null,
    });
    setDialogOpen(true);
  };

  const handleCopy = (template: Template) => {
    navigator.clipboard.writeText(template.content);
    toast({
      title: 'Copiado',
      description: 'El contenido del template se ha copiado al portapapeles',
    });
  };

  const handleSend = (template: Template) => {
    setSendingTemplate(template);
    setSendDialogOpen(true);
  };

  const handleSendConfirm = () => {
    if (!sendingTemplate || !recipientNumber) return;
    sendMutation.mutate({ 
      templateId: sendingTemplate.id.toString(), 
      recipientNumber 
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'missed_call': return <Phone className="h-4 w-4" />;
      case 'after_hours': return <Clock className="h-4 w-4" />;
      case 'welcome': return <MessageSquare className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeName = (type: string) => {
    const names: Record<string, string> = {
      missed_call: 'Llamada Perdida',
      after_hours: 'Fuera de Horario',
      welcome: 'Bienvenida',
      follow_up: 'Seguimiento',
      appointment: 'Cita',
    };
    return names[type] || type;
  };

  // No access
  if (!hasAccess) {
    return (
      <>
        <Helmet>
          <title>Templates - Acceso Restringido - UNMI</title>
        </Helmet>
        <div className="p-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gray-100 rounded-full">
                  <Lock className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <CardTitle>Acceso Restringido</CardTitle>
                  <CardDescription>
                    Esta función está disponible solo en el plan Templates
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Tu plan actual ({user?.planType || 'básico'}) no incluye acceso a la gestión de templates.
              </p>
              <p className="text-gray-600 mb-4">
                Actualiza a Templates para crear plantillas personalizadas de WhatsApp y SMS.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/plan">
                  Ver Planes Disponibles
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Templates - UNMI</title>
        <meta name="description" content="Gestiona tus plantillas de mensajes WhatsApp y SMS" />
      </Helmet>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
            <p className="text-gray-600 mt-1">
              Crea y administra mensajes predefinidos para diversas situaciones
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingTemplate(null); form.reset(); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Editar Template' : 'Crear Nuevo Template'}
                </DialogTitle>
                <DialogDescription>
                  {editingTemplate 
                    ? 'Modifica los detalles del template' 
                    : 'Crea un nuevo template para respuestas automáticas'}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Template</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Respuesta llamada perdida" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Template</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="missed_call">Llamada Perdida</SelectItem>
                              <SelectItem value="after_hours">Fuera de Horario</SelectItem>
                              <SelectItem value="welcome">Bienvenida</SelectItem>
                              <SelectItem value="follow_up">Seguimiento</SelectItem>
                              <SelectItem value="appointment">Cita</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="channel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Canal de Envío</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sms">Solo SMS</SelectItem>
                              <SelectItem value="whatsapp">Solo WhatsApp</SelectItem>
                              <SelectItem value="both">SMS & WhatsApp</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {locations.length > 0 && (
                    <FormField
                      control={form.control}
                      name="locationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ubicación (Opcional)</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                            value={field.value?.toString() || ''}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Todas las ubicaciones" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="null">Todas las ubicaciones</SelectItem>
                              {locations.map((location) => (
                                <SelectItem key={location.id} value={location.id.toString()}>
                                  {location.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Deja vacío para usar en todas las ubicaciones
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contenido del Mensaje</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Hola! Vimos que nos llamaste pero no pudimos atenderte..."
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Puedes usar variables como {'{nombre}'}, {'{empresa}'}, {'{fecha}'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Alert>
                    <MessageSquare className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      💡 <strong>Tip:</strong> Incluye un call-to-action claro y un enlace para reservar o contactar
                    </AlertDescription>
                  </Alert>

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => { setDialogOpen(false); setEditingTemplate(null); }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingTemplate ? 'Guardar Cambios' : 'Crear Template'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates Grid */}
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
                    <div className="h-3 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No hay templates aún</h3>
              <p className="text-gray-600 mb-4">
                Crea tu primer template para comenzar a automatizar respuestas
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const location = locations.find(l => l.id === template.locationId);
              return (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(template.type)}
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSend(template)}
                          title="Enviar template"
                        >
                          <Send className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCopy(template)}
                          title="Copiar contenido"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(template)}
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteTemplate(template)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{getTypeName(template.type)}</Badge>
                      <Badge variant="outline">{template.channel.toUpperCase()}</Badge>
                      {location && (
                        <Badge variant="outline">{location.name}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {template.content}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTemplate} onOpenChange={() => setDeleteTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El template "{deleteTemplate?.name}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTemplate && deleteMutation.mutate(deleteTemplate.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Template Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Template</DialogTitle>
            <DialogDescription>
              Envía "{sendingTemplate?.name}" a un número de WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Número del destinatario</label>
              <Input
                placeholder="+34612345678"
                value={recipientNumber}
                onChange={(e) => setRecipientNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Incluye el código de país (ej: +34 para España)
              </p>
            </div>
            {sendingTemplate && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Vista previa del mensaje</label>
                <div className="bg-muted p-4 rounded-lg text-sm">
                  {sendingTemplate.content}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendConfirm}
              disabled={!recipientNumber || sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Ahora
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}



