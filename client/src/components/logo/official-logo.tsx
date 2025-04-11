import React from "react";

export const OfficialLogo: React.FC<{
  className?: string;
  width?: number;
  height?: number;
}> = ({
  className = "",
  width = 180,
  height = 60,
}) => {
  return (
    <div className={`${className}`}>
      <img 
        src="/assets/logo-unmi.png" 
        alt="Unmi Logo" 
        width={width} 
        height={height}
        className="object-contain"
      />
    </div>
  );
};