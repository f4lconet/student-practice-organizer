import type { SVGProps } from "react";

interface LogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function Logo({ size = 32, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Книга */}
      <rect x="8" y="6" width="16" height="20" rx="2" className="fill-primary/20 stroke-primary" strokeWidth="1.5" />
      {/* Корешок */}
      <line x1="16" y1="6" x2="16" y2="26" className="stroke-primary" strokeWidth="1.5" />
      {/* Строки текста */}
      <line x1="11" y1="11" x2="14" y2="11" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="15" x2="14" y2="15" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="19" x2="13" y2="19" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
      {/* Галочка */}
      <path d="M19 14L21 16L25 11" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Ручка */}
      <path d="M25 8L28 5" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function LogoFull({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <span className={`inline-flex items-center gap-2 font-heading font-bold ${className ?? ""}`}>
      <Logo size={size} />
      <span className="text-xl tracking-tight">Практика</span>
    </span>
  );
}