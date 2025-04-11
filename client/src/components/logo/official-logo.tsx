import React from "react";

export const OfficialLogo: React.FC<{
  className?: string;
  width?: number;
  height?: number;
}> = ({
  className = "",
  width = 150,
  height = 50,
}) => {
  return (
    <div className={`${className} unmi-logo-wrapper`}>
      <img 
        src="/assets/logo-unmi-transparent.png" 
        alt="Unmi Logo" 
        width={width} 
        height={height}
        className="object-contain unmi-logo-image"
      />
    </div>
  );
};