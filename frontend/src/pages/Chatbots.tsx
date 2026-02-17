/**
 * Chatbots - Chatbot Selector & Configuration
 * Integración con chatbots externos (Voiceflow, Botpress, etc.)
 * Fallback a Templates si chatbot falla
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
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
  MessageSquare,
  Code,
  Play,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';

// Schema de configuración
const chatbotConfigSchema = z.object({
  provider: z.string().min(1, 'Selecciona un proveedor'),
  apiKey: z.string().min(10, 'La API key debe tener al menos 10 caracteres'),
  webhookUrl: z.string().url('Debe ser una URL válida').optional(),
  fallbackMessage: z.string().min(10, 'El mensaje fallback debe tener al menos 10 caracteres'),
});

type ChatbotConfigData = z.infer<typeof chatbotConfigSchema>;

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

export default function Chatbots() {
  const { user, hasAccessToSection } = useAuth();
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<ChatbotProvider | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testMode, setTestMode] = useState(false);

  // Check access
  const hasAccess = hasAccessToSection('chatbots');

  // Form
  const form = useForm<ChatbotConfigData>({
    resolver: zodResolver(chatbotConfigSchema),
    defaultValues: {
      provider: '',
      apiKey: '',
      webhookUrl: '',
      fallbackMessage: 'Lo siento, estoy teniendo problemas técnicos. Un agente te contactará pronto.',
    },
  });

  const onSubmit = (data: ChatbotConfigData) => {
    console.log('Chatbot config:', data);
    
    // Mock: Guardar configuración
    toast({
      title: '✅ Chatbot configurado',
      description: `${selectedProvider?.name} ha sido configurado correctamente.`,
    });
    
    setDialogOpen(false);
    form.reset();
    setSelectedProvider(null);
  };

  const handleTestChatbot = () => {
    setTestMode(true);
    toast({
      title: '🧪 Modo de prueba activado',
      description: 'Ahora puedes probar tu chatbot antes de activarlo en producción.',
    });
  };

  // No access
  if (!hasAccess) {
    return (
      <>
        <Helmet>
          <title>Chatbots - Acceso Restringido - UNMI</title>
        </Helmet>
        <div className="space-y-2 mt-1">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Lock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Acceso Restringido</CardTitle>
                  <CardDescription>
                    Esta función está disponible solo en el plan Chatbots
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Tu plan actual ({user?.planType || 'básico'}) no incluye acceso a chatbots con IA.
              </p>
              <p className="text-gray-600 mb-4">
                Actualiza a Chatbots para implementar asistentes conversacionales 24/7 con inteligencia artificial.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Respuestas con IA en tiempo real</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Disponibilidad 24/7 sin intervención humana</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Aprendizaje continuo de conversaciones</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <Link href="/plan">
                  Ver Planes Chatbots
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
        <title>Chatbots - Inteligencia Artificial - UNMI</title>
        <meta name="description" content="Configura chatbots con IA para atención 24/7" />
      </Helmet>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bot className="h-8 w-8 text-purple-600" />
            Chatbots
          </h1>
          <p className="text-gray-600 mt-1">
            Configura chatbots con IA para respuestas automáticas 24/7
          </p>
        </div>

        {/* Alert Info */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle>¿Cómo funciona?</AlertTitle>
          <AlertDescription>
            Selecciona un proveedor de chatbot, configura la API key, y UNMI redirigirá automáticamente las conversaciones.
            Si el chatbot falla, se usará el sistema de Templates como respaldo.
          </AlertDescription>
        </Alert>

        {/* Chatbot Providers Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4">Elige tu Proveedor de Chatbot</h2>
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
                      {provider.setupDifficulty === 'easy' && 'Fácil'}
                      {provider.setupDifficulty === 'medium' && 'Medio'}
                      {provider.setupDifficulty === 'advanced' && 'Avanzado'}
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
                    <span className="text-gray-600">Precio:</span>
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
                    Configurar
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

        {/* Ejemplo de Embed */}
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-purple-600" />
              <CardTitle>Vista Previa de Chatbot</CardTitle>
            </div>
            <CardDescription>
              Así se verá tu chatbot integrado en las conversaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg border-2 border-dashed border-purple-300 p-8 text-center">
              <Bot className="h-16 w-16 mx-auto mb-4 text-purple-600" />
              <p className="text-gray-600 mb-4">
                Aquí se mostrará la interfaz de tu chatbot una vez configurado
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
                    Detener Prueba
                  </Button>
                </div>
              ) : (
                <Button onClick={handleTestChatbot} variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Probar Chatbot (Demo)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fallback Configuration */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <CardTitle>Sistema de Respaldo (Fallback)</CardTitle>
            </div>
            <CardDescription>
              Si el chatbot falla o no está disponible, se utilizará este sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                UNMI usará automáticamente tus <strong>Templates</strong> como respaldo si:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>El chatbot no responde en 5 segundos</li>
                  <li>Hay un error de API</li>
                  <li>Se excede el límite de requests</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/templates">
                  <FileText className="h-4 w-4 mr-2" />
                  Configurar Templates de Respaldo
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de Configuración */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedProvider?.logo}
                Configurar {selectedProvider?.name}
              </DialogTitle>
              <DialogDescription>
                Conecta tu cuenta de {selectedProvider?.name} con UNMI
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
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Obtén tu API key desde el panel de {selectedProvider?.name}.{' '}
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
                      <FormLabel>Webhook URL (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://tu-chatbot.com/webhook" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        URL donde UNMI enviará las conversaciones para que tu chatbot responda
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
                      <FormLabel>Mensaje de Respaldo</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Lo siento, estoy teniendo problemas..." 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Mensaje que se enviará si el chatbot falla completamente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert className="bg-yellow-50 border-yellow-200">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-sm">
                    <strong>Nota:</strong> Al activar el chatbot, se pausarán los Templates automáticos. 
                    Solo se usarán como respaldo en caso de error.
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
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    <Check className="h-4 w-4 mr-2" />
                    Guardar Configuración
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

