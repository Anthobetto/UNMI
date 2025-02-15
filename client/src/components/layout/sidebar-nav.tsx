import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  PhoneCall,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";

export default function SidebarNav() {
  const { logoutMutation } = useAuth();

  return (
    <div className="w-64 min-h-screen bg-sidebar border-r p-4">
      <div className="flex items-center gap-2 mb-8 pl-4">
        <PhoneCall className="h-6 w-6 text-primary" />
        <span className="font-bold text-xl">CallFlow</span>
      </div>

      <nav className="space-y-2">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="w-full justify-start"
            size="lg"
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            Dashboard
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="w-full justify-start"
            size="lg"
          >
            <Building2 className="h-5 w-5 mr-3" />
            Locations
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="w-full justify-start"
            size="lg"
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </Button>
        </Link>
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
