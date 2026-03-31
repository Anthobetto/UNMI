import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import {
  LayoutDashboard,
  MapPin,
  FileText,
  CreditCard,
  LogOut,
  TrendingUp,
  Phone,
  Bot,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { OfficialLogo } from "@/components/logo/official-logo";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const menuGroups = [
    {
      name: "MENÚ",
      items: [
        { name: t('nav.dashboard'), href: "/dashboard", icon: LayoutDashboard },
        { name: t('nav.profitability'), href: "/rentabilidad-unmi", icon: TrendingUp },
        { name: t('nav.telephony'), href: "/telefonia", icon: Phone },
        { name: t('nav.templates'), href: "/templates", icon: FileText }, 
        { name: t('nav.chatbots'), href: "/chatbots", icon: Bot }, 
        { name: t('nav.locations'), href: "/locations", icon: MapPin },
        { name: t('nav.plan'), href: "/plan", icon: CreditCard },
      ]
    }
  ];

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-[9999] flex h-screen w-72 flex-col bg-[#003366] border-r border-white/10 transition-all duration-300 lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* SIDEBAR HEADER */}
      <div className="flex items-center justify-between gap-2 px-6 py-6 lg:py-8">
        <Link href="/" className="flex items-center gap-3">
          <img 
            src="/logo-unmi-transparent.png" 
            alt="Logo" 
            className="h-10 w-auto object-contain brightness-0 invert" 
          />
        </Link>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto px-4">
        {/* Sidebar Menu */}
        <nav className="mt-4">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="mb-8">
              <h3 className="mb-4 ml-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                {group.name}
              </h3>

              <ul className="flex flex-col gap-1.5">
                {group.items.map((item, index) => {
                  const isActive = location === item.href;
                  return (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 rounded-2xl py-3 px-4 text-sm font-bold transition-all duration-200",
                          isActive 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" 
                            : "text-white/60 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-white/40 group-hover:text-white")} />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Logout at bottom */}
      <div className="p-6 mt-auto border-t border-white/5">
         <button
           onClick={handleLogout}
           className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors"
         >
           <LogOut className="h-5 w-5" />
           {t('nav.logout')}
         </button>
      </div>
    </aside>
  );
}
