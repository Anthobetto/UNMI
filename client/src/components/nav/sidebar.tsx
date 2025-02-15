import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MapPin,
  FileText,
  CreditCard,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Locations", href: "/locations", icon: MapPin },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Pricing", href: "/pricing", icon: CreditCard },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  return (
    <div className="flex h-full flex-col bg-sidebar border-r">
      <div className="flex flex-1 flex-col gap-y-4 px-6 py-4">
        <div className="flex h-16 shrink-0 items-center">
          <span className="text-2xl font-bold">CallFlow</span>
        </div>
        <nav className="flex flex-1 flex-col gap-y-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6",
                location === item.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="h-6 w-6 shrink-0" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-sidebar-border p-6">
        <div className="flex items-center gap-x-4">
          <div className="flex-1">
            <p className="text-sm font-semibold leading-6 text-sidebar-foreground">
              {user?.companyName}
            </p>
            <p className="text-xs text-sidebar-foreground/60">
              {user?.username}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
