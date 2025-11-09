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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/hooks/useTheme";
import { OfficialLogo } from "@/components/logo/official-logo";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "react-i18next";

export default function LandingPage(): JSX.Element {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

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
    <div className="flex flex-col items-center justify-center min-h-[100dvh]">
      <header
        className={`sticky top-0 z-50 w-full backdrop-blur-lg transition-all duration-300 ${
          isScrolled ? "bg-background/80 shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 font-bold">
            <div className="mb-3">
              <OfficialLogo width={220} />
            </div>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex gap-8 items-center">
            <Link
              to="#featuresUNMI"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("landing.nav.features", "Features")}
            </Link>
            <Link
              to="#testimonials"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("landing.nav.testimonials", "Testimonials")}
            </Link>
            <Link
              to="#pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("landing.nav.pricing", "Pricing")}
            </Link>
            <Link
              to="#faq"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("header.nav.faq", "FAQ")}
            </Link>
          </nav>

          {/* Right Controls - Desktop */}
          <div className="hidden md:flex items-center gap-4 ml-auto">
            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {mounted && theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
              <span className="sr-only">{t("header.toggleTheme", "Toggle theme")}</span>
            </Button>

            {/* Access link */}
            <Link
              to="/auth"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("landing.access", "Access")}
            </Link>

            {/* Start Today button */}
            <Link to="/auth">
              <Button className="rounded-full bg-[#FF0000] hover:bg-[#D32F2F]">
                {t("landing.trial", "Start Today")}
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </Link>

            {/* Language selector */}
            <LanguageSelector />
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-4 md:hidden ml-auto">
            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {mounted && theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </Button>

            {/* Start Today + Language selector */}
            <div className="flex items-center gap-2">
              <Link to="/auth">
                <Button className="rounded-full bg-[#FF0000] hover:bg-[#D32F2F]">
                  {t("header.trial", "Start Today")}
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </Link>
              <LanguageSelector />
            </div>

            {/* Mobile menu */}
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
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
              <Link to="#featuresUNMI" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t("header.nav.features", "Features")}
              </Link>
              <Link to="#testimonials" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t("header.nav.testimonials", "Testimonials")}
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
        <section className="w-full py-10 md:py-22 lg:py-30 overflow-hidden">
          <div className="container px-4 md:px-6 relative">
            <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto mb-12"
            >
              <Badge className="mb-4 rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                {t("hero.badge", "Transform Your Business")}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                {t("hero.title", "Transform Your Business Communication Strategy")}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t(
                  "hero.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth?tab=register">
                  <Button size="lg" className="rounded-full h-12 px-8 text-base bg-[#FF0000] hover:bg-[#D32F2F]">
                    {t("hero.cta", "Start Today")}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Check className="size-4 text-[#FF0000]" />
                  <span>{t("hero.features.trial", "Start Today")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="size-4 text-[#FF0000]" />
                  <span>{t("hero.features.cancel", "Cancel anytime")}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative mx-auto max-w-5xl"
            >
              <Link to="/">
                <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/40 bg-gradient-to-b from-background to-muted/20">
                  <img
                    src="/business-communication-dashboard-with-whatsapp-sms.png"
                    alt={t("hero.imageAlt", "Unmi dashboard")}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10 dark:ring-white/10"></div>
                </div>
              </Link>
              <div className="absolute -bottom-6 -right-6 -z-10 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-[#FF0000]/30 to-[#D32F2F]/30 blur-3xl opacity-70"></div>
              <div className="absolute -top-6 -left-6 -z-10 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-[#D32F2F]/30 to-[#FF0000]/30 blur-3xl opacity-70"></div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-32">
          <div className="container px-4 md:px-6 text-center mb-12">
            <Badge className="rounded-full px-4 py-1.5 text-sm font-medium mb-4" variant="secondary">
              {t("features.badge", "Features")}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("features.title", "Compare UNMI vs Chatbot")}</h2>
            <p className="max-w-[800px] mx-auto text-muted-foreground md:text-lg">
              {t("features.description", "Toggle between UNMI's call-based automations and a full-fledged AI chatbot.")}
            </p>
          </div>

          <div className="container px-4 md:px-6 text-center">
            <Tabs defaultValue="unmi">
              <TabsList className="rounded-full p-1 inline-flex mb-8">
                <TabsTrigger value="unmi" className="rounded-full px-6">
                  {t("features.tabs.unmi", "UNMI")}
                </TabsTrigger>
                <TabsTrigger value="chatbot" className="rounded-full px-6">
                  {t("features.tabs.chatbot", "Chatbot")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="unmi">
                <motion.div
                  variants={container}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {featuresUNMI.map((feature, i) => (
                    <motion.div key={i} variants={item}>
                      <Card className="h-full overflow-hidden border-border/40 bg-gradient-to-b from-background to-muted/10 backdrop-blur hover:shadow-md transition-all">
                        <CardContent className="p-6 flex flex-col h-full">
                          <div className="size-10 rounded-full bg-[#FF0000]/10 dark:bg-[#FF0000]/20 flex items-center justify-center text-[#FF0000] mb-4">
                            {feature.icon}
                          </div>
                          <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>

              <TabsContent value="chatbot">
                <motion.div
                  variants={container}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {featuresChatbot.map((feature, i) => (
                    <motion.div key={i} variants={item}>
                      <Card className="h-full overflow-hidden border-border/40 bg-gradient-to-b from-background to-muted/10 backdrop-blur hover:shadow-md transition-all">
                        <CardContent className="p-6 flex flex-col h-full">
                          <div className="size-10 rounded-full bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] mb-4">
                            {feature.icon}
                          </div>
                          <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Resto de secciones del landing original... (se mantuvieron fuera por brevedad) */}
      </main>
      <footer className="mt-auto w-full border-t bg-background/95 backdrop-blur-sm">
        <div className="container flex flex-col items-center gap-8 px-4 py-10 md:px-6 lg:py-16">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 justify-items-center">
            <div className="space-y-4">
              <div className="flex gap-4 items-center justify-items-center font-bold">
                <OfficialLogo width={110} />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("footer.text", "Transform your business communication with our all-in-one platform.")}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row justify-between items-center border-t border-border/40 pt-8 w-full">
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Unmi. {t("footer.rights", "All rights reserved.")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
