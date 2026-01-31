
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 32 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main Shape - Slightly adjusted coordinates for tighter fit within 100x100 */}
      <path 
        d="M10 10C10 7.23858 12.2386 5 15 5H70C72.7614 5 75 7.23858 75 10V40C75 59.33 59.33 75 40 75H15C12.2386 75 10 72.7614 10 70V10Z" 
        fill="#00C994" 
      />
      {/* Accent shape - representing vision/focus */}
      <path 
        d="M75 50C75 50 75 70 60 85C60 85 85 85 90 70C95 55 75 50 75 50Z" 
        fill="#00C994" 
      />
      {/* Circular focus element */}
      <circle cx="78" cy="78" r="12" fill="#00C994" />
    </svg>
  );
};

export default Logo;
