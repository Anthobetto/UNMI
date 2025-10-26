/**
 * AuthPage - Login & Register with i18n
 * Compatible con el nuevo AuthContext (sin React Query)
 */
import { useAuth, loginSchema, LoginData, registerSchema, RegisterData } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OfficialLogo } from "@/components/logo/official-logo";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useEffect, useState } from "react";

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const tabParam = url.searchParams.get("tab");
    if (tabParam === "register") {
      setActiveTab("register");
    }
  }, [location]);

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
    },
  });

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
      const { url } = await register(data);

      if (url) {
        // ✅ En producción: redirigir al checkout de Stripe
        window.location.href = url;
      } else {
        // 🔄 fallback: ir al selector de plan local (si existe)
        setLocation("/plan");
      }
    } catch (err) {
      console.error("Error durante el registro:", err);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4] p-4 relative">
      {/* Selector de idioma */}
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div> 

      <Card className="w-full max-w-md shadow-sm bg-white rounded-3xl border-0">
        <CardContent className="p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="mb-3 cursor-pointer" onClick={() => setLocation("/")}>
              <OfficialLogo width={220} />
            </div>
            <p className="text-[#333333] text-center mt-2">
              {t("auth.register.tagline")}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 p-1 rounded-full">
              <TabsTrigger
                value="login"
                className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                {t("auth.login.title")}
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                {t("auth.register.title")}
              </TabsTrigger>
            </TabsList>

            {/* LOGIN */}
            <TabsContent value="login">
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(handleLogin)}
                  className="space-y-6"
                >
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#333333] font-medium">
                          {t("auth.login.email")}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="h-14 rounded-xl border-gray-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#333333] font-medium">
                          {t("auth.login.password")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            className="h-14 rounded-xl border-gray-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 rounded-full mt-6 bg-[#FF0000] hover:bg-[#D32F2F] text-white font-medium text-lg"
                  >
                    {isSubmitting
                      ? t("auth.login.loading")
                      : t("auth.login.submit")}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* REGISTER */}
            <TabsContent value="register">
              <Form {...registerForm}>
                <form
                  onSubmit={registerForm.handleSubmit(handleRegister)}
                  className="space-y-6"
                >
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#333333] font-medium">
                          {t("auth.register.fullName")}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="h-14 rounded-xl border-gray-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#333333] font-medium">
                          {t("auth.register.email")}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="h-14 rounded-xl border-gray-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#333333] font-medium">
                          {t("auth.register.password")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            className="h-14 rounded-xl border-gray-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#333333] font-medium">
                          {t("auth.register.companyName")}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="h-14 rounded-xl border-gray-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="termsAccepted"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              field.onChange(checked === true)
                            }
                          />
                        </FormControl>
                        <FormLabel className="text-sm">
                          {t("auth.register.terms")}
                          {" "}
                          <a href="/terms" className="underline">
                            {t("auth.register.termsLink")}
                          </a>{" "}
                          {t("auth.register.andThe")}{" "}
                          <a href="/privacy" className="underline">
                            {t("auth.register.privacy")}
                          </a>
                        </FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 rounded-full mt-6 bg-[#FF0000] hover:bg-[#D32F2F] text-white font-medium text-lg"
                  >
                    {isSubmitting ? t("auth.register.registering") : t("auth.register.title")}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
