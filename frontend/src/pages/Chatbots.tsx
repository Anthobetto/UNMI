import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Card,
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
import {
  Bot,
  ExternalLink,
  Check,
  Settings,
  Lock,
  AlertCircle,
  Play,
  FileText,
  Code,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import { cn } from '@/utils/cn';

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
  const { t } = useTranslation();
  const [selectedProvider, setSelectedProvider] = useState<ChatbotProvider | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testMode, setTestMode] = useState(false);

  const chatbotConfigSchema = z.object({
    provider: z.string().min(1, 'Selecciona un proveedor'),
    apiKey: z.string().min(10, 'La API key debe tener al menos 10 caracteres'),
    webhookUrl: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
    fallbackMessage: z.string().min(10, 'El mensaje fallback debe tener al menos 10 caracteres'),
  });

  type ChatbotConfigData = z.infer<typeof chatbotConfigSchema>;

  const hasAccess = hasAccessToSection('chatbots');

  const form = useForm<ChatbotConfigData>({
    resolver: zodResolver(chatbotConfigSchema),
    defaultValues: {
      provider: '',
      apiKey: '',
      webhookUrl: '',
      fallbackMessage: t('chatbots.config.fallbackPlaceholder'),
    },
  });

  const onSubmit = (data: ChatbotConfigData) => {
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
  };

  const chatbotProviders: ChatbotProvider[] = [
    {
      id: 'voiceflow',
      name: 'Voiceflow',
      description: 'Constructor visual de chatbots con IA, sin código necesario',
      logo: '🎙️',
      features: ['Constructor drag & drop', 'GPT-4 integrado', 'Soporte multi-canal'],
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
      features: ['Open source', 'NLU avanzado', 'Integración completa APIs'],
      setupDifficulty: 'medium',
      pricing: 'Gratis (self-hosted)',
      docsUrl: 'https://botpress.com/docs',
    },
    {
      id: 'tidio',
      name: 'Tidio',
      description: 'Chat en vivo + chatbot para ecommerce y atención al cliente',
      logo: '💬',
      features: ['Chat en vivo', 'Chatbot visual', 'Integraciones ecommerce'],
      setupDifficulty: 'easy',
      pricing: 'Desde €29/mes',
      docsUrl: 'https://www.tidio.com/docs',
    },
  ];

  if (!hasAccess) {
    return (
      <div className="flex flex-col gap-y-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
            <Bot className="h-6 w-6 text-[#003366]" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">Chatbots</h2>
        </div>

        <Card className="max-w-2xl mx-auto rounded-[2.5rem] border-none bg-white p-12 shadow-sm text-center">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-50 text-[#003366]">
            <Lock className="h-12 w-12" />
          </div>
          <h3 className="mb-4 text-2xl font-black text-slate-900">{t('chatbots.restrictedAccess.title')}</h3>
          <p className="text-slate-400 mb-10">{t('chatbots.restrictedAccess.subtitle')}</p>
          <Button asChild className="w-full bg-[#003366] hover:bg-blue-900 h-14 rounded-2xl text-lg font-black shadow-xl shadow-blue-900/20">
            <Link href="/plan">{t('dashboard.quickActions.upgradePlan')}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('chatbots.title')} - UNMI</title>
      </Helmet>

      <div className="flex flex-col gap-y-8 pb-10">
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
            <Bot className="h-6 w-6 text-[#003366]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {t('chatbots.title')}
            </h2>
            <p className="text-sm font-medium text-slate-400">Automatización inteligente para tu negocio</p>
          </div>
        </div>

        {/* Chatbot Providers Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {chatbotProviders.map((provider) => (
            <Card key={provider.id} className="rounded-[2.5rem] border-none bg-white p-8 shadow-sm transition-hover hover:shadow-md relative flex flex-col group">
              {provider.popular && <Badge className="absolute top-6 right-6 bg-[#003366] text-white border-none px-3 py-1 font-bold rounded-full text-[10px] uppercase">Popular</Badge>}
              <div className="text-5xl mb-6">{provider.logo}</div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">{provider.name}</h4>
              <p className="text-sm text-slate-400 mb-8 line-clamp-2">{provider.description}</p>
              
              <ul className="space-y-4 mb-10 flex-grow">
                {provider.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <Check className="h-5 w-5 text-emerald-500 bg-emerald-50 p-1 rounded-lg" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="flex gap-3">
                <Button 
                  className="flex-1 rounded-2xl bg-[#003366] hover:bg-blue-900 text-white h-12 font-bold"
                  onClick={() => { setSelectedProvider(provider); setDialogOpen(true); }}
                >
                  <Settings className="h-4 w-4 mr-2" /> Configurar
                </Button>
                <Button variant="outline" size="icon" className="rounded-2xl border-slate-100 h-12 w-12 text-slate-400 hover:text-[#003366]" onClick={() => window.open(provider.docsUrl, '_blank')}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-[2.5rem] border-none bg-white p-10 shadow-sm flex flex-col items-center text-center">
             <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
                <Code className="h-8 w-8" />
             </div>
             <h4 className="text-xl font-bold text-slate-900 mb-2">{t('chatbots.preview.title')}</h4>
             <p className="text-sm text-slate-400 mb-8">{t('chatbots.preview.subtitle')}</p>
             
             <div className="w-full bg-slate-50 rounded-3xl p-10 border-2 border-dashed border-slate-200">
                <Bot className="h-16 w-16 mx-auto mb-4 text-[#003366] opacity-20" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">{t('chatbots.preview.placeholder')}</p>
                
                {testMode ? (
                  <div className="space-y-4 max-w-sm mx-auto text-left">
                    <div className="bg-white p-4 rounded-2xl shadow-sm"><p className="text-xs font-bold text-slate-900">Usuario: Hola!</p></div>
                    <div className="bg-[#003366] p-4 rounded-2xl text-white"><p className="text-xs font-bold">Bot: Hola! ¿En qué puedo ayudarte?</p></div>
                    <Button size="sm" variant="ghost" className="w-full text-slate-400 hover:text-red-500" onClick={() => setTestMode(false)}>Detener prueba</Button>
                  </div>
                ) : (
                  <Button onClick={handleTestChatbot} className="rounded-2xl bg-white text-[#003366] h-12 px-8 font-bold shadow-sm hover:shadow-md">
                    <Play className="h-4 w-4 mr-2" /> {t('chatbots.preview.test')}
                  </Button>
                )}
             </div>
          </Card>

          <Card className="rounded-[2.5rem] border-none bg-[#003366] p-10 shadow-sm flex flex-col justify-between text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24" />
             <div className="relative z-10">
               <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                  <AlertCircle className="h-8 w-8 text-white" />
               </div>
               <h4 className="text-2xl font-black mb-4 italic">{t('chatbots.fallback.title')}</h4>
               <p className="text-blue-100 font-medium opacity-80 mb-8">{t('chatbots.fallback.subtitle')}</p>
               
               <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-3 text-sm font-bold"><Check size={18} className="text-emerald-400" /> {t('chatbots.fallback.condition1')}</div>
                  <div className="flex items-center gap-3 text-sm font-bold"><Check size={18} className="text-emerald-400" /> {t('chatbots.fallback.condition2')}</div>
               </div>
             </div>

             <Button variant="outline" className="relative z-10 w-full h-14 rounded-2xl border-white/20 text-white font-bold hover:bg-white/10" asChild>
                <Link href="/templates">Configurar Plantillas <ChevronRight className="h-4 w-4 ml-2" /></Link>
             </Button>
          </Card>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="rounded-[2.5rem] border-none p-10 max-w-2xl overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-[#003366] flex items-center gap-3">
                {selectedProvider?.logo} {t('chatbots.config.title')} {selectedProvider?.name}
              </DialogTitle>
              <DialogDescription>{t('chatbots.config.subtitle')}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                <FormField control={form.control} name="apiKey" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('chatbots.config.apiKey')}</FormLabel>
                    <FormControl><Input type="password" placeholder={t('chatbots.config.apiKeyPlaceholder')} {...field} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fallbackMessage" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('chatbots.config.fallbackMessage')}</FormLabel>
                    <FormControl><Textarea rows={4} {...field} className="rounded-2xl bg-slate-50 border-none font-medium" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 h-12 rounded-2xl font-bold">Cancelar</Button>
                  <Button type="submit" className="flex-1 h-12 bg-[#003366] text-white font-bold shadow-lg shadow-blue-900/20">Guardar</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
