// LandingPage.tsx
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  Menu,
  X,
  Moon,
  Sun,
  ArrowRight,
  MessageCircle,
  ServerIcon,
  Globe,
  User,
  Phone,
  Clock,
  BarChart,
  Building,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTheme } from "@/hooks/useTheme";
import { OfficialLogo } from "@/components/logo/official-logo";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "react-i18next";
import { Meteors } from "@/components/ui/meteors";
import { GlowCard } from "@/components/ui/spotlight-card";

export default function LandingPage(): JSX.Element {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId.replace("#", ""));
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(sectionId);
    }
  };

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const featuresUNMI = [
    {
      title: t("features.unmi.omnichannel.title", "Omnichannel Messaging"),
      description: t(
        "features.unmi.omnichannel.description",
        "Seamlessly manage WhatsApp, SMS, and voice calls from one unified dashboard, ensuring no customer inquiry goes unanswered."
      ),
      icon: <MessageCircle className="size-5" />,
    },
    {
      title: t("features.unmi.routing.title", "Intelligent Call Routing"),
      description: t(
        "features.unmi.routing.description",
        "Our smart routing system ensures calls reach the right location or department, reducing missed opportunities and improving customer satisfaction."
      ),
      icon: <Phone className="size-5" />,
    },
    {
      title: t("features.unmi.autoResponse.title", "Automated Responses"),
      description: t(
        "features.unmi.autoResponse.description",
        "Instantly engage with customers even outside business hours with intelligent templates that provide the information they need."
      ),
      icon: <Clock className="size-5" />,
    },
    {
      title: t("features.unmi.analytics.title", "Performance Analytics"),
      description: t(
        "features.unmi.analytics.description",
        "Gain valuable insights with comprehensive analytics on call volumes, response times, and conversion rates to optimize your communication strategy."
      ),
      icon: <BarChart className="size-5" />,
    },
    {
      title: t("features.unmi.multiLocation.title", "Multi-Location Support"),
      description: t(
        "features.unmi.multiLocation.description",
        "Easily manage multiple business locations from a single dashboard, with customized settings and reporting for each site."
      ),
      icon: <Building className="size-5" />,
    },
    {
      title: t("features.unmi.revenueCalc.title", "Revenue Calculator"),
      description: t(
        "features.unmi.revenueCalc.description",
        "Our integrated calculator helps you track the direct financial impact of improved communication, showing the ROI of your Unmi investment."
      ),
      icon: (
        <div className="rounded-full bg-[#FF0000] size-5 flex items-center justify-center text-white font-bold text-xs">
          €
        </div>
      ),
    },
  ];

  const featuresChatbot = [
    {
      title: t("features.chatbot.engagement.title", "Omni-Channel Engagement"),
      description: t(
        "features.chatbot.engagement.description",
        "Seamlessly manage conversations across WhatsApp, and voice calls from one unified interface."
      ),
      icon: <Globe className="size-5" />,
    },
    {
      title: t("features.chatbot.availability.title", "24/7 Availability"),
      description: t(
        "features.chatbot.availability.description",
        "Handle customer queries any time of day or night without manual intervention."
      ),
      icon: <Clock className="size-5" />,
    },
    {
      title: t("features.chatbot.personalization.title", "AI-Powered Personalization"),
      description: t(
        "features.chatbot.personalization.description",
        "Leverage AI to deliver tailored responses based on user context and history."
      ),
      icon: <User className="size-5" />,
    },
    {
      title: t("features.chatbot.scalable.title", "Scalable Architecture"),
      description: t(
        "features.chatbot.scalable.description",
        "Automatically scale to handle growing chat volumes without impacting performance."
      ),
      icon: <ServerIcon className="size-5" />,
    },
    {
      title: t("features.chatbot.analytics.title", "Real-Time Analytics"),
      description: t(
        "features.chatbot.analytics.description",
        "Get instant insights on response times, user satisfaction, and resolution rates."
      ),
      icon: <BarChart className="size-5" />,
    },
    {
      title: t("features.chatbot.costCalc.title", "Cost Efficiency Calculator"),
      description: t(
        "features.chatbot.costCalc.description",
        "Estimate your ROI and savings by automating chat workflows with our built-in calculator."
      ),
      icon: (
        <div className="rounded-full bg-[#F59E0B] size-5 flex items-center justify-center text-white font-bold text-xs">
          €
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] relative">
      {/* Global Fixed Meteor Background */}
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden h-screen w-full">
        <Meteors number={60} />
      </div>

      <header
        className={`sticky top-0 z-50 w-full backdrop-blur-lg transition-all duration-300 ${isScrolled ? "bg-background/80 shadow-sm" : "bg-transparent"
          }`}
      >
        <div className="container flex h-20 items-center justify-between relative">
          {/* Logo - Left Side */}
          <div className="flex items-center gap-2 font-bold z-10">
            <div className="mb-3">
              <OfficialLogo width={220} />
            </div>
          </div>

          {/* Navigation - Desktop Centered */}
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-2 items-center p-1 rounded-full">
            {[
              { id: "#features", label: t("landing.nav.features", "Features") },
              { id: "#how-it-works", label: t("landing.nav.howItWorks", "Cómo funciona") },
              { id: "#pricing", label: t("landing.nav.pricing", "Pricing") },
              { id: "#faq", label: t("header.nav.faq", "FAQ") },
            ].map((navItem) => (
              <button
                key={navItem.id}
                onClick={() => scrollToSection(navItem.id)}
                className={`px-5 py-2 text-sm font-bold rounded-full transition-all duration-300 hover:scale-105 will-change-transform backface-visibility-hidden transform-gpu ${
                  activeSection === navItem.id
                    ? "bg-[#FF0000] text-white shadow-lg shadow-[#FF0000]/20"
                    : "text-muted-foreground hover:bg-[#FF0000]/10 hover:text-[#FF0000]"
                }`}
              >
                {navItem.label}
              </button>
            ))}
          </nav>

          {/* Right Controls - Desktop */}
          <div className="hidden md:flex items-center gap-6 z-10">
            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full hover:bg-muted/50">
              {mounted && theme === "dark" ? <Sun className="size-6" /> : <Moon className="size-6" />}
              <span className="sr-only">{t("header.toggleTheme", "Toggle theme")}</span>
            </Button>

            {/* Access link */}
            <Link
              to="/auth"
              className="text-lg font-bold text-muted-foreground transition-all hover:text-foreground border-2 border-transparent hover:border-[#FF0000]/20 px-4 py-1.5 rounded-full"
            >
              {t("landing.access", "Access")}
            </Link>

            {/* Language selector */}
            <LanguageSelector />
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-4 md:hidden ml-auto">
            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {mounted && theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>

            {/* Language selector */}
            <div className="flex items-center gap-2">
              <LanguageSelector />
            </div>

            {/* Mobile menu */}
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
              <span className="sr-only">{t("header.toggleMenu", "Toggle menu")}</span>
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-16 inset-x-0 bg-background/95 backdrop-blur-lg border-b"
          >
            <div className="container py-4 flex flex-col gap-4">
              <Link to="#features" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t("header.nav.features", "Features")}
              </Link>
              <Link to="#how-it-works" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t("landing.nav.howItWorks", "Cómo funciona")}
              </Link>
              <Link to="#pricing" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t("header.nav.pricing", "Pricing")}
              </Link>
              <Link to="#faq" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t("header.nav.faq", "FAQ")}
              </Link>

              <div className="flex flex-col gap-2 pt-2 border-t">
                <Link to="/auth" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  {t("header.access", "Access")}
                </Link>
                <div className="flex items-center gap-2">
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="rounded-full bg-[#FF0000] hover:bg-[#D32F2F] w-full">
                      {t("header.trial", "Start Today")}
                      <ChevronRight className="ml-1 size-4" />
                    </Button>
                  </Link>
                  <LanguageSelector />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      <main className="flex-1">
        <section className="w-full py-10 md:py-22 lg:py-30 overflow-hidden relative">
          <div className="container px-4 md:px-6 relative">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto mb-12"
            >
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 leading-tight px-4">
                {t("hero.title", "Transform Your Business Communication Strategy")}
              </h1>
              <p className="text-sm sm:text-base md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto px-6">
                {t("hero.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth?tab=register">
                  <Button size="lg" className="rounded-full h-12 px-8 text-base bg-[#FF0000] hover:bg-[#D32F2F]">
                    {t("hero.cta", "Start Today")}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
              </div>
              
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative mx-auto max-w-5xl group"
            >
              <Link to="/">
                <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/40 bg-gradient-to-b from-background to-muted/20 transition-all duration-500 group-hover:scale-[1.01] group-hover:shadow-[0_0_40px_rgba(255,0,0,0.8)] group-hover:border-[#FF0000]/20">
                  <img
                    src="/business-communication-dashboard-with-whatsapp-sms.png"
                    alt={t("hero.imageAlt", "Unmi dashboard")}
                    className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                  <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10 dark:ring-white/10"></div>
                </div>
              </Link>
              {/* Central Uniform Glow Aura */}
              <div className="absolute inset-0 -z-10 bg-[#FF0000]/10 blur-[100px] rounded-full scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"></div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-16 md:py-32 relative overflow-hidden">
          <div className="container px-4 md:px-6 relative">
            <div className="text-center mb-12 md:mb-16">
              <Badge className="rounded-full px-4 py-1.5 text-xs md:text-sm font-semibold mb-4 bg-[#FF0000]/10 text-[#FF0000] border-[#FF0000]/20 hover:bg-[#FF0000]/20 transition-colors" variant="outline">
                {t("howItWorks.badge", "Proceso Simple")}
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                {t("howItWorks.title", "Cómo funciona UNMI")}
              </h2>
              <p className="max-w-[700px] mx-auto text-muted-foreground text-base md:text-xl leading-relaxed px-2">
                {t("howItWorks.description", "Transformamos tus llamadas perdidas en oportunidades de negocio en solo tres pasos.")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <GlowCard glowColor="red" customSize={true} className="h-full">
                  <Card className="h-full bg-transparent border-none shadow-none group transition-all duration-500">
                    <CardContent className="p-6 md:p-10 flex flex-col items-center text-center">
                      <div className="size-16 md:size-20 rounded-3xl bg-white dark:bg-white/5 shadow-inner flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                        <Phone className="size-8 md:size-10 text-muted-foreground group-hover:text-[#FF0000] transition-colors" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 group-hover:text-[#FF0000] transition-colors">
                        {t("howItWorks.step1.title", "Llamada Perdida")}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        {t("howItWorks.step1.description", "Un cliente llama a tu empresa y no hay respuesta en ese momento.")}
                      </p>
                    </CardContent>
                  </Card>
                </GlowCard>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <GlowCard glowColor="red" customSize={true} className="h-full">
                  <Card className="h-full bg-transparent border-none shadow-none group transition-all duration-500">
                    <CardContent className="p-10 flex flex-col items-center text-center">
                      <div className="size-20 rounded-3xl bg-white dark:bg-white/5 shadow-inner flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                        <Zap className="size-10 text-muted-foreground group-hover:text-[#FF0000] transition-colors" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4 group-hover:text-[#FF0000] transition-colors">
                        {t("howItWorks.step2.title", "Captura Inteligente")}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {t("howItWorks.step2.description", "UNMI detecta el evento al instante y captura el número de teléfono del cliente.")}
                      </p>
                    </CardContent>
                  </Card>
                </GlowCard>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <GlowCard glowColor="red" customSize={true} className="h-full">
                  <Card className="h-full bg-transparent border-none shadow-none group transition-all duration-500">
                    <CardContent className="p-10 flex flex-col items-center text-center">
                      <div className="size-20 rounded-3xl bg-white dark:bg-white/5 shadow-inner flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                        <MessageCircle className="size-10 text-muted-foreground group-hover:text-[#FF0000] transition-colors" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4 group-hover:text-[#FF0000] transition-colors">
                        {t("howItWorks.step3.title", "WhatsApp Instantáneo")}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {t("howItWorks.step3.description", "El cliente recibe un mensaje automático para continuar la atención sin esperas.")}
                      </p>
                    </CardContent>
                  </Card>
                </GlowCard>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-16 md:py-32 relative overflow-hidden">
          {/* Decoración de fondo - Orbes de luz sutiles */}
          <div className="absolute top-1/4 -left-20 w-72 h-72 bg-[#FF0000]/5 rounded-full blur-[120px] -z-10" />
          <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-[#F59E0B]/5 rounded-full blur-[120px] -z-10" />

          <div className="container px-4 md:px-6 text-center mb-12 md:mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="rounded-full px-4 py-1.5 text-xs md:text-sm font-semibold mb-4 bg-[#FF0000]/10 text-[#FF0000] border-[#FF0000]/20 hover:bg-[#FF0000]/20 transition-colors" variant="outline">
                {t("features.badge", "Potencia tu Comunicación")}
              </Badge>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-white/70 px-2">
                {t("features.title", "Compara UNMI vs Chatbot AI")}
              </h2>
              <p className="max-w-[700px] mx-auto text-gray-500 text-sm sm:text-base md:text-xl leading-relaxed px-4">
                {t("features.description", "Elige entre la automatización inteligente basada en llamadas de UNMI o un asistente conversacional de IA completo.")}
              </p>
            </motion.div>
          </div>

          <div className="container px-4 md:px-6">
            <Tabs defaultValue="unmi" className="w-full">
              <div className="flex justify-center mb-10 md:mb-12">
                <TabsList className="bg-gray-100/80 dark:bg-white/5 p-1 rounded-xl md:rounded-2xl h-auto border border-gray-200/50 dark:border-white/10 backdrop-blur-sm">
                  <TabsTrigger 
                    value="unmi" 
                    className="rounded-lg md:rounded-xl px-4 md:px-8 py-2 md:py-3 text-xs md:text-base font-bold data-[state=active]:bg-white data-[state=active]:text-[#FF0000] data-[state=active]:shadow-md transition-all duration-300"
                  >
                    {t("features.tabs.unmi", "Automatización UNMI")}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="chatbot" 
                    className="rounded-lg md:rounded-xl px-4 md:px-8 py-2 md:py-3 text-xs md:text-base font-bold data-[state=active]:bg-white data-[state=active]:text-[#F59E0B] data-[state=active]:shadow-md transition-all duration-300"
                  >
                    {t("features.tabs.chatbot", "Chatbot Inteligente")}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="unmi" className="mt-0 focus-visible:outline-none">
                <motion.div
                  variants={container}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {featuresUNMI.map((feature, i) => (
                    <motion.div key={i} variants={item}>
                      <GlowCard glowColor="red" customSize={true} className="h-full group">
                        <Card className="relative h-full overflow-hidden border-none bg-transparent shadow-none transition-all duration-500 rounded-3xl">
                          <CardContent className="p-6 md:p-8 flex flex-col h-full relative z-10">
                            <div className="size-12 md:size-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-[#FF0000]/10 group-hover:text-[#FF0000] transition-all duration-500 shadow-inner mb-4 md:mb-6">
                              {feature.icon}
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-gray-900 dark:text-white group-hover:text-[#FF0000] transition-colors">
                              {feature.title}
                            </h3>
                            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                              {feature.description}
                            </p>
                            <a 
                              href="#pricing" 
                              className="mt-auto pt-4 md:pt-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-xs md:text-sm font-bold text-[#FF0000] hover:underline"
                            >
                              Saber más <ArrowRight className="ml-2 size-4" />
                            </a>
                          </CardContent>
                        </Card>
                      </GlowCard>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>

              <TabsContent value="chatbot" className="mt-0 focus-visible:outline-none">
                <motion.div
                  variants={container}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {featuresChatbot.map((feature, i) => (
                    <motion.div key={i} variants={item}>
                      <GlowCard glowColor="orange" customSize={true} className="h-full group">
                        <Card className="relative h-full overflow-hidden border-none bg-transparent shadow-none transition-all duration-500 rounded-3xl">
                          <CardContent className="p-8 flex flex-col h-full relative z-10">
                            <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-[#F59E0B]/10 group-hover:text-[#F59E0B] transition-all duration-500 shadow-inner">
                              {feature.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-[#F59E0B] transition-colors">
                              {feature.title}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                              {feature.description}
                            </p>
                            <a 
                              href="#pricing" 
                              className="mt-auto pt-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-sm font-bold text-[#F59E0B] hover:underline"
                            >
                              Descubrir más <ArrowRight className="ml-2 size-4" />
                            </a>
                          </CardContent>
                        </Card>
                      </GlowCard>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-24 md:py-32 relative overflow-hidden">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <Badge className="rounded-full px-4 py-1.5 text-sm font-semibold mb-4 bg-[#FF0000]/10 text-[#FF0000] border-[#FF0000]/20 hover:bg-[#FF0000]/20 transition-colors" variant="outline">
                Precios Transparentes
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Planes diseñados para tu éxito</h2>
              <p className="max-w-[700px] mx-auto text-gray-500 md:text-xl leading-relaxed">
                Escala tu comunicación con soluciones que crecen contigo. Sin costes ocultos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
              {/* Plan Pequeña Empresa */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -10 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-white dark:bg-white/5 rounded-[2.5rem] border-2 border-gray-200 dark:border-white/10 p-10 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col cursor-pointer"
              >
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2 text-blue-600">Pequeña Empresa</h3>
                  <p className="text-gray-500 text-sm">Todo lo esencial para empezar.</p>
                </div>
                <div className="mb-8">
                  <span className="text-5xl font-bold tracking-tighter">€60</span>
                  <span className="text-gray-500 ml-2">/mes</span>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3 text-sm">
                    <Check className="size-5 text-blue-500 flex-shrink-0" />
                    <span>150 mensajes/mes incluidos</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <Check className="size-5 text-blue-500 flex-shrink-0" />
                    <span>1 Localización física</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <Check className="size-5 text-blue-500 flex-shrink-0" />
                    <span>Respuesta automática a llamadas</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <Check className="size-5 text-blue-500 flex-shrink-0" />
                    <span>Panel de control básico</span>
                  </li>
                </ul>
                <Link to="/auth?tab=register&plan=small">
                  <Button className="w-full h-14 rounded-2xl text-lg font-bold border-2 border-blue-100 hover:bg-blue-50 text-blue-600 transition-all" variant="outline">
                    Elegir Plan
                  </Button>
                </Link>
              </motion.div>

              {/* Plan PRO */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.1, y: -15 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                className="bg-white dark:bg-white/5 rounded-[2.5rem] border-2 border-[#FF0000] p-10 shadow-2xl shadow-[#FF0000]/10 relative overflow-hidden flex flex-col scale-105 z-10 cursor-pointer"
              >
                <div className="absolute top-0 right-0 bg-[#FF0000] text-white px-6 py-1.5 rounded-bl-2xl text-xs font-bold uppercase tracking-widest">
                  Popular
                </div>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">UNMI Pro</h3>
                  <p className="text-gray-500 text-sm">Optimiza tu atención al cliente.</p>
                </div>
                <div className="mb-8">
                  <span className="text-5xl font-bold tracking-tighter">€120</span>
                  <span className="text-gray-500 ml-2">/mes</span>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3 text-sm font-bold">
                    <Check className="size-5 text-green-500 flex-shrink-0" />
                    <span>360 mensajes/mes incluidos</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold">
                    <Check className="size-5 text-green-500 flex-shrink-0" />
                    <span>Hasta 3 Localizaciones</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold">
                    <Check className="size-5 text-green-500 flex-shrink-0" />
                    <span>Chatbots de IA personalizados</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold">
                    <Check className="size-5 text-green-500 flex-shrink-0" />
                    <span>Analítica avanzada</span>
                  </li>
                </ul>
                <Link to="/auth?tab=register&plan=pro">
                  <Button className="w-full h-14 rounded-2xl text-lg font-bold bg-[#FF0000] hover:bg-[#D32F2F] text-white shadow-lg shadow-[#FF0000]/20 transition-all">
                    Elegir Plan Pro
                  </Button>
                </Link>
              </motion.div>

              {/* Plan PREMIUM */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -10 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                className="bg-white dark:bg-white/5 rounded-[2.5rem] border-2 border-gray-200 dark:border-white/10 p-10 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col cursor-pointer"
              >
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2 text-[#FF0000]">UNMI Premium</h3>
                  <p className="text-gray-500 text-sm">Escalabilidad total sin límites.</p>
                </div>
                <div className="mb-8">
                  <span className="text-5xl font-bold tracking-tighter">€200</span>
                  <span className="text-gray-500 ml-2">/mes</span>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3 text-sm font-bold">
                    <Check className="size-5 text-[#FF0000] flex-shrink-0" />
                    <span>Mensajes ILIMITADOS</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold">
                    <Check className="size-5 text-[#FF0000] flex-shrink-0" />
                    <span>Multi-Localización ilimitada</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold">
                    <Check className="size-5 text-[#FF0000] flex-shrink-0" />
                    <span>IA de Voz Avanzada</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold">
                    <Check className="size-5 text-[#FF0000] flex-shrink-0" />
                    <span>Soporte Prioritario 24/7</span>
                  </li>
                </ul>
                <Link to="/auth?tab=register&plan=premium">
                  <Button className="w-full h-14 rounded-2xl text-lg font-bold border-2 border-[#FF0000] hover:bg-[#FF0000]/5 text-[#FF0000] transition-all" variant="outline">
                    Elegir Premium
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full py-24 md:py-32 relative overflow-hidden">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <Badge className="rounded-full px-4 py-1.5 text-sm font-semibold mb-4 bg-[#FF0000]/10 text-[#FF0000] border-[#FF0000]/20 hover:bg-[#FF0000]/20 transition-colors" variant="outline">
                {t("faq.badge", "Dudas frecuentes")}
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Preguntas Frecuentes</h2>
              <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl leading-relaxed">
                Todo lo que necesitas saber sobre UNMI y cómo puede ayudar a tu negocio.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <GlowCard glowColor="red" customSize={true} className="w-full">
                <Card className="bg-transparent border-none shadow-none rounded-[2.5rem] overflow-hidden">
                  <CardContent className="p-8 md:p-12">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1" className="border-b-border/40 py-2">
                        <AccordionTrigger className="text-left font-bold text-lg hover:text-[#FF0000] transition-colors">
                          ¿Cómo se configura el desvío de llamadas?
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                          Es muy sencillo. Solo tienes que marcar un código estándar en tu teléfono (ej: *61*número_unmi#) para activar el desvío cuando no contestes. Nosotros te guiaremos paso a paso en el panel de control.
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-2" className="border-b-border/40 py-2">
                        <AccordionTrigger className="text-left font-bold text-lg hover:text-[#FF0000] transition-colors">
                          ¿Tengo que cambiar mi número actual?
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                          No, en absoluto. Sigues usando tu número de siempre para recibir llamadas. UNMI solo entra en acción si no puedes contestar, capturando la llamada perdida para enviar el WhatsApp automático.
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-3" className="border-b-border/40 py-2">
                        <AccordionTrigger className="text-left font-bold text-lg hover:text-[#FF0000] transition-colors">
                          ¿Qué pasa si el cliente no tiene WhatsApp?
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                          Si el sistema detecta que el número no tiene WhatsApp activo, UNMI puede enviar un SMS automático con la misma información, asegurando que el contacto nunca se pierda.
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-4" className="border-b-border/40 py-2">
                        <AccordionTrigger className="text-left font-bold text-lg hover:text-[#FF0000] transition-colors">
                          ¿Cómo funciona el periodo de prueba?
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                          Ofrecemos 14 días de prueba gratuita con todas las funciones activas. Puedes configurar tu número y ver cuántas llamadas recuperas antes de decidirte por un plan.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </GlowCard>
            </div>
          </div>
        </section>

        {/* CTA Section - Final Cierre */}
        <section className="w-full py-24 md:py-32 relative overflow-hidden">
          <div className="container px-4 md:px-6 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              <GlowCard glowColor="red" customSize={true} className="w-full">
                <Card className="bg-transparent border-none shadow-none rounded-[3rem] overflow-hidden">
                  <CardContent className="p-12 md:p-20 text-center relative">
                    {/* Glow decorativo interno */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-[#FF0000]/5 blur-[80px] -z-10" />
                    
                    <h2 className="text-4xl md:text-5xl lg:text-5xl font-bold tracking-tight mb-10 leading-tight">
                      {t("cta.title", "Lleva la comunicación de tu negocio al siguiente nivel")}
                    </h2>
                    <div className="flex justify-center">
                      <Link to="/auth?tab=register">
                        <Button size="lg" className="rounded-full h-16 px-12 text-xl bg-[#FF0000] hover:bg-[#D32F2F] shadow-2xl shadow-[#FF0000]/40 transition-all duration-500 hover:scale-110 active:scale-95 group">
                          {t("hero.cta", "Start Today")}
                          <ArrowRight className="ml-3 size-6 group-hover:translate-x-2 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </GlowCard>
            </motion.div>
          </div>
        </section>

      </main>
      <footer className="w-full py-12 border-t border-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h5 className="font-bold text-gray-900 mb-4">UNMI Technologies</h5>
              <p className="text-sm text-gray-500">{t("footer.description")}</p>
            </div>
            <div>
              <h5 className="font-bold text-gray-900 mb-4">{t("footer.legal.title")}</h5>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-[#FF0000]">{t("footer.legal.terms")}</a></li>
                <li><a href="#" className="hover:text-[#FF0000]">{t("footer.legal.privacy")}</a></li>
                <li><a href="#" className="hover:text-[#FF0000]">{t("footer.legal.cookies")}</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-gray-900 mb-4">{t("footer.product.title")}</h5>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-[#FF0000]">{t("nav.chatbots")}</a></li>
                <li><a href="#" className="hover:text-[#FF0000]">{t("nav.templates")}</a></li>
                <li><a href="#" className="hover:text-[#FF0000]">{t("footer.product.integrations")}</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-gray-900 mb-4">{t("footer.support.title")}</h5>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-[#FF0000]">{t("footer.support.helpCenter")}</a></li>
                <li><a href="#" className="hover:text-[#FF0000]">{t("footer.support.status")}</a></li>
                <li><a href="#" className="hover:text-[#FF0000]">{t("footer.support.sales")}</a></li>
              </ul>
            </div>
          </div>

          <div className="text-center text-xs text-gray-400 border-t border-gray-100 pt-6">
            © {new Date().getFullYear()} UNMI SL. {t("footer.rights")} Madrid, España.
          </div>
        </div>
      </footer>
    </div>
  );
}
