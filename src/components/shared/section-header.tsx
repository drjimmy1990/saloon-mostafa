import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  gradient?: boolean;
}

export function SectionHeader({ title, subtitle, children, className = "", gradient }: SectionHeaderProps) {
  return (
    <div className={`text-center mb-12 md:mb-16 ${className}`}>
      <h2
        className={`text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight ${gradient ? "gradient-text" : "text-dark"}`}
        style={{ fontFamily: "'Tajawal', sans-serif" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed tracking-wide">
          {subtitle}
        </p>
      )}
      {children}
      {/* Decorative line */}
      <div className="flex items-center justify-center gap-2 mt-5">
        <div className="w-10 h-[2px] rounded-full bg-gradient-to-l from-terracotta/40 to-transparent" />
        <div className="w-2.5 h-2.5 rounded-full bg-terracotta shadow-sm shadow-terracotta/30" />
        <div className="w-10 h-[2px] rounded-full bg-gradient-to-r from-terracotta/40 to-transparent" />
      </div>
    </div>
  );
}
