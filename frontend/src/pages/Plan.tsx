/**
 * Plan - B2B Plan Management & Upsell Page
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
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
  TrendingUp,
  MessageSquare,
  Bot,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { stripeMockService } from '@/services/StripeMockService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';

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
  { id: 'inv_2024_04', date: new Date('2024-04-01'), description: 'Plan Templates Basic - Abril 2024', amount: 60, status: 'paid', downloadUrl: '/mock-invoice-apr.pdf' },
  { id: 'inv_2024_03', date: new Date('2024-03-01'), description: 'Plan Templates Basic - Marzo 2024', amount: 60, status: 'paid', downloadUrl: '/mock-invoice-mar.pdf' },
  { id: 'inv_2024_02', date: new Date('2024-02-01'), description: 'Plan Templates Basic - Febrero 2024', amount: 60, status: 'paid', downloadUrl: '/mock-invoice-feb.pdf' },
];

export default function Plan() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const templatesPlans = stripeMockService.getPlans('templates');
  const chatbotsPlans = stripeMockService.getPlans('chatbots');
  const allPlans = [...templatesPlans, ...chatbotsPlans];

  const currentPlanId = 'templates-basic';
  const currentPlan = allPlans.find(p => p.id === currentPlanId);

  const changePlanMutation = useMutation({
    mutationFn: async (newPlanId: string) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, planId: newPlanId };
    },
    onSuccess: () => {
      toast({
        title: t('plan.toast.updatedTitle'),
        description: t('plan.toast.updatedDesc'),
      });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: () => {
      toast({
        title: t('plan.toast.errorTitle'),
        description: t('plan.toast.errorDesc'),
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

  const handleDownloadInvoice = () => {
    toast({
      title: t('plan.toast.downloadTitle'),
      description: t('plan.toast.downloadDesc'),
    });
  };

  return (
    <>
      <Helmet>
        <title>{t('plan.header.title')}</title>
        <meta name="description" content={t('plan.header.subtitle')} />
      </Helmet>

      <div className="w-full min-w-0 px-4 sm:px-6 space-y-6 mt-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{t('plan.header.title')}</h1>
            <p className="text-gray-600 mt-1 break-words">{t('plan.header.subtitle')}</p>
          </div>
          <div className="flex-shrink-0">
            <LanguageSelector />
          </div>
        </div>

        {/* Plan Actual */}
        <Card className="w-full min-w-0 max-w-full border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white overflow-hidden">
          <CardHeader className="min-w-0 max-w-full">
            <div className="flex flex-col gap-3 min-w-0 max-w-full">
              <div className="min-w-0 max-w-full">
                <Badge className="mb-2 bg-blue-600 w-fit">{t('plan.current.title')}</Badge>
                <CardTitle className="break-words text-lg sm:text-xl max-w-full">{currentPlan?.name || t('plan.templates.basic')}</CardTitle>
                <CardDescription className="text-sm sm:text-base mt-1 max-w-full">
                  {currentPlan?.type === 'templates' ? (
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      <span className="break-words">{t('plan.templates.automation')}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Bot className="h-4 w-4 flex-shrink-0" />
                      <span className="break-words">{t('plan.chatbots.ai')}</span>
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="text-left">
                <div className="text-3xl font-bold text-blue-600">€{currentPlan?.price || 60}</div>
                <div className="text-sm text-gray-600">{t('plan.perMonth')}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="min-w-0 max-w-full">
            <div className="space-y-3">
              <div className="flex flex-col items-start justify-between p-3 bg-white rounded-lg gap-2 min-w-0 max-w-full">
                <span className="text-sm text-gray-700 break-words">{t('plan.messagesIncluded')}</span>
                <Badge variant="secondary" className="whitespace-nowrap text-xs">{currentPlan?.messageLimit || 1000} / {t('plan.perMonth')}</Badge>
              </div>
              <div className="flex flex-col items-start justify-between p-3 bg-white rounded-lg gap-2 min-w-0 max-w-full">
                <span className="text-sm text-gray-700 break-words">{t('plan.extraCost')}</span>
                <Badge variant="secondary" className="whitespace-nowrap text-xs">€{currentPlan?.extraMessagePrice || 1} / {t('plan.message')}</Badge>
              </div>
              <div className="flex flex-col items-start justify-between p-3 bg-white rounded-lg gap-2 min-w-0 max-w-full">
                <span className="text-sm text-gray-700 break-words">{t('plan.status')}</span>
                <Badge className="bg-green-600 whitespace-nowrap text-xs">{t('plan.active')}</Badge>
              </div>
              <div className="flex flex-col items-start justify-between p-3 bg-white rounded-lg gap-2 min-w-0 max-w-full">
                <span className="text-sm text-gray-700 break-words">{t('plan.renewal')}</span>
                <span className="text-sm font-medium whitespace-nowrap">
                  {format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'dd MMM yyyy', { locale: es })}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t min-w-0 max-w-full">
              <h4 className="font-semibold mb-3 text-sm sm:text-base">{t('plan.includedFeatures')}:</h4>
              <div className="space-y-2 min-w-0 max-w-full">
                {currentPlan?.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm min-w-0 max-w-full">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="break-words flex-1">{t(`plan.features.${feature}`)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert Upgrade */}
        <Alert className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 min-w-0">
          <TrendingUp className="h-4 w-4 text-purple-600 flex-shrink-0" />
          <AlertDescription className="text-purple-900 break-words">
            <strong>{t('plan.needMore')}</strong> {t('plan.upgradeDesc')}
          </AlertDescription>
        </Alert>

        {/* Planes Templates */}
        <div className="space-y-4 min-w-0">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
              {t('plan.templates.title')}
            </h2>
            <p className="text-gray-600 text-sm break-words">{t('plan.templates.subtitle')}</p>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 min-w-0">
            {templatesPlans.map(plan => {
              const isCurrent = plan.id === currentPlanId;
              return (
                <Card
                  key={plan.id}
                  className={`w-full min-w-0 hover:shadow-lg transition-shadow ${isCurrent ? 'border-2 border-blue-600' : ''}`}
                >
                  <CardHeader className="min-w-0">
                    <div className="flex justify-between items-start gap-2 min-w-0">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="break-words text-lg sm:text-xl">{plan.name}</CardTitle>
                        <CardDescription className="mt-1 break-words">{plan.price === 60 ? t('plan.templates.ideal') : t('plan.templates.growing')}</CardDescription>
                      </div>
                      {isCurrent && <Badge className="bg-blue-600 whitespace-nowrap flex-shrink-0">{t('plan.current.short')}</Badge>}
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl sm:text-4xl font-bold">€{plan.price}</span>
                      <span className="text-gray-600 ml-2 text-sm">/ {t('plan.perMonth')}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="min-w-0">
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm min-w-0">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="break-words">{t(`plan.features.${feature}`)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-4 min-w-0">
                    <Button className="w-full text-sm min-w-0" variant={isCurrent ? 'secondary' : 'default'} onClick={() => !isCurrent && handleSelectPlan(plan)} disabled={isCurrent}>
                      {isCurrent ? t('plan.current.title') : plan.price > (currentPlan?.price || 0) ? <span className="flex items-center justify-center gap-1"><span className="truncate">{t('plan.upgradeTo')} {plan.name}</span><ArrowRight className="ml-2 h-4 w-4 flex-shrink-0" /></span> : t('plan.changePlan')}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Planes Chatbots */}
        <div className="space-y-4 min-w-0">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
              <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 flex-shrink-0" />
              {t('plan.chatbots.title')}
            </h2>
            <p className="text-gray-600 text-sm break-words">{t('plan.chatbots.subtitle')}</p>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 min-w-0">
            {chatbotsPlans.map(plan => {
              const isCurrent = plan.id === currentPlanId;
              return (
                <Card key={plan.id} className={`w-full min-w-0 hover:shadow-lg transition-shadow ${isCurrent ? 'border-2 border-purple-600' : ''}`}>
                  <CardHeader className="min-w-0">
                    <div className="flex justify-between items-start gap-2 min-w-0">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="break-words text-lg sm:text-xl">{plan.name}</CardTitle>
                        <CardDescription className="mt-1 break-words">{plan.price === 60 ? t('plan.chatbots.basic') : t('plan.chatbots.advanced')}</CardDescription>
                      </div>
                      {isCurrent && <Badge className="bg-purple-600 whitespace-nowrap flex-shrink-0">{t('plan.current.short')}</Badge>}
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl sm:text-4xl font-bold">€{plan.price}</span>
                      <span className="text-gray-600 ml-2 text-sm">/ {t('plan.perMonth')}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="min-w-0">
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm min-w-0">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="break-words">{t(`plan.features.${feature}`)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="min-w-0">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-sm min-w-0" variant={isCurrent ? 'secondary' : 'default'} onClick={() => !isCurrent && handleSelectPlan(plan)} disabled={isCurrent}>
                      {isCurrent ? t('plan.current.title') : <span className="flex items-center justify-center gap-1"><span className="truncate">{t('plan.changeTo')} {plan.name}</span><ArrowRight className="ml-2 h-4 w-4 flex-shrink-0" /></span>}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Plan Enterprise */}
        <Card className="w-full min-w-0 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300">
          <CardHeader className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 flex-shrink-0" />
              <CardTitle className="break-words text-lg sm:text-xl">{t('plan.enterprise.title')}</CardTitle>
            </div>
            <CardDescription className="text-sm sm:text-base break-words">{t('plan.enterprise.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="space-y-4 min-w-0">
              <div className="min-w-0">
                <h4 className="font-semibold mb-3">{t('plan.enterprise.includes')}</h4>
                <ul className="space-y-2 text-sm min-w-0">
                  {[
                    'unlimitedMessages',
                    'combinedTemplatesChatbots',
                    'accountManager',
                    'sla',
                    'fullApi',
                    'integrations'
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 min-w-0">
                      <Check className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="break-words">{t(`plan.features.${feature}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 min-w-0">
                <div className="text-left sm:text-center min-w-0">
                  <div className="text-2xl sm:text-4xl font-bold break-words">{t('plan.enterprise.customPricing')}</div>
                  <p className="text-gray-600 mt-2 text-sm break-words">{t('plan.enterprise.according')}</p>
                </div>
                <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700 w-full sm:w-auto whitespace-nowrap flex-shrink-0">
                  <Zap className="mr-2 h-5 w-5 flex-shrink-0" />
                  {t('plan.enterprise.contactSales')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historial de Facturas */}
        <Card className="w-full min-w-0">
          <CardHeader className="min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <CardTitle className="break-words text-lg sm:text-xl">{t('plan.invoices.title')}</CardTitle>
                <CardDescription className="break-words">{t('plan.invoices.subtitle')}</CardDescription>
              </div>
              <CreditCard className="h-5 w-5 text-gray-600 flex-shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-6 sm:px-0">
                <div className="overflow-hidden border border-gray-200 sm:rounded-lg">
                  <Table className="min-w-full text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap text-xs sm:text-sm">{t('plan.invoices.date')}</TableHead>
                        <TableHead className="whitespace-nowrap text-xs sm:text-sm">{t('plan.invoices.description')}</TableHead>
                        <TableHead className="whitespace-nowrap text-xs sm:text-sm">{t('plan.invoices.amount')}</TableHead>
                        <TableHead className="whitespace-nowrap text-xs sm:text-sm">{t('plan.invoices.status')}</TableHead>
                        <TableHead className="text-right whitespace-nowrap text-xs sm:text-sm">{t('plan.invoices.action')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockInvoices.map(invoice => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium whitespace-nowrap text-xs sm:text-sm">{format(invoice.date, 'dd MMM yyyy', { locale: es })}</TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <div className="max-w-[120px] sm:max-w-none truncate">{invoice.description}</div>
                          </TableCell>
                          <TableCell className="font-semibold whitespace-nowrap text-xs sm:text-sm">€{invoice.amount}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-600 text-xs">{t('plan.invoices.paid')}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={handleDownloadInvoice} className="text-xs sm:text-sm">
                              <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1 flex-shrink-0" />
                              <span className="hidden sm:inline">{t('plan.invoices.download')}</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialog Confirmación Cambio de Plan */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="break-words">{t('plan.changeDialog.title')}</DialogTitle>
              <DialogDescription className="break-words">
                {t('plan.changeDialog.subtitle')} <strong>{selectedPlan?.name}</strong>. {t('plan.changeDialog.warning')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
              <Button variant="secondary" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                {t('plan.changeDialog.cancel')}
              </Button>
              <Button onClick={handleConfirmChange} className="w-full sm:w-auto sm:ml-2">
                {t('plan.changeDialog.confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}