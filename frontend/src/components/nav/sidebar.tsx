/**
 * Sidebar Component - Main Navigation
 * i18n enabled with conditional access based on planType
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import {
  LayoutDashboard,
  MapPin,
  FileText,
  CreditCard,
  LogOut,
  Menu,
  TrendingUp,
  Phone,
  Bot
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { OfficialLogo } from "@/components/logo/official-logo";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth(); // ✅ usamos logout directamente
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const navigation = [
    { name: t('nav.dashboard'), href: "/dashboard", icon: LayoutDashboard },
    { name: t('nav.profitability'), href: "/rentabilidad-unmi", icon: TrendingUp },
    { name: t('nav.telephony'), href: "/telefonia", icon: Phone },
    { name: t('nav.templates'), href: "/templates", icon: FileText, requiredPlan: 'templates' },
    { name: t('nav.chatbots'), href: "/chatbots", icon: Bot, requiredPlan: 'chatbots' },
    { name: t('nav.locations'), href: "/locations", icon: MapPin },
    { name: t('nav.plan'), href: "/plan", icon: CreditCard },
  ];

  const NavLinks = (
    <nav className="flex flex-col gap-y-1 mt-4 px-2">
      {navigation.map((item) => {
        const hasAccess = !item.requiredPlan || user?.planType === item.requiredPlan;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-all",
              location === item.href
                ? "bg-[#003366] text-white"
                : "text-[#003366] hover:bg-gray-100",
              !hasAccess && "opacity-60"
            )}
            onClick={() => setOpen(false)}
          >
            <item.icon
              className={cn(
                "h-5 w-5 shrink-0",
                location === item.href ? "text-white" : "text-[#003366]"
              )}
            />
            <span className="flex-1">{item.name}</span>
            {!hasAccess && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Pro</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const UserBlock = (
    <div className="border-t border-gray-200 py-4 px-4">
      <div className="flex items-center gap-x-3">
        <p className="flex-1 text-sm font-semibold text-[#003366]">
          {user?.username}
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-9 w-9"
          onClick={async () => {
            await logout(); // ✅ llamada directa a logout()
            setLocation("/"); // redirige a landing
          }}
        >
          <LogOut className="h-5 w-5 text-[#003366]" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:h-screen border-r border-gray-100">
        <div className="flex h-24 items-center justify-center">
          <OfficialLogo width={200} />
        </div>
        {NavLinks}
        <div className="mt-auto">{UserBlock}</div>
      </aside>

      {/* Mobile trigger + drawer */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center p-2 border-b border-gray-100 bg-white">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6 text-[#003366]" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 inset-y-0 flex flex-col">
            <div className="flex h-24 items-center justify-center border-b border-gray-100">
              <OfficialLogo width={200} />
            </div>
            {NavLinks}
            <div className="mt-auto">{UserBlock}</div>
          </SheetContent>
        </Sheet>
        <div className="flex-1 text-center font-bold text-[#003366]">
          {user?.username}
        </div>
      </div>
    </>
  );
}
