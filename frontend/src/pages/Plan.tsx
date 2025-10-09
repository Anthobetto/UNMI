/**
 * Plan - B2B Plan Management & Upsell Page
 * Review plan actual, upgrade/downgrade, historial de pagos
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Check,
  Zap,
  Crown,
  ArrowRight,
  Download,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Bot,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { stripeMockService } from '@/services/StripeMockService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Plan {
  id: string;
  name: string;
  type: 'templates' | 'chatbots';
  price: number;
  features: string[];
  messageLimit: number;
  extraMessagePrice: number;
  popular?: boolean;
}

// Mock historial de facturas
const mockInvoices = [
  {
    id: 'inv_2024_04',
    date: new Date('2024-04-01'),
    description: 'Plan Templates Basic - Abril 2024',
    amount: 60,
    status: 'paid',
    downloadUrl: '/mock-invoice-apr.pdf',
  },
  {
    id: 'inv_2024_03',
    date: new Date('2024-03-01'),
    description: 'Plan Templates Basic - Marzo 2024',
    amount: 60,
    status: 'paid',
    downloadUrl: '/mock-invoice-mar.pdf',
  },
  {
    id: 'inv_2024_02',
    date: new Date('2024-02-01'),
    description: 'Plan Templates Basic - Febrero 2024',
    amount: 60,
    status: 'paid',
    downloadUrl: '/mock-invoice-feb.pdf',
  },
];

export default function Plan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Obtener planes disponibles
  const templatesPlans = stripeMockService.getPlans('templates');
  const chatbotsPlans = stripeMockService.getPlans('chatbots');
  const allPlans = [...templatesPlans, ...chatbotsPlans];

  // Plan actual del usuario (mock)
  const currentPlanId = 'templates-basic'; // En producción vendría de user.planId
  const currentPlan = allPlans.find(p => p.id === currentPlanId);

  // Mutation para cambiar plan
  const changePlanMutation = useMutation({
    mutationFn: async (newPlanId: string) => {
      // Mock: simula cambio de plan
      console.log(`Cambiando plan a: ${newPlanId}`);
      
      // En producción:
      // const token = localStorage.getItem('accessToken');
      // const response = await fetch('/api/user/plan', {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ planId: newPlanId }),
      // });
      // return response.json();

      // Simula delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, planId: newPlanId };
    },
    onSuccess: (data) => {
      toast({
        title: '¡Plan actualizado!',
        description: `Tu plan ha sido cambiado correctamente.`,
      });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el plan. Intenta de nuevo.',
        variant: 'destructive',
      });
    },
  });

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  const handleConfirmChange = () => {
    if (selectedPlan) {
      changePlanMutation.mutate(selectedPlan.id);
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast({
      title: '🚧 Descarga de factura',
      description: 'Esta funcionalidad estará disponible próximamente con tu cuenta Stripe real.',
    });
  };

  return (
    <>
      <Helmet>
        <title>Mi Plan - Gestión de Suscripción - UNMI</title>
        <meta name="description" content="Gestiona tu plan y suscripción" />
      </Helmet>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Plan</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tu suscripción y explora opciones de upgrade
          </p>
        </div>

        {/* Plan Actual */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Badge className="mb-2 bg-blue-600">Plan Actual</Badge>
                <CardTitle className="text-2xl">{currentPlan?.name || 'Templates Basic'}</CardTitle>
                <CardDescription className="text-base mt-1">
                  {currentPlan?.type === 'templates' ? (
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Automatización con plantillas personalizadas
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Chatbots con Inteligencia Artificial
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">€{currentPlan?.price || 60}</div>
                <div className="text-sm text-gray-600">por mes</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-700">Mensajes incluidos</span>
                <Badge variant="secondary">{currentPlan?.messageLimit || 1000} / mes</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-700">Costo mensajes extra</span>
                <Badge variant="secondary">€{currentPlan?.extraMessagePrice || 1} / mensaje</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-700">Estado</span>
                <Badge className="bg-green-600">Activo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-700">Próxima renovación</span>
                <span className="text-sm font-medium">{format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'dd MMM yyyy', { locale: es })}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold mb-3">Funciones incluidas:</h4>
              <div className="grid grid-cols-2 gap-2">
                {currentPlan?.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert de Upgrade */}
        <Alert className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <TrendingUp className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-900">
            <strong>¿Necesitas más?</strong> Upgrade a Pro para obtener 5x más mensajes, análisis avanzados y soporte prioritario.
          </AlertDescription>
        </Alert>

        {/* Planes Templates */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              Planes Templates
            </h2>
            <p className="text-gray-600 text-sm">Automatización vía plantillas SMS y WhatsApp</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {templatesPlans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              return (
                <Card 
                  key={plan.id} 
                  className={`hover:shadow-lg transition-shadow ${
                    isCurrent ? 'border-2 border-blue-600' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {plan.price === 60 ? 'Ideal para pequeñas empresas' : 'Para empresas en crecimiento'}
                        </CardDescription>
                      </div>
                      {isCurrent && <Badge className="bg-blue-600">Actual</Badge>}
                    </div>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">€{plan.price}</span>
                      <span className="text-gray-600 ml-2">/mes</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      variant={isCurrent ? 'secondary' : 'default'}
                      onClick={() => !isCurrent && handleSelectPlan(plan)}
                      disabled={isCurrent}
                    >
                      {isCurrent ? (
                        'Plan Actual'
                      ) : plan.price > (currentPlan?.price || 0) ? (
                        <>
                          Upgrade a {plan.name}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        'Cambiar a este plan'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Planes Chatbots */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6 text-purple-600" />
              Planes Chatbots
            </h2>
            <p className="text-gray-600 text-sm">IA conversacional para atención 24/7</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {chatbotsPlans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              return (
                <Card 
                  key={plan.id} 
                  className={`hover:shadow-lg transition-shadow ${
                    isCurrent ? 'border-2 border-purple-600' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {plan.price === 60 ? 'Chatbot básico con IA' : 'IA avanzada personalizada'}
                        </CardDescription>
                      </div>
                      {isCurrent && <Badge className="bg-purple-600">Actual</Badge>}
                    </div>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">€{plan.price}</span>
                      <span className="text-gray-600 ml-2">/mes</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      variant={isCurrent ? 'secondary' : 'default'}
                      onClick={() => !isCurrent && handleSelectPlan(plan)}
                      disabled={isCurrent}
                    >
                      {isCurrent ? (
                        'Plan Actual'
                      ) : (
                        <>
                          Cambiar a {plan.name}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Plan Enterprise */}
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-yellow-600" />
              <CardTitle className="text-2xl">Enterprise</CardTitle>
            </div>
            <CardDescription className="text-base">
              Solución personalizada para grandes empresas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Incluye todo de Pro, más:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <span>Mensajes ilimitados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <span>Templates + Chatbots combinados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <span>Account Manager dedicado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <span>SLA garantizado 99.9%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <span>API completa con webhooks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <span>Integraciones personalizadas</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col justify-center">
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold">Precio personalizado</div>
                  <p className="text-gray-600 mt-2">Según necesidades de tu empresa</p>
                </div>
                <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700">
                  <Zap className="mr-2 h-5 w-5" />
                  Contactar Ventas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historial de Facturas */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Historial de Facturas</CardTitle>
                <CardDescription>Últimas facturas y pagos realizados</CardDescription>
              </div>
              <CreditCard className="h-5 w-5 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {format(invoice.date, 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>{invoice.description}</TableCell>
                    <TableCell className="font-semibold">€{invoice.amount}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-600">Pagado</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Descargar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog Confirmación Cambio de Plan */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar cambio de plan</DialogTitle>
              <DialogDescription>
                Estás a punto de cambiar a <strong>{selectedPlan?.name}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  El cambio se aplicará inmediatamente. Se prorrateará el costo del mes actual.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan actual:</span>
                  <span className="font-medium">{currentPlan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nuevo plan:</span>
                  <span className="font-medium">{selectedPlan?.name}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Nuevo precio mensual:</span>
                  <span className="text-xl font-bold text-blue-600">€{selectedPlan?.price}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmChange}
                disabled={changePlanMutation.isPending}
              >
                {changePlanMutation.isPending ? 'Procesando...' : 'Confirmar Cambio'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

