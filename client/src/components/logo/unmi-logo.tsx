import React from "react";

export const UnmiLogo: React.FC<{ size?: number; className?: string }> = ({ 
  size = 40, 
  className = "" 
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="20" cy="20" r="18" fill="#E53935" stroke="#E53935" strokeWidth="2" />
        <path
          d="M15 17.5C15 16.1193 16.1193 15 17.5 15C18.8807 15 20 16.1193 20 17.5V25C20 25.5523 19.5523 26 19 26C18.4477 26 18 25.5523 18 25V17.5C18 17.2239 17.7761 17 17.5 17C17.2239 17 17 17.2239 17 17.5V25C17 25.5523 16.5523 26 16 26C15.4477 26 15 25.5523 15 25V17.5Z"
          fill="white"
        />
        <path
          d="M25 17.5C25 16.1193 23.8807 15 22.5 15C21.1193 15 20 16.1193 20 17.5V25C20 25.5523 20.4477 26 21 26C21.5523 26 22 25.5523 22 25V17.5C22 17.2239 22.2239 17 22.5 17C22.7761 17 23 17.2239 23 17.5V25C23 25.5523 23.4477 26 24 26C24.5523 26 25 25.5523 25 25V17.5Z"
          fill="white"
        />
        <path
          d="M14 21H12C11.4477 21 11 21.4477 11 22C11 22.5523 11.4477 23 12 23H14V21Z"
          fill="white"
        />
        <path
          d="M28 21H26V23H28C28.5523 23 29 22.5523 29 22C29 21.4477 28.5523 21 28 21Z"
          fill="white"
        />
      </svg>
      <span className="text-[#0A1930] font-bold text-2xl ml-2">Unmi</span>
    </div>
  );
};