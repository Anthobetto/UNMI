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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { OfficialLogo } from "@/components/logo/official-logo";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const userPlan = user?.planType || 'small'; 


  const navigation = [
    { name: t('nav.dashboard'), href: "/dashboard", icon: LayoutDashboard },
    { name: t('nav.profitability'), href: "/rentabilidad-unmi", icon: TrendingUp },
    { name: t('nav.telephony'), href: "/telefonia", icon: Phone },
    { name: t('nav.templates'), href: "/templates", icon: FileText }, 
    { name: t('nav.chatbots'), href: "/chatbots", icon: Bot }, 
    { name: t('nav.locations'), href: "/locations", icon: MapPin },
    { name: t('nav.plan'), href: "/plan", icon: CreditCard },
  ];

  // Ocultar Chatbots para 'small', podrías hacer:
  // if (userPlan === 'small') {
  //   navigation = navigation.filter(item => item.href !== '/chatbots');
  // }

  const renderNavItems = () => (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = location === item.href;

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-900"
              )}
            />
            <span className="flex-1 truncate">{item.name}</span>
            
          </Link>
        );
      })}
    </nav>
  );

  const UserBlock = (
    <div className="border-t border-gray-200 p-4">
      <div className="flex items-center gap-x-3 w-full">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {user?.username || "Usuario"}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {user?.email}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-8 w-8 hover:bg-red-50 hover:text-red-600 transition-colors"
          onClick={async () => {
            await logout();
            setLocation("/");
          }}
          title={t('nav.logout')}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:h-screen border-r border-gray-200 bg-white fixed left-0 top-0 z-30 shadow-sm">
        
        {/* Header Logo con el padding arreglado */}
        <div className="flex flex-col px-6 pt-8 pb-6">
          <OfficialLogo width={140} />
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {renderNavItems()}
        </div>

        <div className="mt-auto bg-gray-50/50">
          {UserBlock}
        </div>
      </aside>

      {/* Mobile trigger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-6 w-6 text-gray-700" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 inset-y-0 flex flex-col bg-white">
              <div className="flex flex-col px-6 pt-8 pb-6 border-b border-gray-100">
                <OfficialLogo width={130} />
              </div>
              <div className="flex-1 overflow-y-auto py-6 px-4">
                {renderNavItems()}
              </div>
              <div className="mt-auto bg-gray-50">
                {UserBlock}
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-bold text-lg text-[#003366]">UNMI</span>
        </div>
        <div className="text-sm font-medium text-gray-600">
          {user?.username?.substring(0, 2).toUpperCase()}
        </div>
      </div>
      <div className="md:hidden h-16" />
    </>
  );
}