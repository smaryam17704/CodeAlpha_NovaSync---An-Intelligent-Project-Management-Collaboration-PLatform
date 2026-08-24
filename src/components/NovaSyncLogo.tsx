import { type SVGProps } from "react";

interface NovaSyncLogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
  variant?: "default" | "dark";
}

export default function NovaSyncLogo({ size = 32, variant = "default", className, ...props }: NovaSyncLogoProps) {
  const gradId = `nsGrad-${variant}`;
  const highlightId = `nsHighlight-${variant}`;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id={gradId} x1="8" y1="56" x2="56" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1565C0" />
          <stop offset="35%" stopColor="#1E88E5" />
          <stop offset="65%" stopColor="#42A5F5" />
          <stop offset="100%" stopColor="#66BB6A" />
        </linearGradient>
        <linearGradient id={highlightId} x1="16" y1="48" x2="48" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#42A5F5" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#E3F2FD" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      
      {/* Main N shape — double chevron / layered N */}
      {/* Back chevron */}
      <path
        d="M12 52V16L28 16L36 28L36 16L44 16L52 16V52L36 52L28 40L28 52Z"
        fill={`url(#${gradId})`}
        opacity="0.3"
      />
      {/* Front chevron */}
      <path
        d="M14 50V18L27 18L34 28V18H41L50 18V50H34L27 40V50Z"
        fill={`url(#${gradId})`}
      />
      
      {/* Circuit board traces */}
      <path d="M8 32H14" stroke="#42A5F5" strokeWidth="0.8" opacity="0.5" />
      <path d="M8 32V28" stroke="#42A5F5" strokeWidth="0.8" opacity="0.4" />
      <path d="M8 28H10" stroke="#42A5F5" strokeWidth="0.6" opacity="0.3" />
      <circle cx="8" cy="32" r="1" fill="#42A5F5" opacity="0.5" />
      
      <path d="M50 32H56" stroke="#66BB6A" strokeWidth="0.8" opacity="0.5" />
      <path d="M56 32V36" stroke="#66BB6A" strokeWidth="0.8" opacity="0.4" />
      <path d="M54 36H56" stroke="#66BB6A" strokeWidth="0.6" opacity="0.3" />
      <circle cx="56" cy="32" r="1" fill="#66BB6A" opacity="0.5" />
      
      <path d="M32 8V18" stroke="#42A5F5" strokeWidth="0.8" opacity="0.4" />
      <circle cx="32" cy="8" r="1" fill="#42A5F5" opacity="0.4" />
      
      <path d="M32 50V56" stroke="#66BB6A" strokeWidth="0.8" opacity="0.4" />
      <circle cx="32" cy="56" r="1" fill="#66BB6A" opacity="0.4" />
      
      {/* Small circuit nodes */}
      <circle cx="10" cy="28" r="0.6" fill="#42A5F5" opacity="0.4" />
      <circle cx="54" cy="36" r="0.6" fill="#66BB6A" opacity="0.4" />
      
      {/* Highlight overlay */}
      <path
        d="M14 50V18L27 18L34 28V18H41L50 18V50H34L27 40V50Z"
        fill={`url(#${highlightId})`}
      />
    </svg>
  );
}
