import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MapPin,
  FileText,
  CreditCard,
  LogOut,
  User,
  Settings,
  HelpCircle,
  CreditCard as Billing,
  Files,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OfficialLogo } from "@/components/logo/official-logo";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Locations", href: "/locations", icon: MapPin },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Contents", href: "/contents", icon: Files },
  { name: "Pricing", href: "/pricing", icon: CreditCard },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  return (
    <div className="flex h-full flex-col unmi-container border-r border-gray-100 w-1/4">
      <div className="flex flex-1 flex-col gap-y-3 px-4 py-4">
        <div className="flex h-16 shrink-0 justify-center items-center">
          <OfficialLogo width={140} />
        </div>
        <nav className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex gap-x-2 rounded-md p-2 text-sm font-semibold leading-6 transition-all unmi-nav-link",
                location === item.href
                  ? "unmi-nav-active"
                  : "text-[#003366]"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0",
                location === item.href ? "text-white" : "text-[#003366]"
              )} />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-gray-200 py-3 px-3">
        <div className="flex items-center gap-x-2">
          <div className="flex-1">
            <p className="text-xs font-semibold leading-6 text-[#003366]">
              {user?.username}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-8 w-8"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="h-4 w-4 text-[#003366]" />
          </Button>
        </div>
      </div>
    </div>
  );
}