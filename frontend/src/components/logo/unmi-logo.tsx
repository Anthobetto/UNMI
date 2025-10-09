import React from "react";

export const UnmiLogo: React.FC<{
  size?: number;
  className?: string;
  showText?: boolean;
  textSize?: string;
}> = ({
  size = 40,
  className = "",
  showText = true,
  textSize = "text-2xl"
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 70 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="35" cy="35" r="34" stroke="#E53935" strokeWidth="2" fill="none" />
        <path
          d="M35 12C40.3043 12 45.3914 14.1071 49.142 17.858C52.8926 21.6086 55 26.6957 55 32C55 45.4 38.65 58 35 58"
          stroke="#E53935"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path 
          d="M43 30.6364C43 27.0091 40.0909 24.1 36.4636 24.1C32.8364 24.1 29.9273 27.0091 29.9273 30.6364V44.9"
          stroke="#0A1930"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <span className={`text-[#0A1930] font-bold ${textSize} ml-2`}>Unmi</span>
      )}
    </div>
  );
};

