import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface HeaderProps {
  pageName: string;
}

export function Header({ pageName }: HeaderProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  return (
    <div className="mb-8">
      {user?.companyName && (
        <h1 className="text-2xl font-bold text-[#0A1930] mb-1">
          {user.companyName}
        </h1>
      )}
      <h2 className="text-3xl font-bold text-[#0A1930]">
        {pageName}
      </h2>
    </div>
  );
}