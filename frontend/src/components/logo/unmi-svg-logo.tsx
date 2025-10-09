import React from "react";

export const UnmiSvgLogo: React.FC<{
  className?: string;
  width?: number;
  height?: number;
}> = ({
  className = "",
  width = 180,
  height = 60,
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 180 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Círculo rojo exterior */}
      <circle cx="35" cy="30" r="25" fill="#FF0000" />
      
      {/* Teléfono azul marino */}
      <path 
        d="M26 20C26 18.9 26.9 18 28 18H34C35.1 18 36 18.9 36 20V40C36 41.1 35.1 42 34 42H28C26.9 42 26 41.1 26 40V20Z" 
        fill="#003366" 
        transform="rotate(-45 31 30)"
      />
      <path 
        d="M43 26C44.1 26 45 26.9 45 28V34C45 35.1 44.1 36 43 36H23C21.9 36 21 35.1 21 34V28C21 26.9 21.9 26 23 26H43Z" 
        fill="#003366" 
        transform="rotate(-45 31 30)"
      />
      
      {/* Letra U */}
      <path 
        d="M70 22V38C70 41.3137 72.6863 44 76 44H78C81.3137 44 84 41.3137 84 38V22" 
        stroke="#003366" 
        strokeWidth="6" 
        strokeLinecap="round" 
      />
      
      {/* Letra n */}
      <path 
        d="M92 43V28M92 28C92 25 94 22 97 22C100 22 102 25 102 28V43" 
        stroke="#003366" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Letra m */}
      <path 
        d="M110 43V28M110 28C110 25 112 22 115 22C118 22 120 25 120 28V43M120 28C120 25 122 22 125 22C128 22 130 25 130 28V43" 
        stroke="#003366" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Letra i */}
      <path 
        d="M138 43V28" 
        stroke="#003366" 
        strokeWidth="6" 
        strokeLinecap="round" 
      />
      <circle cx="138" cy="18" r="3" fill="#003366" />
    </svg>
  );
};

