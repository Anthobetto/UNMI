import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Bot,
  ExternalLink,
  Check,
  Settings,
  Lock,
  AlertCircle,
  Zap,
  Play,
  FileText,
  Code,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import { LanguageSelector } from '@/components/LanguageSelector'; // Añadido por si quieres ponerlo en el header

interface ChatbotProvider {
  id: string;
  name: string;
  description: string;
  logo: string;
  features: string[];
  setupDifficulty: 'easy' | 'medium' | 'advanced';
  pricing: string;
  docsUrl: string;
  popular?: boolean;
}

export default function Chatbots() {
  const { user, hasAccessToSection } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation(); // AÑADIDO
  const [selectedProvider, setSelectedProvider] = useState<ChatbotProvider | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testMode, setTestMode] = useState(false);

  // Schema de configuración movido dentro del componente para usar t() en los mensajes de error
  const chatbotConfigSchema = z.object({
    provider: z.string().min(1, 'Selecciona un proveedor'),
    apiKey: z.string().min(10, 'La API key debe tener al menos 10 caracteres'),
    webhookUrl: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
    fallbackMessage: z.string().min(10, 'El mensaje fallback debe tener al menos 10 caracteres'),
  });

  type ChatbotConfigData = z.infer<typeof chatbotConfigSchema>;

  // Check access
  const hasAccess = hasAccessToSection('chatbots');

  // Form
  const form = useForm<ChatbotConfigData>({
    resolver: zodResolver(chatbotConfigSchema),
    defaultValues: {
      provider: '',
      apiKey: '',
      webhookUrl: '',
      fallbackMessage: t('chatbots.config.fallbackPlaceholder'), // Usando traducción
    },
  });

  const onSubmit = (data: ChatbotConfigData) => {
    console.log('Chatbot config:', data);
    
    // Mock: Guardar configuración
    toast({
      title: t('notifications.success.chatbotConfigured'),
      description: `${selectedProvider?.name} ${t('notifications.success.chatbotConfiguredDesc')}`,
    });
    
    setDialogOpen(false);
    form.reset();
    setSelectedProvider(null);
  };

  const handleTestChatbot = () => {
    setTestMode(true);
    toast({
      title: '🧪 Test mode activated',
      description: 'You can now test your chatbot before going live.',
    });
  };

  // Datos quemados movidos dentro del componente si se quisieran traducir a futuro, 
  // aunque como son nombres propios y features específicas, dejarlas aquí es aceptable.
  const chatbotProviders: ChatbotProvider[] = [
    {
      id: 'voiceflow',
      name: 'Voiceflow',
      description: 'Constructor visual de chatbots con IA, sin código necesario',
      logo: '🎙️',
      features: [
        'Constructor drag & drop',
        'GPT-4 integrado',
        'Soporte multi-canal',
        'Analytics en tiempo real',
      ],
      setupDifficulty: 'easy',
      pricing: 'Desde $50/mes',
      docsUrl: 'https://www.voiceflow.com/docs',
      popular: true,
    },
    {
      id: 'botpress',
      name: 'Botpress',
      description: 'Plataforma open-source para chatbots empresariales',
      logo: '🤖',
      features: [
        'Open source',
        'NLU avanzado',
        'Integración completa APIs',
        'Hosting on-premise',
      ],
      setupDifficulty: 'medium',
      pricing: 'Gratis (self-hosted)',
      docsUrl: 'https://botpress.com/docs',
    },
    {
      id: 'tidio',
      name: 'Tidio',
      description: 'Chat en vivo + chatbot para ecommerce y atención al cliente',
      logo: '💬',
      features: [
        'Chat en vivo',
        'Chatbot visual',
        'Integraciones ecommerce',
        'Plantillas predefinidas',
      ],
      setupDifficulty: 'easy',
      pricing: 'Desde €29/mes',
      docsUrl: 'https://www.tidio.com/docs',
    },
    {
      id: 'dialogflow',
      name: 'Dialogflow (Google)',
      description: 'NLP de Google para conversaciones naturales',
      logo: '🔷',
      features: [
        'NLP de Google',
        'Soporte 30+ idiomas',
        'Integración Google Cloud',
        'Machine Learning',
      ],
      setupDifficulty: 'advanced',
      pricing: 'Pago por uso',
      docsUrl: 'https://cloud.google.com/dialogflow/docs',
      popular: true,
    },
    {
      id: 'landbot',
      name: 'Landbot',
      description: 'Chatbots conversacionales para landing pages y WhatsApp',
      logo: '🚀',
      features: [
        'WhatsApp Business API',
        'Landing page builder',
        'Integraciones +100',
        'Templates listos',
      ],
      setupDifficulty: 'easy',
      pricing: 'Desde $40/mes',
      docsUrl: 'https://landbot.io/docs',
    },
    {
      id: 'custom',
      name: 'API Personalizada',
      description: 'Conecta tu propio chatbot mediante webhook',
      logo: '⚙️',
      features: [
        'Total flexibilidad',
        'Tu propia infraestructura',
        'Control completo',
        'Sin limitaciones',
      ],
      setupDifficulty: 'advanced',
      pricing: 'Según tu implementación',
      docsUrl: '/docs/custom-chatbot-api',
    },
  ];

// No access UI
  if (!hasAccess) {
    return (
      <>
        <Helmet>
          <title>{t('plan.chatbots.title')} - Restricted - UNMI</title>
        </Helmet>
        <div className="space-y-2 mt-1">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Lock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>{t('chatbots.restrictedAccess.title')}</CardTitle>
                  <CardDescription>
                    {t('chatbots.restrictedAccess.subtitle')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                {t('chatbots.restrictedAccess.currentPlan', { plan: t(`plan.${user?.planType || 'small'}.title`) })}
              </p>
              <p className="text-gray-600 mb-4">
                {t('chatbots.restrictedAccess.upgrade')}
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>{t('chatbots.restrictedAccess.feature1')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>{t('chatbots.restrictedAccess.feature2')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>{t('chatbots.restrictedAccess.feature3')}</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <Link href="/plan">
                  {t('dashboard.quickActions.upgradePlan')}
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
        <title>{t('chatbots.title')} - UNMI</title>
        <meta name="description" content={t('chatbots.subtitle')} />
      </Helmet>

      <div className="space-y-2 mt-1">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bot className="h-8 w-8 text-purple-600" />
                {t('chatbots.title')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('chatbots.subtitle')}
              </p>
            </div>
            <div>
              <LanguageSelector />
            </div>
          </div>

          {/* Alert Info */}
          <Alert className="bg-blue-50 border-blue-200 mb-6">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle>{t('chatbots.howItWorks.title')}</AlertTitle>
            <AlertDescription>
              {t('chatbots.howItWorks.desc')}
            </AlertDescription>
          </Alert>

          {/* Chatbot Providers Grid */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">{t('chatbots.chooseProvider')}</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {chatbotProviders.map((provider) => (
                <Card 
                  key={provider.id} 
                  className="hover:shadow-lg transition-shadow relative"
                >
                  {provider.popular && (
                    <Badge className="absolute -top-2 -right-2 bg-purple-600">Popular</Badge>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="text-5xl mb-3">{provider.logo}</div>
                      <Badge 
                        variant={
                          provider.setupDifficulty === 'easy' 
                            ? 'default' 
                            : provider.setupDifficulty === 'medium' 
                              ? 'secondary' 
                              : 'outline'
                        }
                      >
                        {t(`chatbots.difficulty.${provider.setupDifficulty}`)}
                      </Badge>
                    </div>
                    <CardTitle>{provider.name}</CardTitle>
                    <CardDescription>{provider.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {provider.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between text-sm pt-4 border-t">
                      <span className="text-gray-600">{t('chatbots.price')}:</span>
                      <span className="font-semibold">{provider.pricing}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button 
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={() => {
                        setSelectedProvider(provider);
                        setDialogOpen(true);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {t('chatbots.configure')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => window.open(provider.docsUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Ejemplo de Embed */}
            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200 h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-purple-600" />
                  <CardTitle>{t('chatbots.preview.title')}</CardTitle>
                </div>
                <CardDescription>
                  {t('chatbots.preview.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg border-2 border-dashed border-purple-300 p-8 text-center">
                  <Bot className="h-16 w-16 mx-auto mb-4 text-purple-600" />
                  <p className="text-gray-600 mb-4">
                    {t('chatbots.preview.placeholder')}
                  </p>
                  {testMode ? (
                    <div className="space-y-3">
                      <div className="bg-gray-100 p-3 rounded-lg text-left">
                        <p className="text-sm"><strong>Usuario:</strong> Hola, necesito información</p>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-lg text-left">
                        <p className="text-sm"><strong>Bot:</strong> ¡Hola! Estoy aquí para ayudarte. ¿Qué información necesitas?</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setTestMode(false)}>
                        {t('chatbots.preview.stop')}
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={handleTestChatbot} variant="outline">
                      <Play className="h-4 w-4 mr-2" />
                      {t('chatbots.preview.test')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fallback Configuration */}
            <Card className="border-orange-200 bg-orange-50 h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <CardTitle>{t('chatbots.fallback.title')}</CardTitle>
                </div>
                <CardDescription>
                  {t('chatbots.fallback.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-white/50 border-orange-200">
                  <FileText className="h-4 w-4 text-orange-600" />
                  <AlertDescription>
                    {t('chatbots.fallback.conditions')}
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                      <li>{t('chatbots.fallback.condition1')}</li>
                      <li>{t('chatbots.fallback.condition2')}</li>
                      <li>{t('chatbots.fallback.condition3')}</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-100" asChild>
                    <Link href="/templates">
                      <FileText className="h-4 w-4 mr-2" />
                      {t('chatbots.fallback.configureTemplates')}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dialog de Configuración */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedProvider?.logo}
                  {t('chatbots.config.title')} {selectedProvider?.name}
                </DialogTitle>
                <DialogDescription>
                  {t('chatbots.config.subtitle')}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <input type="hidden" {...form.register('provider')} value={selectedProvider?.id} />

                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('chatbots.config.apiKey')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder={t('chatbots.config.apiKeyPlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t('chatbots.config.apiKeyHelp')}{' '}
                          <a 
                            href={selectedProvider?.docsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:underline"
                          >
                            Ver documentación →
                          </a>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="webhookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('chatbots.config.webhook')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('chatbots.config.webhookPlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t('chatbots.config.webhookHelp')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fallbackMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('chatbots.config.fallbackMessage')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t('chatbots.config.fallbackPlaceholder')} 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t('chatbots.config.fallbackHelp')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Alert className="bg-yellow-50 border-yellow-200">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-sm">
                      <strong>Nota:</strong> {t('chatbots.config.note')}
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setDialogOpen(false);
                        setSelectedProvider(null);
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                      <Check className="h-4 w-4 mr-2" />
                      {t('chatbots.config.save')}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}