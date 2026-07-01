import React from 'react';

export function EmeraldLogo({ className = "w-6 h-6" }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
      role="img"
      aria-label="Logotipo Emerald"
    >
      <path d="M14 6h20l8 10-18 26L6 16 14 6Z" fill="currentColor" fillOpacity="0.14" />
      <path d="M14 6h20l8 10-18 26L6 16 14 6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path
        d="M6 16h36M14 6l4 10-8 0M34 6l-4 10 12 0M18 16l6 26 6-26M18 16h12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeOpacity="0.9"
      />
    </svg>
  );
}