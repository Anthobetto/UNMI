import { useState, useEffect } from "react";
import { useAuth, loginSchema, LoginData, RegisterData } from "@/contexts/AuthContext";
import { registerSchema } from "@/shared/schema";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OfficialLogo } from "@/components/logo/official-logo";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Check, Building2, Rocket, Info, ArrowRight, ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { PricingSelector, Plan } from "@/components/PricingSelector";

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  
  // ==========================================
  // ESTADOS DEL FLUJO
  // ==========================================
  const [step, setStep] = useState<1 | 2>(1);
  const [activeTab, setActiveTab] = useState<string>("register");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedPlanUI, setSelectedPlanUI] = useState<'templates' | 'chatbots'>('templates');
  const [isYearly, setIsYearly] = useState(false);
  const [numLocations, setNumLocations] = useState(1);
  const [numDepartments, setNumDepartments] = useState(1);

  // Precios base
  const PRICE_SMALL = 60;
  const PRICE_PRO_BASE = 120;

  const calculateTotal = () => {
    const base = selectedPlanUI === 'templates' ? PRICE_SMALL : PRICE_PRO_BASE;
    const extraLocs = Math.max(0, numLocations - 1) * 30;
    const extraDepts = Math.max(0, numDepartments - 1) * 15;
    const monthlyTotal = base + extraLocs + extraDepts;
    
    // Si es anual, aplicamos 20% de descuento y multiplicamos por 12
    if (isYearly) {
      return monthlyTotal * 12 * 0.8;
    }
    return monthlyTotal;
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const tabParam = url.searchParams.get("tab");
    const planParam = url.searchParams.get("plan");

    if (tabParam === "login") {
      setActiveTab("login");
      setStep(2); // Si viene directo a login, saltamos el selector
    } else if (tabParam === "register") {
      setActiveTab("register");
      // Detectar plan desde URL para saltar el selector
      if (planParam === "small") {
        setSelectedPlanUI("templates");
        setStep(2);
      } else if (planParam === "pro") {
        setSelectedPlanUI("chatbots");
        setStep(2);
      }
    }
  }, []);

  if (user) {
    setLocation("/dashboard");
    return null;
  }

  // ==========================================
  // CONFIGURACIÓN DE FORMULARIOS
  // ==========================================
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      companyName: "",
      termsAccepted: false,
      selections: [], 
    },
  });

  // ==========================================
  // EL PUENTE (Visual -> Datos)
  // ==========================================
  useEffect(() => {
    const backendPlanType = selectedPlanUI === 'templates' ? 'small' : 'pro';

    const selectionData = {
      planType: backendPlanType,
      quantity: numLocations,
      departments: numDepartments,
      price: calculateTotal()
    };

    registerForm.setValue('selections', [selectionData as any], {
      shouldValidate: true,
      shouldDirty: true
    });
  }, [selectedPlanUI, numLocations, numDepartments, isYearly, registerForm]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleLogin = async (data: LoginData) => {
    try {
      setIsSubmitting(true);
      await login(data);
      setLocation("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    try {
      setIsSubmitting(true);
      const response = await register(data);
      if (response && response.url) {
        window.location.href = response.url; 
      } else {
        alert("Error: No se recibió enlace de pago. Revisa la consola.");
      }
    } catch (err) {
      console.error("❌ Error crítico:", err);
      alert("Ocurrió un error al intentar registrarse.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFormError = (errors: any) => {
    console.error("⛔ ERRORES DE VALIDACIÓN:", errors);
    let mensaje = "Por favor completa los siguientes campos:\n";
    if (errors.username) mensaje += "- Nombre completo\n";
    if (errors.companyName) mensaje += "- Nombre de empresa\n";
    if (errors.email) mensaje += "- Email válido\n";
    if (errors.password) mensaje += "- Contraseña (mínimo 6 caracteres)\n";
    if (errors.termsAccepted) mensaje += "- Debes aceptar los términos y condiciones\n";
    alert(mensaje);
  };

  // ==========================================
  // DEFINICIÓN DE PLANES PARA EL COMPONENTE
  // ==========================================
  const plansData: Plan[] = [
    {
      id: 'templates',
      title: 'Pequeña Empresa',
      price: { monthly: PRICE_SMALL, yearly: PRICE_SMALL * 12 * 0.8 },
      description: 'Ideal para negocios locales con una única sede.',
      features: ['150 mensajes/mes', '1 Localización', '1 Departamento'],
      ctaText: 'Elegir Plan',
      icon: Building2
    },
    {
      id: 'chatbots',
      title: 'UNMI Pro',
      price: { monthly: PRICE_PRO_BASE, yearly: PRICE_PRO_BASE * 12 * 0.8 },
      description: 'Escala sin límites con extras a medida.',
      features: ['360 mensajes/mes', 'Multi-Localización', 'Multi-Departamento'],
      ctaText: 'Seleccionar Pro',
      isFeatured: true,
      icon: Rocket
    }
  ];

  // ==========================================
  // RENDER: PASO 1 (Selector de Planes)
  // ==========================================
  if (step === 1) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] font-sans text-[#1a1a1a] pt-12 pb-24">
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
          <LanguageSelector />
        </div>
        <div className="flex justify-center mb-4 cursor-pointer" onClick={() => setLocation("/")}>
          <OfficialLogo width={200} />
        </div>
        
        <PricingSelector 
          plans={plansData} 
          onSelectPlan={(planId, yearly) => {
            setSelectedPlanUI(planId);
            setIsYearly(yearly);
            setStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} 
        />

        <footer className="mt-12 text-center text-xs text-gray-400">
          ¿Ya tienes cuenta? <button onClick={() => { setActiveTab('login'); setStep(2); }} className="text-[#FF0000] hover:underline font-medium">Inicia sesión aquí</button>
        </footer>
      </div>
    );
  }

  // ==========================================
  // RENDER: PASO 2 (Formulario y Resumen Vertical)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-[#1a1a1a] pb-24">
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <LanguageSelector />
      </div>

      <div className="max-w-xl mx-auto px-4 pt-12 md:pt-20">
        
        {/* HEADER PASO 2: Logo más grande y centrado */}
        <div className="flex flex-col items-center mb-12">
          <div className="cursor-pointer mb-8" onClick={() => setLocation("/")}>
            <OfficialLogo width={280} />
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="text-gray-500 hover:text-gray-900 font-medium" 
            onClick={() => setStep(1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a selección de planes
          </Button>
        </div>

        <div className="space-y-8">
          
          {/* === RESUMEN DEL PLAN (ARRIBA) === */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${selectedPlanUI === 'templates' ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-[#FF0000]'}`}>
                  {selectedPlanUI === 'templates' ? <Building2 size={24} /> : <Rocket size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedPlanUI === 'templates' ? 'Pequeña Empresa' : 'UNMI Pro'}</h3>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Facturación {isYearly ? 'Anual' : 'Mensual'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 font-medium mb-1">Total a pagar</p>
                <span className="text-3xl font-bold text-gray-900">€{calculateTotal()}</span>
              </div>
            </div>

            {/* OPCIONES DINÁMICAS (Solo para PRO) */}
            {selectedPlanUI === 'chatbots' && (
              <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Sedes</label>
                  <Select value={numLocations.toString()} onValueChange={(v) => setNumLocations(Number(v))}>
                    <SelectTrigger className="h-11 bg-gray-50/50 border-gray-100 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 10].map(n => <SelectItem key={n} value={n.toString()}>{n} Sedes</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Departamentos</label>
                  <Select value={numDepartments.toString()} onValueChange={(v) => setNumDepartments(Number(v))}>
                    <SelectTrigger className="h-11 bg-gray-50/50 border-gray-100 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={n.toString()}>{n} Deptos</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </motion.div>

          {/* === FORMULARIO DE REGISTRO (DEBAJO) === */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white text-gray-900 rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-gray-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF0000] opacity-[0.03] rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>

            <div className="relative z-10">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 p-1.5 rounded-2xl h-14 mb-10">
                  <TabsTrigger value="register" className="rounded-xl data-[state=active]:bg-[#FF0000] data-[state=active]:text-white text-gray-600 font-bold transition-all">{t("auth.register.title")}</TabsTrigger>
                  <TabsTrigger value="login" className="rounded-xl data-[state=active]:bg-[#FF0000] data-[state=active]:text-white text-gray-600 font-bold transition-all">{t("auth.login.title")}</TabsTrigger>
                </TabsList>

                {/* FORMULARIO DE REGISTRO */}
                <TabsContent value="register">
                  <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold mb-2">Crea tu cuenta de UNMI</h2>
                    <p className="text-gray-500">Completa tus datos para configurar tu espacio.</p>
                  </div>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(handleRegister, onFormError)} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={registerForm.control} name="username" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder={t("auth.register.fullName")} {...field} className="bg-gray-50/50 border-gray-200 h-14 rounded-2xl focus:bg-white focus:border-[#FF0000] transition-all" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={registerForm.control} name="companyName" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder={t("auth.register.companyName")} {...field} className="bg-gray-50/50 border-gray-200 h-14 rounded-2xl focus:bg-white focus:border-[#FF0000] transition-all" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <FormField control={registerForm.control} name="email" render={({ field }) => (
                        <FormItem><FormControl><Input placeholder={t("auth.register.email")} {...field} className="bg-gray-50/50 border-gray-200 h-14 rounded-2xl focus:bg-white focus:border-[#FF0000] transition-all" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={registerForm.control} name="password" render={({ field }) => (
                        <FormItem><FormControl><Input type="password" placeholder={t("auth.register.password")} {...field} className="bg-gray-50/50 border-gray-200 h-14 rounded-2xl focus:bg-white focus:border-[#FF0000] transition-all" /></FormControl><FormMessage /></FormItem>
                      )} />

                      <FormField control={registerForm.control} name="termsAccepted" render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 pt-2">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} className="border-gray-300 data-[state=checked]:bg-[#FF0000] data-[state=checked]:border-[#FF0000] mt-1 size-5 rounded-md" />
                          </FormControl>
                          <FormLabel className="text-[13px] text-gray-500 font-normal leading-snug">
                            He leído y acepto los <a href="#" className="underline text-[#FF0000] font-medium">términos de servicio</a> y la política de privacidad de UNMI.
                          </FormLabel>
                        </FormItem>
                      )} />

                      <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-[#FF0000] hover:bg-[#cc0000] text-white rounded-2xl text-xl font-bold mt-6 shadow-xl shadow-red-500/20 hover:shadow-red-500/30 transition-all group">
                        {isSubmitting ? (
                          <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> Procesando...</span>
                        ) : (
                          <span className="flex items-center">
                            Proceder al pago <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={24} />
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                {/* FORMULARIO DE LOGIN */}
                <TabsContent value="login">
                   <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold mb-2">Bienvenido de nuevo</h2>
                    <p className="text-gray-500">Ingresa tus credenciales para acceder.</p>
                  </div>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                      <FormField control={loginForm.control} name="email" render={({ field }) => (
                        <FormItem><FormControl><Input placeholder={t("auth.login.email")} {...field} className="bg-gray-50/50 border-gray-200 h-14 rounded-2xl focus:bg-white focus:border-[#FF0000] transition-all" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={loginForm.control} name="password" render={({ field }) => (
                        <FormItem><FormControl><Input type="password" placeholder={t("auth.login.password")} {...field} className="bg-gray-50/50 border-gray-200 h-14 rounded-2xl focus:bg-white focus:border-[#FF0000] transition-all" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-[#FF0000] hover:bg-[#cc0000] text-white rounded-2xl text-xl font-bold mt-8 shadow-xl shadow-red-500/20 transition-all">
                        {isSubmitting ? (
                          <span className="flex items-center gap-2 justify-center"><Loader2 className="animate-spin" /> {t("auth.login.loading")}</span>
                        ) : (
                          t("auth.login.submit")
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>

          {/* Sellos de confianza centrados debajo */}
          <div className="flex justify-center items-center gap-6 text-xs text-gray-400 mt-4">
            <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-green-600" /> Pago Seguro SSL</span>
            <span className="flex items-center gap-1.5"><Check size={16} className="text-green-600" /> Verificado por Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}