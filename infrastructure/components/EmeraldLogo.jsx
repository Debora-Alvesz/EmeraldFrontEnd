import React from 'react';

export function EmeraldLogo({ className = 'h-6 w-6', ...props }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M32 6L54 18V46L32 58L10 46V18L32 6Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M32 14L46 22V42L32 50L18 42V22L32 14Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <path d="M24 30C24 25.58 27.58 22 32 22C36.42 22 40 25.58 40 30C40 34.42 36.42 38 32 38C27.58 38 24 34.42 24 30Z" fill="currentColor" />
    </svg>
  );
}
