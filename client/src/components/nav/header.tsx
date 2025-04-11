import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { UnmiSvgLogo } from "@/components/logo/unmi-svg-logo";

interface HeaderProps {
  pageName: string;
}

export function Header({ pageName }: HeaderProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  return (
    <div className="mb-8 p-4">
      <div className="flex items-center mb-4">
        <UnmiSvgLogo width={100} className="mr-4" />
        {user?.companyName && (
          <h1 className="text-2xl font-bold unmi-header">
            {user.companyName}
          </h1>
        )}
      </div>
      <div className="flex items-center">
        <div className="w-1.5 h-8 bg-[#E53935] rounded-full mr-3"></div>
        <h2 className="text-2xl font-semibold unmi-subheader">
          {pageName}
        </h2>
      </div>
    </div>
  );
}