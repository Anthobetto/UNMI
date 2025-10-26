/**
 * Header Component
 * Shows page title, company name and language selector
 */

import { useAuth } from "@/contexts/AuthContext";
import { LanguageSelector } from "@/components/LanguageSelector";

interface HeaderProps {
  pageName: string;
}

export function Header({ pageName }: HeaderProps) {
  const { user } = useAuth();

  return (
    <div className="mb-6 p-4 border-b border-gray-200">
      <div className="flex justify-between items-center">
        {/* Left section: company name + page title */}
        <div className="flex flex-col">
          <h1 className="unmi-client-name font-bold mb-2 text-[#003366]">
            {user?.companyName || "UNMI"}
          </h1>
          <div className="flex items-center">
            <div className="w-1.5 h-8 bg-[#FF0000] rounded-full mr-3"></div>
            <h2 className="text-2xl font-semibold text-[#333333]">
              {pageName}
            </h2>
          </div>
        </div>

        {/* Right section: language selector */}
        <LanguageSelector />
      </div>
    </div>
  );
}
