import { useAuth } from "@/contexts/AuthContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Menu, Bell, HelpCircle } from "lucide-react";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-[99] px-4 md:px-6 py-4">
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          {/* Hamburger Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Menu className="h-6 w-6 text-slate-600" />
          </button>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <LanguageSelector />
          
          <div className="hidden md:flex items-center gap-3 border-l border-slate-100 pl-6">
            <button className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-[#003366] transition-all">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-[#003366] transition-all">
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
