import { useState, useEffect } from "react";
import { useAuth, loginSchema, LoginData, RegisterData } from "@/contexts/AuthContext";
// Importamos el schema compartido para asegurar que validamos igual que el backend
import { registerSchema } from "@/shared/schema";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OfficialLogo } from "@/components/logo/official-logo";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Check, Building2, Rocket, Info, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("register");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // 1. ESTADOS VISUALES (Lo que ve el usuario)
  // ==========================================
  const [selectedPlanUI, setSelectedPlanUI] = useState<'templates' | 'chatbots'>('templates');
  const [numLocations, setNumLocations] = useState(1);
  const [numDepartments, setNumDepartments] = useState(1);

  // Lógica de Precios (Visual)
  const PRICE_SMALL = 60;
  const PRICE_PRO_BASE = 120;

  const calculateTotal = () => {
    if (selectedPlanUI === 'templates') return PRICE_SMALL;
    const extraLocs = Math.max(0, numLocations - 1) * 30;
    const extraDepts = Math.max(0, numDepartments - 1) * 15;
    return PRICE_PRO_BASE + extraLocs + extraDepts;
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const tabParam = url.searchParams.get("tab");
    if (tabParam === "login") setActiveTab("login");
    if (tabParam === "register") setActiveTab("register");
  }, []);

  if (user) {
    setLocation("/dashboard");
    return null;
  }

  // ==========================================
  // 2. CONFIGURACIÓN DE FORMULARIOS
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
  // 3. EL PUENTE (Visual -> Datos)
  // ==========================================
  useEffect(() => {
    const backendPlanType = selectedPlanUI === 'templates' ? 'small' : 'pro';

    const selectionData = {
      planType: backendPlanType,
      quantity: numLocations,
      departments: numDepartments,
      price: calculateTotal()
    };

    // Inyectar en el formulario silenciosamente
    registerForm.setValue('selections', [selectionData as any], {
      shouldValidate: true,
      shouldDirty: true
    });

  }, [selectedPlanUI, numLocations, numDepartments, registerForm]);

  // ==========================================
  // 4. HANDLERS
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
      console.log("🚀 Enviando a backend:", data);

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

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-[#1a1a1a]">
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <LanguageSelector />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20">

        {/* HEADER */}
        <div className="text-center mb-12 md:mb-16">
          <div className="flex justify-center mb-6 cursor-pointer" onClick={() => setLocation("/")}>
            <OfficialLogo width={220} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{t("auth.register.tagline")}</h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-base md:text-lg">
            {t("hero.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* === IZQUIERDA: PAYWALL VISUAL === */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl md:text-2xl font-bold">{t("auth.register.selectPlan")}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* PLAN SMALL */}
              <div
                onClick={() => {
                  setSelectedPlanUI('templates');
                  setNumLocations(1);
                  setNumDepartments(1);
                }}
                className={`relative p-5 md:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedPlanUI === 'templates'
                  ? 'border-[#FF0000] bg-white shadow-xl ring-1 ring-red-100'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${selectedPlanUI === 'templates' ? 'bg-red-50 text-[#FF0000]' : 'bg-gray-100 text-gray-500'}`}>
                    <Building2 size={24} />
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-bold">€{PRICE_SMALL}</span>
                    <span className="text-xs text-gray-500">/mes</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">Pequeña Empresa</h3>
                <p className="text-sm text-gray-500 mb-6 min-h-[40px]">
                  Ideal para negocios locales con una única sede.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm"><Check size={16} className="text-green-500 mr-2 flex-shrink-0" /> 150 mensajes/mes</li>
                  <li className="flex items-center text-sm"><Check size={16} className="text-green-500 mr-2 flex-shrink-0" /> 1 Localización</li>
                  <li className="flex items-center text-sm"><Check size={16} className="text-green-500 mr-2 flex-shrink-0" /> 1 Departamento</li>
                </ul>
              </div>

              {/* PLAN PRO */}
              <div
                onClick={() => setSelectedPlanUI('chatbots')}
                className={`relative p-5 md:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedPlanUI === 'chatbots'
                  ? 'border-[#FF0000] bg-white shadow-xl ring-1 ring-red-100'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#FF0000] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Recomendado
                </div>
                <div className="flex justify-between items-start mb-4 mt-2">
                  <div className={`p-3 rounded-xl ${selectedPlanUI === 'chatbots' ? 'bg-red-50 text-[#FF0000]' : 'bg-gray-100 text-gray-500'}`}>
                    <Rocket size={24} />
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-bold">€{PRICE_PRO_BASE}</span>
                    <span className="text-xs text-gray-500">Base /mes</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">UNMI Pro</h3>
                <p className="text-sm text-gray-500 mb-6 min-h-[40px]">
                  Escala sin límites con extras a medida.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm"><Check size={16} className="text-green-500 mr-2 flex-shrink-0" /> 360 mensajes/mes</li>
                  <li className="flex items-center text-sm"><Check size={16} className="text-green-500 mr-2 flex-shrink-0" /> Multi-Localización</li>
                  <li className="flex items-center text-sm"><Check size={16} className="text-green-500 mr-2 flex-shrink-0" /> Multi-Departamento</li>
                </ul>
              </div>
            </div>

            {/* OPCIONES DINÁMICAS (FIX OVERFLOW AQUÍ) */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${selectedPlanUI === 'chatbots' ? 'opacity-100 max-h-[800px]' : 'opacity-60 max-h-[100px] md:max-h-[140px] grayscale pointer-events-none'}`}>
              <Card className="border border-gray-200 shadow-sm bg-gray-50/50 rounded-2xl">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Info className="text-blue-500" size={18} />
                    <h4 className="font-semibold text-gray-900">Personalización de Estructura</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 block">{t("nav.locations")}</label>
                      <Select
                        value={numLocations.toString()}
                        onValueChange={(v) => setNumLocations(Number(v))}
                        disabled={selectedPlanUI !== 'chatbots'}
                      >
                        <SelectTrigger className="h-12 bg-white border-gray-200 rounded-xl"><SelectValue placeholder="1" /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 10, 15].map(num => (
                            <SelectItem key={num} value={num.toString()}>{num} {num === 1 ? 'Sede' : 'Sedes'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedPlanUI === 'chatbots' && numLocations > 1 && <p className="text-xs text-green-600 font-medium">+{(numLocations - 1) * 30}€/mes extra</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 block">Departamentos</label>
                      <Select
                        value={numDepartments.toString()}
                        onValueChange={(v) => setNumDepartments(Number(v))}
                        disabled={selectedPlanUI !== 'chatbots'}
                      >
                        <SelectTrigger className="h-12 bg-white border-gray-200 rounded-xl"><SelectValue placeholder="1" /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map(num => (
                            <SelectItem key={num} value={num.toString()}>{num} {num === 1 ? 'Dept' : 'Depts'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedPlanUI === 'chatbots' && numDepartments > 1 && <p className="text-xs text-green-600 font-medium">+{(numDepartments - 1) * 15}€/mes extra</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* === DERECHA: FORMULARIO LIMPIO === */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-8 space-y-4">

              <div className="bg-white text-gray-900 rounded-[2rem] p-6 md:p-8 shadow-xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF0000] opacity-5 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>

                <div className="relative z-10">
                  <p className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">Resumen</p>
                  <div className="flex justify-between items-end border-b border-gray-100 pb-6 mb-6">
                    <div>
                      <h3 className="text-xl font-bold">{selectedPlanUI === 'templates' ? 'Pequeña Empresa' : 'UNMI Pro'}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {numLocations} {numLocations === 1 ? 'Sede' : 'Sedes'} • {numDepartments} {numDepartments === 1 ? 'Dept' : 'Depts'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tighter">€{calculateTotal()}</span>
                    </div>
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl h-12 mb-6">
                      <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-[#FF0000] data-[state=active]:text-white text-gray-600">{t("auth.register.title")}</TabsTrigger>
                      <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-[#FF0000] data-[state=active]:text-white text-gray-600">{t("auth.login.title")}</TabsTrigger>
                    </TabsList>

                    {/* FORMULARIO DE REGISTRO */}
                    <TabsContent value="register">
                      <Form {...registerForm}>
                        <form
                          onSubmit={registerForm.handleSubmit(handleRegister, onFormError)}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={registerForm.control} name="username" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder={t("auth.register.fullName")} {...field} className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 h-11 rounded-xl focus:border-[#FF0000] shadow-sm" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={registerForm.control} name="companyName" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder={t("auth.register.companyName")} {...field} className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 h-11 rounded-xl focus:border-[#FF0000] shadow-sm" /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                          <FormField control={registerForm.control} name="email" render={({ field }) => (
                            <FormItem><FormControl><Input placeholder={t("auth.register.email")} {...field} className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 h-11 rounded-xl focus:border-[#FF0000] shadow-sm" /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={registerForm.control} name="password" render={({ field }) => (
                            <FormItem><FormControl><Input type="password" placeholder={t("auth.register.password")} {...field} className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 h-11 rounded-xl focus:border-[#FF0000] shadow-sm" /></FormControl><FormMessage /></FormItem>
                          )} />

                          <FormField control={registerForm.control} name="termsAccepted" render={({ field }) => (
                            <FormItem className="flex items-start space-x-2 pt-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="border-gray-300 data-[state=checked]:bg-[#FF0000] data-[state=checked]:border-[#FF0000]"
                                />
                              </FormControl>
                              <FormLabel className="text-xs text-gray-500 font-normal leading-tight">
                                {t("auth.register.terms")} <a href="#" className="underline text-[#FF0000] hover:text-red-700">{t("auth.register.termsLink")}</a>
                              </FormLabel>
                            </FormItem>
                          )} />

                          <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-[#FF0000] hover:bg-[#cc0000] text-white rounded-xl text-lg font-bold mt-2 shadow-lg hover:shadow-xl transition-all group">
                            {isSubmitting ? (
                              <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> Procesando...</span>
                            ) : (
                              <span className="flex items-center">
                                Pagar y Comenzar <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                              </span>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </TabsContent>

                    {/* FORMULARIO DE LOGIN */}
                    <TabsContent value="login">
                      <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                          <FormField control={loginForm.control} name="email" render={({ field }) => (
                            <FormItem><FormControl><Input placeholder={t("auth.login.email")} {...field} className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 h-11 rounded-xl focus:border-[#FF0000] shadow-sm" /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={loginForm.control} name="password" render={({ field }) => (
                            <FormItem><FormControl><Input type="password" placeholder={t("auth.login.password")} {...field} className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 h-11 rounded-xl focus:border-[#FF0000] shadow-sm" /></FormControl><FormMessage /></FormItem>
                          )} />
                          <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-[#FF0000] hover:bg-[#cc0000] text-white rounded-xl text-lg font-bold mt-6 shadow-lg hover:shadow-xl transition-all">
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
              </div>

              <div className="flex justify-center items-center gap-4 text-xs text-gray-500 mt-4">
                <span className="flex items-center"><ShieldCheck size={14} className="mr-1 text-green-600" /> SSL Secure</span>
                <span className="flex items-center"><Check size={14} className="mr-1 text-green-600" /> Stripe Verified</span>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-16 md:mt-24 border-t border-gray-200 pt-8 pb-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} UNMI Technologies SL. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  );
}