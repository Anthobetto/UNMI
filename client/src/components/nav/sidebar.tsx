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
    <div className="flex h-full flex-col unmi-container border-r border-gray-100 w-[35%]">
      <div className="flex flex-1 flex-col gap-y-3 px-4 py-3">
        <div className="flex h-20 shrink-0 justify-center items-center py-1">
          <OfficialLogo width={150} />
        </div>
        <nav className="flex flex-1 flex-col gap-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-all unmi-nav-link w-full pr-8",
                location === item.href
                  ? "unmi-nav-active"
                  : "text-[#003366]"
              )}
            >
              <item.icon className={cn(
                "h-6 w-6 shrink-0",
                location === item.href ? "text-white" : "text-[#003366]"
              )} />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-gray-200 py-4 px-4">
        <div className="flex items-center gap-x-3">
          <div className="flex-1">
            <p className="text-sm font-semibold leading-6 text-[#003366]">
              {user?.username}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-9 w-9"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="h-5 w-5 text-[#003366]" />
          </Button>
        </div>
      </div>
    </div>
  );
}