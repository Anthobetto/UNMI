import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface HeaderProps {
  pageName: string;
}

export function Header({ pageName }: HeaderProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  return (
    <div className="mb-8 p-4">
      <div className="flex items-center mb-4">
        <h1 className="unmi-client-name">
          {"Pastelería Paco"}
        </h1>
      </div>
      <div className="flex items-center mt-4">
        <div className="w-1.5 h-8 bg-[#FF0000] rounded-full mr-3"></div>
        <h2 className="text-2xl font-semibold text-[#333333]">
          {pageName}
        </h2>
      </div>
    </div>
  );
}