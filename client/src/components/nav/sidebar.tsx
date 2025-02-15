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
        <div className="flex h-16 shrink-0 items-center justify-between">
          <span className="text-2xl font-bold">CallFlow</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Billing className="mr-2 h-4 w-4" />
                <span>Facturación</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Servicio al Cliente</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        </div>
      </div>
    </div>
  );
}