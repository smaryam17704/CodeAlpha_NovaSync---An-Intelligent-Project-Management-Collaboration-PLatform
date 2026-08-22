import { type SVGProps } from "react";

interface NovaSyncLogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export default function NovaSyncLogo({ size = 32, className, ...props }: NovaSyncLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="novaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="50%" stopColor="#4d8eff" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="novaGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00b8e6" />
          <stop offset="50%" stopColor="#3d7aef" />
          <stop offset="100%" stopColor="#7c4def" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Background circle with subtle glow */}
      <circle cx="50" cy="50" r="48" fill="url(#novaGrad)" opacity="0.08" />
      
      {/* Stylized N shape - represents sync/connection */}
      <path
        d="M25 75 L25 25 L40 25 L60 55 L60 25 L75 25 L75 75 L60 75 L40 45 L40 75 Z"
        fill="url(#novaGrad)"
        filter="url(#glow)"
      />
      
      {/* Circuit board accent lines */}
      <line x1="18" y1="50" x2="25" y2="50" stroke="url(#novaGrad)" strokeWidth="1.5" opacity="0.4" />
      <line x1="75" y1="50" x2="82" y2="50" stroke="url(#novaGrad)" strokeWidth="1.5" opacity="0.4" />
      <line x1="50" y1="18" x2="50" y2="25" stroke="url(#novaGrad)" strokeWidth="1.5" opacity="0.4" />
      <line x1="50" y1="75" x2="50" y2="82" stroke="url(#novaGrad)" strokeWidth="1.5" opacity="0.4" />
      
      {/* Circuit nodes */}
      <circle cx="18" cy="50" r="2" fill="#00d4ff" opacity="0.5" />
      <circle cx="82" cy="50" r="2" fill="#8b5cf6" opacity="0.5" />
      <circle cx="50" cy="18" r="2" fill="#00d4ff" opacity="0.5" />
      <circle cx="50" cy="82" r="2" fill="#8b5cf6" opacity="0.5" />
      
      {/* Small circuit traces */}
      <path d="M18 50 L15 47 L12 50" stroke="#00d4ff" strokeWidth="0.8" fill="none" opacity="0.3" />
      <path d="M82 50 L85 47 L88 50" stroke="#8b5cf6" strokeWidth="0.8" fill="none" opacity="0.3" />
    </svg>
  );
}
