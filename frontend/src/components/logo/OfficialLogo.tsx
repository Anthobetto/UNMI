// Logo Oficial UNMI
// Componente reutilizable con tamaño configurable

import React from 'react';

interface OfficialLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function OfficialLogo({ width = 200, height = 60, className }: OfficialLogoProps) {
  return (
    <div className={className}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 200 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* UNMI Logo Design */}
        <rect width="200" height="60" rx="8" fill="#E53935"/>
        <text
          x="100"
          y="35"
          textAnchor="middle"
          fill="white"
          fontSize="24"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          UNMI
        </text>
        <text
          x="100"
          y="50"
          textAnchor="middle"
          fill="white"
          fontSize="10"
          fontFamily="Arial, sans-serif"
        >
          Customer Recovery
        </text>
      </svg>
    </div>
  );
}




