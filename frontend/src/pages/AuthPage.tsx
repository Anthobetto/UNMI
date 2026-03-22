import { useState, useEffect } from "react";
import { useAuth, loginSchema, LoginData, RegisterData } from "@/contexts/AuthContext";
import { registerSchema } from "@/shared/schema";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OfficialLogo } from "@/components/logo/official-logo";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Check, Building2, Rocket, ArrowRight, ShieldCheck, Loader2, ArrowLeft, User, Mail, Lock, Building } from "lucide-react";
import { Meteors } from "@/components/ui/meteors";

// Definición de los tiers de precios (Idéntica a LandingPage)
const PRICING_TIERS = {
  small: [
    { messages: 50, price: 25 },
    { messages: 100, price: 50 },
    { messages: 150, price: 60 },
    { messages: 200, price: 80 },
  ],
  pro: [
    { messages: 250, price: 100 },
    { messages: 300, price: 110 },
    { messages: 350, price: 135 },
    { messages: 400, price: 150 },
  ],
  premium: [
    { messages: 500, price: 175 },
    { messages: 600, price: 200 },
    { messages: 800, price: 250 },
    { messages: 1000, price: 300 },
  ],
};

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
  
  // Estados para los planes seleccionados (Sincronizados con Landing)
  const [smallTier, setSmallTier] = useState(PRICING_TIERS.small[2]); 
  const [proTier, setProTier] = useState(PRICING_TIERS.pro[1]); 
  const [premiumTier, setPremiumTier] = useState(PRICING_TIERS.premium[1]);
  
  const [selectedPlanUI, setSelectedPlanUI] = useState<'small' | 'pro' | 'premium'>('small');
  const [finalSelection, setFinalSelection] = useState<any>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const tabParam = url.searchParams.get("tab");
    const planParam = url.searchParams.get("plan");
    const priceParam = url.searchParams.get("price");

    if (tabParam === "login") {
      setActiveTab("login");
      setStep(2); 
    } else if (tabParam === "register") {
      setActiveTab("register");
      if (planParam) {
        const plan = planParam as 'small' | 'pro' | 'premium';
        setSelectedPlanUI(plan);
        const tierList = PRICING_TIERS[plan];
        const matchedTier = priceParam 
          ? tierList.find(t => t.price.toString() === priceParam) || tierList[0]
          : tierList[0];
        if (plan === 'small') setSmallTier(matchedTier);
        if (plan === 'pro') setProTier(matchedTier);
        if (plan === 'premium') setPremiumTier(matchedTier);
        setFinalSelection({ plan, ...matchedTier });
        setStep(2);
      }
    }
  }, []);

  if (user) {
    setLocation("/dashboard");
    return null;
  }

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

  useEffect(() => {
    if (!finalSelection) return;
    const selectionData = {
      planType: finalSelection.plan,
      quantity: 1, 
      departments: 1,
      price: finalSelection.price,
      messages: finalSelection.messages
    };
    registerForm.setValue('selections', [selectionData as any], {
      shouldValidate: true,
      shouldDirty: true
    });
  }, [finalSelection, registerForm]);

  const handleSelectPlan = (plan: 'small' | 'pro' | 'premium', tier: any) => {
    setSelectedPlanUI(plan);
    setFinalSelection({ plan, ...tier });
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
  // RENDER: PASO 1 (Selector de Planes)
  // ==========================================
  if (step === 1) {
    return (
      <div className="min-h-screen bg-background relative font-sans text-foreground py-12 md:py-20 overflow-hidden">
        <div className="fixed inset-0 pointer-events-none -z-10">
          <Meteors number={40} />
        </div>
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
          <LanguageSelector />
        </div>
        <div className="container px-4 md:px-6 relative text-center">
          <div className="flex justify-center mb-12 cursor-pointer" onClick={() => setLocation("/")}>
            <OfficialLogo width={220} />
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Elige tu plan UNMI</h2>
          <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl leading-relaxed mb-16">
            Selecciona el volumen de mensajes que mejor se adapte a tu negocio.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch text-left">
            {/* Tarjeta Small */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/50 dark:bg-white/5 rounded-[2.5rem] border-2 border-gray-200 dark:border-white/10 p-10 shadow-xl flex flex-col">
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">Pequeña Empresa</h3>
                <p className="text-gray-500 text-sm mb-4 text-balance">Todo lo esencial para empezar.</p>
                <Select defaultValue={smallTier.messages.toString()} onValueChange={(val) => setSmallTier(PRICING_TIERS.small.find(t => t.messages.toString() === val)!)}>
                  <SelectTrigger className="w-full bg-white dark:bg-white/10 border-gray-200 dark:border-white/10 rounded-xl h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRICING_TIERS.small.map(t => <SelectItem key={t.messages} value={t.messages.toString()}>{t.messages} mensajes - €{t.price}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-black tracking-tighter">€{smallTier.price}</span>
                <span className="text-gray-500 ml-2">/mes</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-sm font-bold"><Check className="size-5 text-[#FF0000]" /> {smallTier.messages} mensajes/mes</li>
                <li className="flex items-center gap-3 text-sm"><Check className="size-5 text-gray-400" /> 1 Localización</li>
                <li className="flex items-center gap-3 text-sm"><Check className="size-5 text-gray-400" /> Respuesta automática</li>
              </ul>
              <Button onClick={() => handleSelectPlan('small', smallTier)} className="w-full h-14 rounded-2xl text-lg font-bold border-2 border-[#FF0000] hover:bg-[#FF0000]/5 text-[#FF0000]" variant="outline">Elegir Plan</Button>
            </motion.div>
            {/* Tarjeta PRO */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/50 dark:bg-white/5 rounded-[2.5rem] border-2 border-[#FF0000] p-10 shadow-2xl relative overflow-hidden flex flex-col z-10">
              <div className="absolute top-0 right-0 bg-[#FF0000] text-white px-6 py-1.5 rounded-bl-2xl text-xs font-bold uppercase">Popular</div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">UNMI Pro</h3>
                <p className="text-gray-500 text-sm mb-4 text-balance">Optimiza tu atención al cliente.</p>
                <Select defaultValue={proTier.messages.toString()} onValueChange={(val) => setProTier(PRICING_TIERS.pro.find(t => t.messages.toString() === val)!)}>
                  <SelectTrigger className="w-full bg-white dark:bg-white/10 border-[#FF0000]/20 rounded-xl h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRICING_TIERS.pro.map(t => <SelectItem key={t.messages} value={t.messages.toString()}>{t.messages} mensajes - €{t.price}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-black tracking-tighter">€{proTier.price}</span>
                <span className="text-gray-500 ml-2">/mes</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-sm font-bold"><Check className="size-5 text-green-500" /> {proTier.messages} mensajes/mes</li>
                <li className="flex items-center gap-3 text-sm font-bold"><Check className="size-5 text-green-500" /> Hasta 3 Localizaciones</li>
                <li className="flex items-center gap-3 text-sm font-bold"><Check className="size-5 text-green-500" /> Chatbots de IA</li>
              </ul>
              <Button onClick={() => handleSelectPlan('pro', proTier)} className="w-full h-14 rounded-2xl text-lg font-bold bg-[#FF0000] hover:bg-[#cc0000] text-white shadow-xl shadow-red-500/20">Elegir Plan Pro</Button>
            </motion.div>
            {/* Tarjeta PREMIUM */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/50 dark:bg-white/5 rounded-[2.5rem] border-2 border-gray-200 dark:border-white/10 p-10 shadow-xl flex flex-col">
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2 text-[#FF0000]">UNMI Premium</h3>
                <p className="text-gray-500 text-sm mb-4 text-balance">Escalabilidad total sin límites.</p>
                <Select defaultValue={premiumTier.messages.toString()} onValueChange={(val) => setPremiumTier(PRICING_TIERS.premium.find(t => t.messages.toString() === val)!)}>
                  <SelectTrigger className="w-full bg-white dark:bg-white/10 border-gray-200 dark:border-white/10 rounded-xl h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRICING_TIERS.premium.map(t => <SelectItem key={t.messages} value={t.messages.toString()}>{t.messages} mensajes - €{t.price}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-black tracking-tighter">€{premiumTier.price}</span>
                <span className="text-gray-500 ml-2">/mes</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-sm font-bold"><Check className="size-5 text-[#FF0000]" /> {premiumTier.messages} mensajes/mes</li>
                <li className="flex items-center gap-3 text-sm font-bold"><Check className="size-5 text-[#FF0000]" /> Multi-Localización</li>
                <li className="flex items-center gap-3 text-sm font-bold"><Check className="size-5 text-[#FF0000]" /> IA Avanzada</li>
              </ul>
              <Button onClick={() => handleSelectPlan('premium', premiumTier)} className="w-full h-14 rounded-2xl text-lg font-bold border-2 border-[#FF0000] hover:bg-[#FF0000]/5 text-[#FF0000]" variant="outline">Elegir Premium</Button>
            </motion.div>
          </div>
          <footer className="mt-16 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta? <button onClick={() => { setActiveTab('login'); setStep(2); }} className="text-[#FF0000] hover:underline font-bold">Inicia sesión aquí</button>
          </footer>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: PASO 2 (Registro Rediseñado)
  // ==========================================
  if (activeTab === 'login') {
    return (
      <div className="min-h-screen bg-background relative font-sans text-foreground pb-24 overflow-hidden flex flex-col items-center justify-center">
        <div className="fixed inset-0 pointer-events-none -z-10"><Meteors number={20} /></div>
        <div className="max-w-md w-full px-4 text-center">
          <div className="cursor-pointer mb-10 flex justify-center" onClick={() => setLocation("/")}><OfficialLogo width={220} /></div>
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-gray-200 dark:border-white/10 text-left">
            <h2 className="text-3xl font-black mb-2">Bienvenido</h2>
            <p className="text-muted-foreground mb-8">Ingresa tus datos para acceder.</p>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                <FormField control={loginForm.control} name="email" render={({ field }) => (
                  <FormItem><FormControl><Input placeholder={t("auth.login.email")} {...field} className="bg-gray-50/50 dark:bg-white/5 border-gray-200 h-14 rounded-2xl pl-6" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={loginForm.control} name="password" render={({ field }) => (
                  <FormItem><FormControl><Input type="password" placeholder={t("auth.login.password")} {...field} className="bg-gray-50/50 dark:bg-white/5 border-gray-200 h-14 rounded-2xl pl-6" /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-[#FF0000] hover:bg-[#cc0000] text-white rounded-2xl text-xl font-bold mt-4">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : t("auth.login.submit")}
                </Button>
              </form>
            </Form>
          </div>
          <button onClick={() => { setActiveTab('register'); setStep(1); }} className="mt-8 text-sm text-muted-foreground hover:text-[#FF0000] font-bold">← Volver a planes de registro</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative font-sans text-foreground pb-24 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none -z-10"><Meteors number={30} /></div>
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50"><LanguageSelector /></div>
      <div className="max-w-xl mx-auto px-4 pt-12 md:pt-20 relative">
        <div className="flex flex-col items-center mb-10">
          <div className="cursor-pointer mb-6" onClick={() => setLocation("/")}><OfficialLogo width={220} /></div>
          <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-[#FF0000] transition-colors group">
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" /> Cambiar de plan
          </button>
        </div>
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/20 dark:border-white/10 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF0000]/10 blur-3xl -z-10" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${selectedPlanUI === 'small' ? 'bg-gray-100 dark:bg-white/10 text-gray-600' : selectedPlanUI === 'pro' ? 'bg-red-50 dark:bg-red-500/10 text-[#FF0000]' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>
                  {selectedPlanUI === 'small' ? <Building2 size={24} /> : selectedPlanUI === 'pro' ? <Rocket size={24} /> : <ShieldCheck size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight capitalize">{selectedPlanUI === 'small' ? 'Pequeña Empresa' : selectedPlanUI === 'pro' ? 'UNMI Pro' : 'UNMI Premium'}</h3>
                  <p className="text-[11px] text-muted-foreground uppercase font-black tracking-[0.1em]">{finalSelection?.messages} Mensajes / Mes</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground font-bold uppercase mb-0.5">Total</div>
                <div className="flex items-baseline justify-end gap-0.5"><span className="text-3xl font-black text-foreground">€{finalSelection?.price}</span><span className="text-xs text-muted-foreground font-medium">/mes</span></div>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-[#0A0A0A]/80 backdrop-blur-2xl text-foreground rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/40 dark:border-white/5 relative">
            <div className="mb-10 text-center"><h2 className="text-3xl font-black tracking-tight mb-2">Comienza ahora</h2><p className="text-muted-foreground text-sm">Configura tu acceso en menos de 1 minuto.</p></div>
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegister, onFormError)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={registerForm.control} name="username" render={({ field }) => (
                    <FormItem><FormControl><div className="relative group"><User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-[#FF0000] transition-colors" /><Input placeholder="Nombre completo" {...field} className="bg-gray-50/50 dark:bg-white/5 border-gray-200 dark:border-white/10 h-14 pl-12 rounded-2xl focus:bg-white dark:focus:bg-white/10 focus:border-[#FF0000] transition-all" /></div></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={registerForm.control} name="companyName" render={({ field }) => (
                    <FormItem><FormControl><div className="relative group"><Building className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-[#FF0000] transition-colors" /><Input placeholder="Empresa" {...field} className="bg-gray-50/50 dark:bg-white/5 border-gray-200 dark:border-white/10 h-14 pl-12 rounded-2xl focus:bg-white dark:focus:bg-white/10 focus:border-[#FF0000] transition-all" /></div></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={registerForm.control} name="email" render={({ field }) => (
                  <FormItem><FormControl><div className="relative group"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-[#FF0000] transition-colors" /><Input placeholder="Correo electrónico profesional" {...field} className="bg-gray-50/50 dark:bg-white/5 border-gray-200 dark:border-white/10 h-14 pl-12 rounded-2xl focus:bg-white dark:focus:bg-white/10 focus:border-[#FF0000] transition-all" /></div></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={registerForm.control} name="password" render={({ field }) => (
                  <FormItem><FormControl><div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-[#FF0000] transition-colors" /><Input type="password" placeholder="Contraseña de acceso" {...field} className="bg-gray-50/50 dark:bg-white/5 border-gray-200 dark:border-white/10 h-14 pl-12 rounded-2xl focus:bg-white dark:focus:bg-white/10 focus:border-[#FF0000] transition-all" /></div></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={registerForm.control} name="termsAccepted" render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="border-gray-300 dark:border-white/20 data-[state=checked]:bg-[#FF0000] data-[state=checked]:border-[#FF0000] mt-1 size-5 rounded-md" /></FormControl><FormLabel className="text-[12px] text-muted-foreground font-medium leading-snug">Acepto los <a href="#" className="underline text-foreground hover:text-[#FF0000] transition-colors">términos de servicio</a> y la política de privacidad de UNMI.</FormLabel></FormItem>
                )} />
                <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-gradient-to-r from-[#FF0000] to-[#D32F2F] hover:from-[#D32F2F] hover:to-[#B71C1C] text-white rounded-2xl text-lg font-black mt-6 shadow-2xl shadow-red-500/30 hover:shadow-red-500/50 transition-all group overflow-hidden relative"><div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />{isSubmitting ? <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> Procesando...</span> : <span className="flex items-center justify-center gap-3">Completar Registro <ArrowRight className="size-6 group-hover:translate-x-1 transition-transform" /></span>}</Button>
              </form>
            </Form>
            <div className="mt-10 pt-8 border-t border-gray-100 dark:border-white/5 flex flex-wrap justify-center items-center gap-x-8 gap-y-4"><div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest"><ShieldCheck size={16} className="text-green-500" /> Pago Seguro SSL</div><div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest"><Check size={16} className="text-green-500" /> Garantía Stripe</div></div>
          </motion.div>
          <p className="text-center text-xs text-muted-foreground">¿Ya tienes una cuenta? <button onClick={() => { setActiveTab('login'); setStep(2); }} className="text-[#FF0000] font-black hover:underline">Inicia sesión</button></p>
        </div>
      </div>
    </div>
  );
}
